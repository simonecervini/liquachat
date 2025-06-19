import * as React from "react";
import { ScrollArea as ScrollAreaBase } from "@base-ui-components/react/scroll-area";

import { cn } from "~/lib/cn";

export function ScrollArea(
  props: React.ComponentProps<typeof ScrollAreaBase.Root> & {
    contentClassName?: string;
  },
) {
  const { children, contentClassName, ...rest } = props;
  return (
    <ScrollAreaBase.Root {...rest}>
      <ScrollAreaBase.Viewport className="h-full overscroll-contain focus-visible:outline-none">
        <ScrollAreaBase.Content className={cn(contentClassName)}>
          {children}
        </ScrollAreaBase.Content>
      </ScrollAreaBase.Viewport>
      <ScrollAreaBase.Scrollbar className="flex w-[5px] justify-center opacity-0 transition-opacity delay-300 duration-150 before:absolute before:h-full before:content-[''] data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[hovering]:duration-75 data-[scrolling]:opacity-100 data-[scrolling]:delay-0 data-[scrolling]:duration-75">
        <ScrollAreaBase.Thumb className="bg-primary w-full rounded-full" />
      </ScrollAreaBase.Scrollbar>
    </ScrollAreaBase.Root>
  );
}
