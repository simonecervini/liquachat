import {
  createOpenRouter,
  type LanguageModelV1,
} from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { ollama } from "ollama-ai-provider";

type StreamResponseOptions =
  | {
      provider: "ollama";
      modelId: string;
    }
  | {
      provider: "openrouter";
      modelId: string;
    };

export function streamResponse(prompt: string, options: StreamResponseOptions) {
  const model = getModelFromOptions(options);

  const result = streamText({
    model,
    prompt,
  });

  return result.textStream;
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
    return openrouter.chat(options.modelId);
  } else {
    return ollama.chat(options.modelId);
  }
}
