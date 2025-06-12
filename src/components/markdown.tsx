"use client";

import { useQuery } from "@tanstack/react-query";
import MarkdownRoot from "react-markdown";
import { codeToHtml } from "shiki";

import { cn } from "~/lib/cn";

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

export function Markdown(props: { children: string }) {
  return (
    <div className="flex flex-col gap-3 text-sm/loose">
      <MarkdownRoot components={components}>{props.children}</MarkdownRoot>
    </div>
  );
}

function CodeBlock(props: { lang: string; children: string }) {
  const { lang, children } = props;
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
      <div className="border-primary/15 border-b bg-white px-4 py-2.5 text-xs text-slate-800">
        {lang}
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: data ?? "" }}
        // TODO: remove bg-white! when the custom theme is ready
        className="w-full [&>pre]:m-0 [&>pre]:rounded-none [&>pre]:border-0 [&>pre]:bg-white! [&>pre]:p-2.5"
      />
    </div>
  );
}
