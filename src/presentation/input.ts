import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export type AskFn = (question: string) => Promise<string>;

export function createStdinAsk(): { ask: AskFn; close: () => void } {
  const rl = createInterface({ input: stdin, output: stdout });
  const queue: string[] = [];
  const waiters: Array<{ resolve: (line: string) => void; reject: (err: Error) => void }> = [];
  let ended = false;
  rl.on("line", (line) => {
    const waiter = waiters.shift();
    if (waiter !== undefined) waiter.resolve(line);
    else queue.push(line);
  });
  rl.on("close", () => {
    ended = true;
    for (const waiter of waiters.splice(0)) waiter.reject(new Error("stdin closed"));
  });
  const ask: AskFn = (question) => {
    stdout.write(question);
    const queued = queue.shift();
    if (queued !== undefined) return Promise.resolve(queued);
    if (ended) return Promise.reject(new Error("stdin closed"));
    return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
  };
  return { ask, close: () => rl.close() };
}
