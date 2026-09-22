import { homedir } from "node:os";
import { join } from "node:path";

export function configPath(): string {
  const home = process.env["USERPROFILE"] ?? process.env["HOME"] ?? homedir();
  return join(home, ".weather-cli", "config.json");
}
