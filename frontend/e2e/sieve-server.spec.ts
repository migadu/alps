// The specs' own ManageSieve client, against a server that ends a login as
// it is made. sora does that to every login in flight on a node when it ends
// any account's sessions, as its credential-change poll does a few seconds
// after a spec deletes an account (#982).

import { createServer, type Server } from "node:net";
import { expect, test } from "./fixtures";
import { storedScripts } from "./sieve-server";

/** Answers AUTHENTICATE with OK and closes its first session there; later
 * sessions hold no scripts and answer every command OK. */
async function endedLoginServer(): Promise<{ server: Server; sessions: () => number; address: string }> {
  let sessions = 0;
  const server = createServer((socket) => {
    const first = ++sessions === 1;
    socket.write('"IMPLEMENTATION" "fake"\r\n"SASL" "PLAIN"\r\nOK\r\n');
    let pending = "";
    socket.on("data", (chunk) => {
      pending += chunk.toString("utf8");
      for (let end = pending.indexOf("\r\n"); end >= 0; end = pending.indexOf("\r\n")) {
        const line = pending.slice(0, end);
        pending = pending.slice(end + 2);
        socket.write("OK\r\n");
        if (first && line.startsWith("AUTHENTICATE")) {
          socket.destroy();
          return;
        }
      }
    });
    socket.on("error", () => {});
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  return { server, sessions: () => sessions, address: `127.0.0.1:${port}` };
}

test("reads the scripts after the server ends the first login as it is made", async () => {
  const { server, sessions, address } = await endedLoginServer();
  const real = process.env.SIEVE_ADDR;
  process.env.SIEVE_ADDR = address;
  try {
    expect(await storedScripts()).toEqual([]);
    expect(sessions()).toBe(2);
  } finally {
    if (real === undefined) delete process.env.SIEVE_ADDR;
    else process.env.SIEVE_ADDR = real;
    server.close();
  }
});
