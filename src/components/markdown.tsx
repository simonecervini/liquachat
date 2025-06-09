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
          "bg-primary/20 rounded px-2 py-1 font-mono font-medium text-sm",
          className,
        )}
      >
        {children}
      </code>
    );
  },
};

export function Markdown(props: { children: string }) {
  return <MarkdownRoot components={components}>{props.children}</MarkdownRoot>;
}

function CodeBlock(props: { lang: string; children: string }) {
  const { lang, children } = props;
  const { data } = useQuery({
    queryKey: ["shiki", lang, children],
    staleTime: Infinity,
    queryFn: async () => {
      return codeToHtml(children, {
        lang,
        theme: "vitesse-light",
      });
    },
  });
  return (
    <div className="border border-gray-200 rounded-lg font-mono text-sm overflow-hidden">
      <div className="border-b border-gray-200 px-2 py-1 bg-gray-50 text-gray-700 text-xs">
        {lang}
      </div>
      <div
        dangerouslySetInnerHTML={{ __html: data ?? "" }}
        className="w-full [&>div>pre]:m-0 [&>div>pre]:border-0 [&>div>pre]:p-2 [&>div>pre]:rounded-none"
      />
    </div>
  );
}
