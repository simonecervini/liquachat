import * as React from "react";
import { ScrollArea as ScrollAreaBase } from "@base-ui-components/react/scroll-area";

export function ScrollArea(
  props: React.ComponentProps<typeof ScrollAreaBase.Root>,
) {
  const { children, ...rest } = props;
  return (
    <ScrollAreaBase.Root {...rest}>
      <ScrollAreaBase.Viewport className="h-full overscroll-contain focus-visible:outline-none">
        <ScrollAreaBase.Content className="flex flex-col gap-1 py-3 pr-6 pl-2">
          {children}
        </ScrollAreaBase.Content>
      </ScrollAreaBase.Viewport>
      <ScrollAreaBase.Scrollbar className="mx-0.25 flex w-[3px] justify-center opacity-0 transition-opacity delay-300 duration-150 before:absolute before:h-full before:w-5 before:content-[''] data-[hovering]:opacity-100 data-[hovering]:delay-0 data-[hovering]:duration-75 data-[scrolling]:opacity-100 data-[scrolling]:delay-0 data-[scrolling]:duration-75">
        <ScrollAreaBase.Thumb className="bg-primary w-full rounded-[2px]" />
      </ScrollAreaBase.Scrollbar>
    </ScrollAreaBase.Root>
  );
}
