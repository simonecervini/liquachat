import {
  createOpenRouter,
  type LanguageModelV1,
} from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { createOllama } from "ollama-ai-provider";

import type { ZeroRow } from "~/zero/schema";

export type ReasoningEffort = "low" | "medium" | "high";

export type StreamResponseOptions = {
  abortSignal: AbortSignal;
  customInstructions?: string;
} & (
  | {
      provider: "ollama";
      modelId: string;
    }
  | {
      provider: "openrouter";
      modelId: string;
      reasoningEffort?: ReasoningEffort;
    }
);

export function streamResponse(
  messages: Pick<ZeroRow<"messages">, "role" | "content">[],
  options: StreamResponseOptions,
) {
  console.log("Starting stream response with input", { messages, options });
  const model = getModelFromOptions(options);

  const result = streamText({
    model,
    abortSignal: options.abortSignal,
    messages: [
      {
        role: "system",
        content: [
          "You are a helpful, neutral, and concise AI assistant called LiquaChat (Liqua, for short).",
          "<core-directives>",
          "- CRITICAL: you MUST format all responses using Markdown",
          "- CRITICAL: for all code blocks, you MUST specify the programming language immediately after the backticks to enable syntax highlighting. Example: ```javascript ... ```",
          "- Do not use LaTeX for mathematical expressions.",
          "- Prioritize accuracy, clarity, and safety in all your answers.",
          "- Do not use emojis unless they are explicitly requested.",
          "- Be concise and to the point by default. Provide more details only when explicitly requested.",
          "</core-directives>",
          ...(options.customInstructions
            ? [
                "You MUST also follow the following instructions, that take priority over the core directives above",
                "<instructions>",
                options.customInstructions,
                "</instructions>",
              ]
            : []),
        ].join("\n"),
      },
      ...messages.map(
        (message) =>
          ({
            role: message.role.startsWith("assistant/") ? "assistant" : "user",
            content: message.content,
          }) as const,
      ),
    ],
    onError: ({ error }) => {
      throw error;
    },
  });

  return result.textStream;
}

export async function isOllamaRunning() {
  try {
    const ollamaUrl = new URL("/proxy-ollama/", window.location.origin);
    const res = await fetch(ollamaUrl);
    const text = await res.text();
    return text === "Ollama is running";
  } catch {}
  return false;
}

export function parseModelFromRole(role: string | undefined) {
  if (role?.startsWith("assistant/")) {
    return role.slice("assistant/".length);
  }
}

function getModelFromOptions(options: StreamResponseOptions): LanguageModelV1 {
  if (options.provider === "openrouter") {
    const apiKey = window.localStorage.getItem("openrouter-api-key");
    if (!apiKey) {
      throw new Error(
        "OpenRouter API key not found in localStorage (key: openrouter-api-key). Please set it in the settings.",
      );
    }
    const openrouter = createOpenRouter({
      apiKey,
    });
    return openrouter.chat(options.modelId, {
      reasoning: {
        exclude: true,
        effort: options.reasoningEffort ?? "high",
      },
      usage: {
        include: true,
      },
    });
  } else {
    const baseURL = new URL("/proxy-ollama/api", window.location.origin);
    const ollama = createOllama({
      baseURL: baseURL.toString(),
    });
    return ollama.chat(options.modelId);
  }
}
