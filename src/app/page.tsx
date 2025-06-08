"use client";

import { motion } from "motion/react";
import {
  alpha,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  InputBase,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  type StackProps,
  type TypographyProps,
} from "@mui/material";
import {
  ArrowUpIcon,
  CopyIcon,
  LeafIcon,
  PanelLeftIcon,
  RefreshCcwIcon,
  SearchIcon,
  SquarePenIcon,
} from "lucide-react";
import { useState } from "react";
import { createShadow } from "~/lib/theme";

export default function Home() {
  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
      }}
    >
      <Sidebar />
      <Box sx={{ pt: 2, display: "flex", flex: 1 }}>
        <Paper
          variant="outlined"
          sx={{
            flex: 1,
            borderEndEndRadius: 0,
            borderEndStartRadius: 0,
            borderStartEndRadius: 0,
            boxShadow: (theme) =>
              createShadow(2, { color: theme.palette.primary.light }),
            border: (theme) =>
              `1px solid ${alpha(theme.palette.primary.dark, 0.2)}`,
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Container
            maxWidth="md"
            sx={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              pt: 4,
            }}
          >
            <MessageStack
              messages={[
                { type: "user", content: "Hello, how are you" },
                {
                  type: "system",
                  content:
                    "I'm doing well, thanks for asking! I'm currently assisting users and learning new things. How can I help you today?",
                },
                {
                  type: "user",
                  content:
                    "I'm doing well, thanks for asking! I'm currently assisting users and learning new things. How can I help you today?",
                },
                {
                  type: "system",
                  content:
                    "I am a chatbot that can help you with your questions. How can I help you today?",
                },
              ]}
            />
          </Container>
          <Paper
            variant="outlined"
            sx={{
              position: "absolute",
              bottom: (theme) => theme.spacing(2),
              left: "50%",
              transform: "translateX(-50%)",
              width: "700px",
              height: "150px",
              p: 1,
              boxShadow: (theme) =>
                createShadow(3, { color: theme.palette.primary.light }),
              border: (theme) =>
                `1px solid ${alpha(theme.palette.primary.dark, 0.2)}`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <InputBase
              placeholder="Type your message here..."
              multiline
              sx={{ p: 1, flex: 1 }}
            />
            <Box sx={{ textAlign: "right" }}>
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowUpIcon />}
              >
                Send
              </Button>
            </Box>
          </Paper>
        </Paper>
      </Box>
    </Box>
  );
}

function Sidebar() {
  const [open, setOpen] = useState(false); // TODO: implement this
  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          justifyContent: "space-between",
          minWidth: 220,
        }}
      >
        <IconButton
          size="small"
          color="primary"
          onClick={() => setOpen((prev) => !prev)}
        >
          <PanelLeftIcon />
        </IconButton>
        <Logo />
        <Box
          sx={{
            width: (theme) => theme.spacing(3), // TODO: adjust this
          }}
        />
      </Box>
      <Button variant="contained">New Chat</Button>
      <TextField
        variant="standard"
        placeholder="Search your threads..."
        size="small"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: {
              typography: "body2",
              "&:before": {
                borderBottomColor: "rgba(0, 0, 0, 0.12)",
              },
            },
          },
        }}
      />
    </Stack>
  );
}

function MessageStack(
  props: {
    messages: { type: "user" | "system"; content: string }[];
  } & StackProps,
) {
  const { messages, ...rest } = props;
  return (
    <Stack spacing={8} {...rest}>
      {messages.map((message) => (
        <Message key={message.content} {...message} />
      ))}
    </Stack>
  );
}

function Message(props: { type: "user" | "system"; content: string }) {
  const { type, content } = props;
  const [showActions, setShowActions] = useState(false);
  return (
    <Box
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: type === "user" ? "flex-end" : "flex-start",
        gap: 1.5,
      }}
    >
      {type === "user" ? (
        <MessageUser content={content} />
      ) : (
        <MessageSystem content={content} />
      )}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: showActions ? 1 : 0 }}
        transition={{ duration: 0.1 }}
        sx={{
          display: "flex",
          gap: 0.5,
        }}
      >
        {type === "user" ? <MessageActionsUser /> : <MessageActionsSystem />}
      </Box>
    </Box>
  );
}

function MessageUser(props: { content: string }) {
  const { content } = props;
  return (
    <Paper variant="outlined" sx={{ p: 2, maxWidth: "60%" }}>
      <Typography variant="body1">{content}</Typography>
    </Paper>
  );
}

function MessageSystem(props: { content: string }) {
  const { content } = props;
  return <Typography variant="body1">{content}</Typography>;
}

function MessageActionsUser() {
  return (
    <>
      <Tooltip title="Retry message">
        <IconButton size="small">
          <RefreshCcwIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit message">
        <IconButton size="small">
          <SquarePenIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy message">
        <IconButton size="small">
          <CopyIcon />
        </IconButton>
      </Tooltip>
    </>
  );
}

function MessageActionsSystem() {
  return (
    <>
      <Tooltip title="Copy message">
        <IconButton size="small">
          <CopyIcon />
        </IconButton>
      </Tooltip>
    </>
  );
}

function Logo(props: TypographyProps) {
  return (
    <Typography fontWeight={700} {...props}>
      <Box
        component={LeafIcon}
        size="1em"
        sx={{
          display: "inline-block",
          verticalAlign: "middle",
          mr: "0.35em",
          color: "primary.main",
        }}
      />
      Algachat
    </Typography>
  );
}
