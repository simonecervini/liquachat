"use client";

import {
  TriangleAlertIcon,
  Loader2Icon,
  InfoIcon,
  XIcon,
  CheckIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      {...props}
      theme="light"
      className="!font-sans"
      style={
        {
          "--normal-bg": "var(--color-white)",
          "--normal-text": "var(--color-slate-700)",
          "--normal-border": "none",
          "--border-radius": "var(--radius-md)",
        } as React.CSSProperties
      }
      icons={{
        error: <XIcon className="size-4 text-red-500" />,
        success: <CheckIcon className="size-4 text-teal-500" />,
        warning: <TriangleAlertIcon className="size-4 text-yellow-500" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        info: <InfoIcon className="size-4" />,
      }}
    />
  );
};

export { Toaster };
