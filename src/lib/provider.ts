import { anthropic } from "@ai-sdk/anthropic";

const MODEL = "claude-haiku-4-5";

export function getLanguageModel() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.warn("No ANTHROPIC_API_KEY found. Set it in .env to enable AI features.");
  }

  return anthropic(MODEL);
}
