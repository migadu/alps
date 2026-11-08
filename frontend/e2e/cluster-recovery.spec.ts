import { createHash } from 'node:crypto';
import net from 'node:net';
import type { APIRequestContext, APIRequest, Page } from '@playwright/test';
import { createAccount, deleteAccount, expect, signInAs, test } from './fixtures';

const primary = (process.env.ALPS_URL ?? 'http://127.0.0.1:8900').replace('127.0.0.1', 'localhost');
const secondary = (process.env.ALPS_SECONDARY_URL ?? '').replace('127.0.0.1', 'localhost');
const password = 'cluster-recovery-password-123';
test.use({ baseURL: primary });
test.skip(!secondary, 'Run with E2E_CLUSTER=1 for two independent Alps processes');

async function pending(request: APIRequest, url: string, address: string): Promise<APIRequestContext> {
  const api = await request.newContext({ baseURL: url, extraHTTPHeaders: { Origin: url } });
  const login = await api.post('/session', { data: { username: address, password } });
  expect(login.status()).toBe(200);
  expect((await login.json()).requires_2fa).toBe(true);
  return api;
}

async function enroll(page: Page, address: string): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: {
    protocol: 'ctap2', transport: 'internal', hasResidentKey: true,
    hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true,
  } });
  await signInAs(page, address, password);
  await page.goto('/#/settings/webauthn');
  const pane = page.locator('alps-webauthn-settings');
  await pane.getByRole('button', { name: 'Add Security Key', exact: true }).click();
  await pane.locator('ui-prompt input').fill('Cluster laptop');
  await pane.locator('ui-prompt').getByRole('button', { name: 'Save', exact: true }).click();
  const shown = pane.locator('ui-modal').filter({ hasText: 'Save Your Recovery Codes' });
  await expect(shown.locator('li')).toHaveCount(10);
  const codes = await shown.locator('li').allTextContents();
  await shown.getByRole('button', { name: 'Done', exact: true }).click();
  return codes;
}

// Standard LOGIN and SETMETADATA, directly against the same backend. This
// leaves precisely the durable proposal a crashed node leaves, then delivers
// its delayed write after another node has successfully consumed a code.
async function metadata(address: string, entry: string, value: unknown): Promise<void> {
  const [host, port] = (process.env.IMAP_ADDR ?? '127.0.0.1:8901').split(':');
  const socket = net.connect({ host, port: Number(port) });
  let buffer = '';
  const waiters: Array<() => void> = [];
  socket.on('data', (data) => { buffer += data.toString(); waiters.splice(0).forEach((f) => f()); });
  const wait = async (pattern: RegExp) => {
    const deadline = Date.now() + 5000;
    while (!pattern.test(buffer)) {
      if (Date.now() > deadline) throw new Error('IMAP metadata command timed out');
      await new Promise<void>((resolve) => { waiters.push(resolve); setTimeout(resolve, 20); });
    }
  };
  try {
    await wait(/\* OK/);
    socket.write(`a LOGIN ${JSON.stringify(address)} ${JSON.stringify(password)}\r\n`);
    await wait(/a (OK|NO|BAD)[^\r]*\r\n/);
    expect(buffer).toMatch(/a OK/);
    socket.write(`b SETMETADATA "" (${JSON.stringify(entry)} ${JSON.stringify(JSON.stringify(value))})\r\n`);
    await wait(/b (OK|NO|BAD)[^\r]*\r\n/);
    expect(buffer).toMatch(/b OK/);
  } finally { socket.destroy(); }
}

test('two clustered processes consume each code once and survive an abandoned writer', async ({ page, playwright }) => {
  const address = `cluster-recovery-${Date.now()}@example.test`;
  await createAccount({ address, password });
  const contexts: APIRequestContext[] = [];
  try {
    const codes = await enroll(page, address);
    for (let i = 0; i < 3; i++) {
      const a = await pending(playwright.request, primary, address);
      const b = await pending(playwright.request, secondary, address);
      contexts.push(a, b);
      const replies = await Promise.all([a.post('/webauthn/verify/recovery', { data: { code: codes[i] } }), b.post('/webauthn/verify/recovery', { data: { code: codes[i] } })]);
      expect(replies.filter((r) => r.status() === 200)).toHaveLength(1);
      const winner = replies[0].status() === 200 ? a : b;
      const loser = winner === a ? b : a;
      expect((await winner.get('/mailboxes/INBOX')).status()).toBe(200);
      expect((await loser.get('/mailboxes/INBOX')).status()).toBe(401);
      expect((await loser.post('/webauthn/verify/recovery', { data: { code: codes[i] } })).status()).toBe(400);
    }

    const abandoned = '/private/vendor/alps/webauthn-state/00000000000000100000-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    await metadata(address, abandoned, { version: 1, committed: false, data: null });
    const survivor = await pending(playwright.request, secondary, address);
    contexts.push(survivor);
    expect((await survivor.post('/webauthn/verify/recovery', { data: { code: codes[3] } })).status()).toBe(200);
    await metadata(address, abandoned, { version: 1, committed: true, data: {
      enabled: true, credentials: [{ name: 'stale', credential: { id: 'bm9uZQ==' } }],
      recovery_codes: codes.map((code) => createHash('sha256').update(code.replaceAll('-', '')).digest('hex')),
    } });
    const resumed = await pending(playwright.request, primary, address);
    contexts.push(resumed);
    expect((await resumed.post('/webauthn/verify/recovery', { data: { code: codes[3] } })).status()).toBe(400);
    expect((await resumed.post('/webauthn/verify/recovery', { data: { code: codes[4] } })).status()).toBe(200);
    expect((await resumed.get('/settings/2fa')).status()).toBe(200);
    expect((await (await resumed.get('/settings/2fa')).json()).recoveryCodesLeft).toBe(5);
  } finally {
    await Promise.all(contexts.map((context) => context.dispose()));
    await deleteAccount(address);
  }
});
