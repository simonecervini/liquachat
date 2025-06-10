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
    <div className="border border-primary/15 rounded-lg font-mono overflow-hidden my-1.5">
      <div className="border-b border-primary/15 px-4 py-2.5 bg-white text-slate-800 text-xs">
        {lang}
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: data ?? "" }}
        // TODO: remove bg-white! when the custom theme is ready
        className="w-full [&>pre]:m-0 [&>pre]:border-0 [&>pre]:p-2.5 [&>pre]:rounded-none [&>pre]:bg-white!"
      />
    </div>
  );
}
