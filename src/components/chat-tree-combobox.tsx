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

export interface ChatComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
  className?: string;
  slotProps?: {
    popoverContent?: React.ComponentProps<typeof PopoverContent>;
  };
}

export function ChatCombobox(props: ChatComboboxProps) {
  const { value, onChange, options, className, slotProps } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between hover:bg-slate-600/10", className)}
        >
          {value
            ? options.find((option) => option.id === value)?.label
            : "Select view..."}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        {...slotProps?.popoverContent}
        className={cn("w-[200px] p-0", slotProps?.popoverContent?.className)}
      >
        <Command>
          <CommandInput placeholder="Search view..." />
          <CommandList>
            <CommandEmpty>No view found.</CommandEmpty>
            <CommandGroup heading="View">
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
