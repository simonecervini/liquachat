"use client";

import * as React from "react";
import {
  BrainIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  CodeIcon,
  PiIcon,
} from "lucide-react";

import { Button } from "~/components/system/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "~/components/system/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/system/popover";
import { cn } from "~/lib/cn";
import { api, type RouterOutputs } from "~/lib/trpc";

export const DEFAULT_MODEL = "google/gemini-2.5-flash-preview";

export const modelsDict = [
  // Ollama
  {
    id: "ollama/deepseek-r1:8b",
    name: "DeepSeek-R1 (8B)",
    // https://artificialanalysis.ai/models/deepseek-r1-qwen3-8b
    scores: {
      intelligence: 52,
      coding: 36,
      math: 79,
    },
  },
  // Google
  {
    id: "google/gemini-2.5-flash-preview",
    name: "Gemini 2.5 Flash",
    // https://artificialanalysis.ai/models/gemini-2-5-flash/
    scores: {
      intelligence: 53,
      coding: 39,
      math: 72,
    },
  },
  {
    id: "google/gemini-2.5-flash-preview:thinking",
    name: "Gemini 2.5 Flash (thinking)",
    // https://artificialanalysis.ai/models/gemini-2-5-flash-reasoning/?
    scores: {
      intelligence: 65,
      coding: 54,
      math: 90,
    },
  },
  {
    id: "google/gemini-2.5-pro-preview",
    name: "Gemini 2.5 Pro",
    // https://artificialanalysis.ai/models/gemini-2-5-pro
    scores: {
      intelligence: 70,
      coding: 61,
      math: 93,
    },
  },
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    // https://artificialanalysis.ai/models/gemini-2-0-flash
    scores: {
      intelligence: 48,
      coding: 32,
      math: 63,
    },
  },
  {
    id: "google/gemini-2.0-flash-lite-001",
    name: "Gemini 2.0 Flash Lite",
    // https://artificialanalysis.ai/models/gemini-2-0-flash-lite-001
    scores: {
      intelligence: 41,
      coding: 22,
      math: 57,
    },
  },
  {
    id: "openai/o4-mini", // "openai/o4-mini-high" = "openai/o4-mini" with reasoning.effort = "high"
    name: "o4 mini",
    // https://artificialanalysis.ai/models/o4-mini/
    scores: {
      intelligence: 70,
      coding: 63,
      math: 96,
    },
  },
  {
    id: "openai/o3-mini", // "openai/o3-mini-high" = "openai/o3-mini" with reasoning.effort = "high"
    name: "o3 mini",
    // https://artificialanalysis.ai/models/o3-mini-high
    scores: {
      intelligence: 66,
      coding: 57,
      math: 92,
    },
  },
  {
    id: "openai/o3-pro",
    name: "o3 Pro",
    // https://artificialanalysis.ai/models/o3-pro
    scores: {
      intelligence: 71,
      // Not available yet
      // coding: 0,
      // math: 0,
    },
  },
  {
    id: "openai/o3",
    name: "o3",
    scores: {
      intelligence: 70,
      coding: 60,
      math: 95,
    },
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT 4o-mini",
    // https://artificialanalysis.ai/models/gpt-4o-mini
    scores: {
      intelligence: 36,
      coding: 23,
      math: 45,
    },
  },
  {
    id: "openai/gpt-4o",
    name: "GPT 4o",
    // Not sure about this link, it should be the latest version
    // https://artificialanalysis.ai/models/gpt-4o-chatgpt-03-25
    scores: {
      intelligence: 50,
      coding: 40,
      math: 61,
    },
  },
  {
    id: "openai/gpt-4.1",
    name: "GPT 4.1",
    // https://artificialanalysis.ai/models/gpt-4-1
    scores: {
      intelligence: 53,
      coding: 42,
      math: 67,
    },
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT 4.1 Mini",
    // https://artificialanalysis.ai/models/gpt-4-1-mini
    scores: {
      intelligence: 53,
      coding: 44,
      math: 68,
    },
  },
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT 4.1 Nano",
    // https://artificialanalysis.ai/models/gpt-4-1-nano
    scores: {
      intelligence: 41,
      coding: 29,
      math: 54,
    },
  },
];

export interface ModelComboboxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  slotProps?: {
    popoverContent?: React.ComponentProps<typeof PopoverContent>;
  };
}

