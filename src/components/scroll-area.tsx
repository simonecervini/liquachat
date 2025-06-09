import * as React from "react";
import { ScrollArea as ScrollAreaBase } from "@base-ui-components/react/scroll-area";

export function ScrollArea(
  props: React.ComponentProps<typeof ScrollAreaBase.Root>,
) {
  const { children, ...rest } = props;
  return (
    <ScrollAreaBase.Root {...rest}>
      <ScrollAreaBase.Viewport className="h-full overscroll-contain focus-visible:outline-none">
        <ScrollAreaBase.Content className="flex flex-col gap-1 py-3 pl-2 pr-6">
          {children}
        </ScrollAreaBase.Content>
      </ScrollAreaBase.Viewport>
      <ScrollAreaBase.Scrollbar className="flex justify-center w-[3px] mx-0.25 opacity-0 transition-opacity duration-150 delay-300 data-[hovering]:opacity-100 data-[scrolling]:opacity-100 data-[hovering]:duration-75 data-[hovering]:delay-0 data-[scrolling]:duration-75 data-[scrolling]:delay-0 before:content-[''] before:absolute before:w-5 before:h-full">
        <ScrollAreaBase.Thumb className="w-full rounded-[2px] bg-primary" />
      </ScrollAreaBase.Scrollbar>
    </ScrollAreaBase.Root>
  );
}
