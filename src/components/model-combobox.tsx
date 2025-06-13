"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "~/components/system/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/system/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/system/popover";
import { cn } from "~/lib/cn";

const models = [
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
  },
  {
    id: "gpt-image-gen",
    label: "GPT Image Gen",
  },
  {
    id: "o4-mini",
    label: "o4-Mini",
  },
  {
    id: "o1-mini",
    label: "o1-Mini",
  },
  ...Array.from({ length: 100 }, (_, i) => ({
    id: `model-${i}`,
    label: `Model ${i}`,
  })),
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {value
            ? models.find((model) => model.id === value)?.label
            : "Select model..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        {...slotProps?.popoverContent}
        className={cn("w-[200px] p-0", slotProps?.popoverContent?.className)}
      >
        <Command>
          <CommandInput placeholder="Search framework..." />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup heading="Favorites">
              {models.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === model.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {model.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
