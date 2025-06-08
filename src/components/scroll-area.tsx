import * as React from "react";
import { ScrollArea as ScrollAreaBase } from "@base-ui-components/react/scroll-area";
import { styled } from "@mui/material";

export function ScrollArea(props: React.ComponentProps<typeof Root>) {
  const { children, ...rest } = props;
  return (
    <Root {...rest}>
      <Viewport>
        <Content>{children}</Content>
      </Viewport>
      <Scrollbar>
        <Thumb />
      </Scrollbar>
    </Root>
  );
}

const Root = styled(ScrollAreaBase.Root)({
  boxSize: "border-box",
});

const Viewport = styled(ScrollAreaBase.Viewport)({
  height: "100%",
  overscrollBehavior: "contain",
  "&:focus-visible": {
    // TODO: add outline
  },
});

const Content = styled(ScrollAreaBase.Content)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  paddingBlock: theme.spacing(0.75),
  paddingLeft: theme.spacing(1),
  paddingRight: theme.spacing(1.5),
}));

const Scrollbar = styled(ScrollAreaBase.Scrollbar)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  width: "5px",
  borderRadius: "2px",
  margin: "0 2px",
  opacity: 0,
  transition: "opacity 150ms 300ms",
  "&[data-hovering], &[data-scrolling]": {
    opacity: 1,
    transitionDuration: "75ms",
    transitionDelay: "0ms",
  },
  "&::before": {
    content: '""',
    position: "absolute",
    width: theme.spacing(1.25),
    height: "100%",
  },
}));

const Thumb = styled(ScrollAreaBase.Thumb)(({ theme }) => ({
  width: "100%",
  borderRadius: "inherit",
  backgroundColor: theme.vars.palette.primary.light,
}));
