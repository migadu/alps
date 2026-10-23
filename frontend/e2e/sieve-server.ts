// The ManageSieve server, spoken to directly.
//
// The page can only say what alps believes. Whether a script is stored, which
// one is active and what it holds are the server's facts, so they are read
// from the server — the way any other Sieve client would see them.

import { connect, type Socket } from "node:net";
import { USER } from "./fixtures";

export type SieveScript = { name: string; active: boolean; content: string };

/** The ManageSieve server the harness started, as `host:port`. */
function sieveAddress(): { host: string; port: number } {
  const [host, port] = (process.env.SIEVE_ADDR ?? "127.0.0.1:8902").split(":");
  return { host, port: Number(port) };
}

const quote = (value: string) => `"${value.replace(/[\\"]/g, "\\$&")}"`;

/** A minimal RFC 5804 client session, signed in as {@link USER}. */
class SieveSession {
  private buffer = Buffer.alloc(0);
  private failure: Error | null = null;
  private wake: () => void = () => {};
  private readonly socket: Socket;

  private constructor(socket: Socket) {
    this.socket = socket;
    socket.on("data", (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.wake();
    });
    socket.on("error", (error) => {
      this.failure = error;
      this.wake();
    });
    socket.on("close", () => {
      this.failure ??= new Error("the ManageSieve server closed the connection");
      this.wake();
    });
  }

  static async open(): Promise<SieveSession> {
    const session = new SieveSession(connect(sieveAddress()));
    await session.response(); // the greeting: capabilities, then OK
    const token = Buffer.from(`\0${USER.address}\0${USER.password}`).toString("base64");
    await session.command(`AUTHENTICATE "PLAIN" ${quote(token)}`);
    return session;
  }

  close(): void {
    this.socket.end("LOGOUT\r\n");
  }

  async scripts(): Promise<SieveScript[]> {
    const scripts: SieveScript[] = [];
    for (const entry of await this.command("LISTSCRIPTS")) {
      const match = /^"((?:[^"\\]|\\.)*)"( ACTIVE)?$/i.exec(entry);
      if (!match) throw new Error(`unexpected LISTSCRIPTS entry: ${entry}`);
      const name = match[1].replace(/\\(.)/g, "$1");
      const [content = ""] = await this.command(`GETSCRIPT ${quote(name)}`);
      scripts.push({ name, active: Boolean(match[2]), content });
    }
    return scripts;
  }

  async putScript(name: string, content: string): Promise<void> {
    this.socket.write(`PUTSCRIPT ${quote(name)} {${Buffer.byteLength(content)}+}\r\n${content}\r\n`);
    await this.response();
  }

  async command(line: string): Promise<string[]> {
    this.socket.write(`${line}\r\n`);
    return this.response();
  }

  /** One response: its data lines with literals inlined, up to OK. NO and BYE
   * throw, carrying the server's reason. */
  private async response(): Promise<string[]> {
    const data: string[] = [];
    for (;;) {
      const line = await this.line();
      if (/^OK\b/i.test(line)) return data;
      if (/^(NO|BYE)\b/i.test(line)) throw new Error(`ManageSieve: ${line}`);
      const literal = /^\{(\d+)\+?\}$/.exec(line);
      if (literal) data.push(await this.octets(Number(literal[1])));
      else if (line !== "") data.push(line);
    }
  }

  private async line(): Promise<string> {
    for (;;) {
      const end = this.buffer.indexOf("\r\n");
      if (end >= 0) {
        const line = this.buffer.subarray(0, end).toString("utf8");
        this.buffer = this.buffer.subarray(end + 2);
        return line;
      }
      await this.more();
    }
  }

  private async octets(count: number): Promise<string> {
    while (this.buffer.length < count) await this.more();
    const text = this.buffer.subarray(0, count).toString("utf8");
    this.buffer = this.buffer.subarray(count);
    return text;
  }

  private async more(): Promise<void> {
    if (this.failure) throw this.failure;
    await new Promise<void>((resolve) => {
      this.wake = resolve;
    });
  }
}

async function withSieve<T>(run: (session: SieveSession) => Promise<T>): Promise<T> {
  const session = await SieveSession.open();
  try {
    return await run(session);
  } finally {
    session.close();
  }
}

/** Every script stored for {@link USER}, with its body. */
export const storedScripts = () => withSieve((session) => session.scripts());

/** Stores `content` under `name` and makes it the active script, as another
 * Sieve client would. */
export const storeActiveScript = (name: string, content: string) =>
  withSieve(async (session) => {
    await session.putScript(name, content);
    await session.command(`SETACTIVE ${quote(name)}`);
  });
