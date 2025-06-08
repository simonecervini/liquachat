"use client";

import { alpha, Box, Paper, styled } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import MarkdownRoot from "react-markdown";
import { codeToHtml } from "shiki";

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
      <Code {...rest} className={className}>
        {children}
      </Code>
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
    <Paper
      variant="outlined"
      sx={{
        fontFamily: "var(--font-mono)",
        fontSize: (theme) => theme.typography.body2.fontSize,
        "& > div > pre": {
          m: 0,
          border: 0,
          p: 1,
          borderRadius: "inherit",
        },
      }}
    >
      <Box
        sx={{
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          px: 1,
          py: 0.5,
          borderRadius: "none",
        }}
      >
        {lang}
      </Box>
      <Box
        dangerouslySetInnerHTML={{ __html: data ?? "" }}
        className="formatted-code"
        sx={{ borderRadius: "inherit", width: "100%" }}
      />
    </Paper>
  );
}

const Code = styled("code")(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.light, 0.2),
  color: theme.vars.palette.primary.dark,
  borderRadius: +theme.shape.borderRadius / 2,
  padding: theme.spacing(0.5),
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
}));
