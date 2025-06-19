import * as React from "react";
import { ScrollArea as ScrollAreaBase } from "@base-ui-components/react/scroll-area";

import { cn } from "~/lib/cn";

export function ScrollArea(
  props: React.ComponentProps<typeof ScrollAreaBase.Root> & {
    contentClassName?: string;
    viewportClassName?: string;
    scrollbarClassName?: string;
  },
) {
  const {
    children,
    contentClassName,
    viewportClassName,
    scrollbarClassName,
    ...rest
  } = props;
  return (
    <ScrollAreaBase.Root {...rest}>
      <ScrollAreaBase.Viewport
        className={cn(
          "h-full overscroll-contain focus-visible:outline-none",
          viewportClassName,
        )}
      >
        <ScrollAreaBase.Content className={cn(contentClassName)}>
          {children}
        </ScrollAreaBase.Content>
      </ScrollAreaBase.Viewport>
      <ScrollAreaBase.Scrollbar
        className={cn(
          "flex w-[5px] justify-center opacity-0 transition-opacity delay-300 duration-150 before:absolute before:h-full before:content-[''] data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[hovering]:duration-75 data-[scrolling]:opacity-100 data-[scrolling]:delay-0 data-[scrolling]:duration-75",
          scrollbarClassName,
        )}
      >
        <ScrollAreaBase.Thumb className="bg-primary w-full rounded-full" />
      </ScrollAreaBase.Scrollbar>
    </ScrollAreaBase.Root>
  );
}
