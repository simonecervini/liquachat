"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, CopyIcon, TextIcon, WrapTextIcon } from "lucide-react";
import MarkdownRoot from "react-markdown";
import { codeToHtml } from "shiki";

import { cn } from "~/lib/cn";
import { useCopyButton } from "~/lib/use-copy-button";
import { Button } from "./system/button";

const components: React.ComponentProps<typeof MarkdownRoot>["components"] = {
  code(props) {
    const { children, className, ...rest } = props;
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const childrenAsString = String(children); // FIXME: why is children not a string?
    const match = /language-(\w+)/.exec(className ?? "");
    return match ? (
      <div>
        <CodeBlock lang={match[1] ?? ""} {...rest}>
          {childrenAsString}
        </CodeBlock>
      </div>
    ) : (
      <code
        {...rest}
        className={cn(
          "bg-primary/20 rounded px-2 py-1 font-mono font-medium",
          className,
        )}
      >
        {children}
      </code>
    );
  },
};

export function Markdown(props: { children: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 text-sm/loose", props.className)}>
      <MarkdownRoot components={components}>{props.children}</MarkdownRoot>
    </div>
  );
}

function CodeBlock(props: { lang: string; children: string }) {
  const { lang, children } = props;
  const [textWrapping, setTextWrapping] = React.useState(false);
  const { buttonProps: copyButtonProps, copied } = useCopyButton(children);
  const { data } = useQuery({
    queryKey: ["shiki", lang, children],
    staleTime: Infinity,
    queryFn: async () => {
      return codeToHtml(children, {
        lang,
        theme: "one-light",
      });
    },
  });
  return (
    <div className="border-primary/15 my-1.5 overflow-hidden rounded-lg border font-mono">
      <div className="border-primary/15 flex items-center justify-between gap-0.5 border-b bg-white py-1 pr-1 pl-4 text-xs text-slate-800">
        <span className="inline-block grow">{lang}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTextWrapping((x) => !x)}
        >
          {textWrapping ? <WrapTextIcon /> : <TextIcon />}
        </Button>
        <Button variant="ghost" size="icon-sm" {...copyButtonProps}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: data ?? "" }}
        // TODO: remove bg-white! when the custom theme is ready
        className={cn(
          "w-full [&>pre]:m-0 [&>pre]:rounded-none [&>pre]:border-0 [&>pre]:bg-white! [&>pre]:p-2.5",
          textWrapping && "[&>pre]:break-words [&>pre]:whitespace-pre-wrap",
        )}
      />
    </div>
  );
}
