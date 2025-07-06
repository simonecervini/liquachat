"use client";

import * as React from "react";
import { ContextMenu as Base } from "@base-ui-components/react/context-menu";

import { twx } from "~/lib/cn";

export const ContextMenu = Base.Root;

export const ContextMenuTrigger = Base.Trigger;

export function ContextMenuContent(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <Base.Portal>
      <Base.Positioner className="z-50 outline-none">
        <Base.Popup className="outline-primary/5 min-w-48 origin-[var(--transform-origin)] rounded-md bg-white py-1 shadow-xl shadow-black/5 outline-2 transition-[opacity] data-[ending-style]:opacity-0">
          {children}
        </Base.Popup>
      </Base.Positioner>
    </Base.Portal>
  );
}

export const ContextMenuItem = twx(
  Base.Item,
)`flex cursor-default gap-2.5 [&>svg]:size-4 [&>svg]:text-slate-600 py-2 pr-8 pl-4 text-sm leading-4 outline-none select-none data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-primary/10`;

export const ContextMenuSeparator = twx(
  Base.Separator,
)`mx-4 my-1.5 h-px bg-primary/10`;