export function ModelCombobox(props: ModelComboboxProps) {
  const { value, onChange, className, slotProps } = props;
  const [open, setOpen] = React.useState(false);
  const { data: allModels, status } = api.utils.getModels.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const models = React.useMemo(() => {
    if (!allModels) return undefined;

    const modelsWithScores: ((typeof allModels)[number] & {
      scores: (typeof modelsDict)[number]["scores"];
    })[] = [
      {
        id: "ollama/deepseek-r1:8b",
        name: "DeepSeek-R1 (8B)",
        createdAt: 0,
        contextLength: 128_000,
        reasoning: false,
        inputModalities: {
          text: true,
          file: false,
          image: false,
        },
        scores: {
          intelligence: 52,
          coding: 36,
          math: 79,
        },
      },
    ];

    for (const model of allModels) {
      const dictModel = modelsDict.find((m) => m.id === model.id);
      if (dictModel) {
        modelsWithScores.push({
          ...model,
          name: dictModel.name,
          scores: dictModel.scores,
        });
      }
    }

    const allIntelligenceScores = modelsWithScores.map(
      (m) => m.scores.intelligence,
    );
    const allCodingScores = modelsWithScores.flatMap(
      (m) => m.scores.coding ?? [],
    );
    const allMathScores = modelsWithScores.flatMap((m) => m.scores.math ?? []);

    const calculatePercentile = (
      value: number,
      allValues: number[],
    ): number => {
      const sorted = [...allValues].sort((a, b) => a - b);
      const index = sorted.findIndex((v) => v >= value);
      return (index / (sorted.length - 1)) * 100;
    };

    const percentileToScale = (percentile: number): 1 | 2 | 3 => {
      if (percentile >= 66) return 3;
      if (percentile >= 33) return 2;
      return 1;
    };

    const modelsWithEvaluations = modelsWithScores.map((model) => ({
      ...model,
      evaluations: {
        intelligence:
          model.scores.intelligence !== undefined
            ? percentileToScale(
                calculatePercentile(
                  model.scores.intelligence,
                  allIntelligenceScores,
                ),
              )
            : null,
        coding:
          model.scores.coding !== undefined
            ? percentileToScale(
                calculatePercentile(model.scores.coding, allCodingScores),
              )
            : null,
        math:
          model.scores.math !== undefined
            ? percentileToScale(
                calculatePercentile(model.scores.math, allMathScores),
              )
            : null,
      },
    }));

    return modelsWithEvaluations.sort((a, b) => a.name.localeCompare(b.name));
  }, [allModels]);

  const handleSelect = (newValue: string) => {
    onChange(newValue === value ? "" : newValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between text-xs", className)}
        >
          {value
            ? (models?.find((model) => model.id === value)?.name ??
              "Select model...")
            : "Select model..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        {...slotProps?.popoverContent}
        className={cn("p-0", slotProps?.popoverContent?.className)}
      >
        <Command
          filter={(value, search, keywords) => {
            const extendValue = value + " " + (keywords ?? []).join(" ");
            if (extendValue.toLowerCase().includes(search.toLowerCase())) {
              return 1;
            }
            return 0;
          }}
        >
          <CommandInput placeholder="Search model..." />
          <CommandList>
            {status === "pending" ? (
              <CommandLoading />
            ) : (
              <>
                <CommandEmpty>No model found.</CommandEmpty>

                <ModelsGroup
                  heading="Local models (Ollama)"
                  models={
                    models?.filter((model) => model.id.startsWith("ollama/")) ??
                    []
                  }
                  value={value}
                  onSelect={handleSelect}
                />

                <ModelsGroup
                  heading="Google"
                  models={
                    models?.filter((model) => model.id.startsWith("google/")) ??
                    []
                  }
                  value={value}
                  onSelect={handleSelect}
                />

                <ModelsGroup
                  heading="OpenAI"
                  models={
                    models?.filter((model) => model.id.startsWith("openai/")) ??
                    []
                  }
                  value={value}
                  onSelect={handleSelect}
                />
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ModelsGroup(props: {
  heading: string;
  models: (RouterOutputs["utils"]["getModels"][number] & {
    evaluations: Record<"intelligence" | "coding" | "math", 1 | 2 | 3 | null>;
  })[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const { heading, models, value, onSelect } = props;
  return (
    <CommandGroup heading={heading}>
      {models.map((model) => {
        const isSelected = model.id === value;
        return (
          <CommandItem
            key={model.id}
            value={model.id}
            onSelect={onSelect}
            className="font-semibold"
            keywords={[model.name, model.id]}
          >
            <div className="flex w-full flex-col gap-1.5 py-1">
              <div>{model.name}</div>
              <ul className="flex flex-1 gap-3 text-xs">
                <ModelScore
                  kind="intelligence"
                  value={model.evaluations.intelligence}
                />
                <ModelScore kind="coding" value={model.evaluations.coding} />
                <ModelScore kind="math" value={model.evaluations.math} />
              </ul>
            </div>
            {isSelected && <CheckIcon className="ml-auto size-4" />}
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

function ModelScore(props: {
  kind: "intelligence" | "coding" | "math";
  value: 1 | 2 | 3 | null;
}) {
  const { kind, value } = props;
  if (value === null) return null;
  const Icon = {
    intelligence: BrainIcon,
    coding: CodeIcon,
    math: PiIcon,
  }[kind];
  return (
    <li className="flex items-center gap-1.5">
      <span className="sr-only">{`${value}/3 ${kind} score`}</span>

      <Icon className="size-4" />
      <div className="inline-flex gap-[3px]">
        {Array.from({ length: 3 }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "inline-block size-[7px] rounded-full border",
              index < value
                ? value === 1
                  ? "border-red-500 bg-red-400"
                  : value === 2
                    ? "border-yellow-500 bg-yellow-400"
                    : "border-green-500 bg-green-400"
                : "border-muted-foreground",
            )}
          />
        ))}
      </div>
    </li>
  );
}
