// The specs' own ManageSieve client, against a server that ends a login as
// it is made. sora does that to every login in flight on a node when it ends
// any account's sessions, as its credential-change poll does a few seconds
// after a spec deletes an account (#982).

import { createServer, type Server, type Socket } from "node:net";
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

/** Signs in each session, then lets the test answer its initial NOOP. */
async function noopServer(answer: (socket: Socket, session: number) => void): Promise<{
  sessions: () => number;
  address: string;
  close: () => Promise<void>;
}> {
  let sessions = 0;
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    const session = ++sessions;
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});
    socket.write('"IMPLEMENTATION" "fake"\r\n"SASL" "PLAIN"\r\nOK\r\n');
    let pending = "";
    socket.on("data", (chunk) => {
      pending += chunk.toString("utf8");
      for (let end = pending.indexOf("\r\n"); end >= 0; end = pending.indexOf("\r\n")) {
        const line = pending.slice(0, end);
        pending = pending.slice(end + 2);
        if (line === "NOOP") answer(socket, session);
        else socket.write("OK\r\n");
        if (socket.destroyed || socket.writableEnded) return;
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  return {
    sessions: () => sessions,
    address: `127.0.0.1:${port}`,
    close: async () => {
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}

async function atSieveAddress(address: string, run: () => Promise<void>): Promise<void> {
  const real = process.env.SIEVE_ADDR;
  process.env.SIEVE_ADDR = address;
  try {
    await run();
  } finally {
    if (real === undefined) delete process.env.SIEVE_ADDR;
    else process.env.SIEVE_ADDR = real;
  }
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

test("reads the scripts after the first NOOP gets a TCP reset", async () => {
  const remote = await noopServer((socket, session) => {
    if (session === 1) socket.resetAndDestroy();
    else socket.write("OK\r\n");
  });
  try {
    await atSieveAddress(remote.address, async () => {
      expect(await storedScripts()).toEqual([]);
      expect(remote.sessions()).toBe(2);
    });
  } finally {
    await remote.close();
  }
});

test("stops after two sessions when every NOOP gets a TCP reset", async () => {
  const remote = await noopServer((socket) => socket.resetAndDestroy());
  try {
    await atSieveAddress(remote.address, async () => {
      await expect(storedScripts()).rejects.toThrow();
      expect(remote.sessions()).toBe(2);
    });
  } finally {
    await remote.close();
  }
});

for (const status of ["NO", "BYE"]) {
  test(`does not retry a ${status} refusal even when the server closes the socket`, async () => {
    const refusal = `${status} "NOOP refused"`;
    const remote = await noopServer((socket) => socket.end(`${refusal}\r\n`));
    try {
      await atSieveAddress(remote.address, async () => {
        await expect(storedScripts()).rejects.toThrow(`ManageSieve: ${refusal}`);
        expect(remote.sessions()).toBe(1);
      });
    } finally {
      await remote.close();
    }
  });
}
