export type Color = "cyan" | "yellow" | "green" | "red";
export type ColorizeFn = (text: string, color: Color) => string;

const ANSI_COLORS: Record<Color, string> = {
  cyan: "\u001b[36m",
  yellow: "\u001b[33m",
  green: "\u001b[32m",
  red: "\u001b[31m",
};
const ANSI_RESET = "\u001b[0m";

export function ansiColorize(text: string, color: Color): string {
  return `${ANSI_COLORS[color]}${text}${ANSI_RESET}`;
}

export const noColor: ColorizeFn = (text) => text;
