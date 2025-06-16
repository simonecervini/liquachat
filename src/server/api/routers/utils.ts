import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";

export const utilsRouter = createTRPCRouter({
  getModels: publicProcedure.query(async () => {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const json = (await res.json()) as unknown;
    const schema = z.object({
      data: z
        .object({
          id: z.string(),
          name: z.string(),
          created: z.number(), // Unix timestamp in seconds
          context_length: z.number().nullable(),
          architecture: z.object({
            input_modalities: z.string().array(),
          }),
          supported_parameters: z.string().array(),
        })
        .array(),
    });
    const models = schema.parse(json).data;
    return models.map((model) => ({
      id: model.id,
      name: model.name,
      createdAt: model.created * 1000,
      contextLength: model.context_length,
      reasoning: model.supported_parameters.includes("reasoning"),
      inputModalities: {
        text: model.architecture.input_modalities.includes("text"),
        image: model.architecture.input_modalities.includes("image"),
        file: model.architecture.input_modalities.includes("file"),
      },
    }));
  }),
});
