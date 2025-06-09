"use client";

import { motion } from "motion/react";
import {
  alpha,
  Box,
  Button,
  Container,
  IconButton,
  InputBase,
  Paper,
  Stack,
  Tooltip,
  type PaperProps,
  type StackProps,
} from "@mui/material";
import {
  ArrowUpIcon,
  CopyIcon,
  RefreshCcwIcon,
  SquarePenIcon,
} from "lucide-react";
import { useState } from "react";
import { Markdown } from "~/components/markdown";
import { ScrollArea } from "~/components/scroll-area";
import { useParams } from "next/navigation";
import { z } from "zod";
import { useZero } from "~/zero/react";
import { useQuery } from "@rocicorp/zero/react";
import { createShadow } from "~/lib/theme";

function useChat(id: string) {
  const z = useZero();
  const [chat] = useQuery(
    z.query.chats
      .where("id", "=", id)
      .related("messages", (q) => q.orderBy("createdAt", "asc"))
      .one(),
  );
  return chat;
}

type Chat = NonNullable<ReturnType<typeof useChat>>;
type Message = Chat["messages"][number];

export default function ChatPage() {
  const chatId = useChatId();
  const chat = useChat(chatId);

  if (!chat) {
    return "loading...";
  }

  return (
    <Box sx={{ position: "relative", flex: 1 }}>
      <ScrollArea
        sx={{
          height: "100vh",
          flex: 1,
        }}
      >
        <Container
          maxWidth="md"
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            py: 4,
          }}
        >
          <MessageStack messages={chat.messages} />
        </Container>
      </ScrollArea>
      <SendMessageForm chatId={chatId} />
    </Box>
  );
}

function SendMessageForm(
  props: { chatId: string } & Omit<PaperProps, "children">,
) {
  const { chatId } = props;
  const [message, setMessage] = useState("");
  const z = useZero();
  // TODO: use tanstack/form
  return (
    <Paper
      variant="outlined"
      {...props}
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
        backdropFilter: "blur(10px)",
        backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.8),
        ...props.sx,
      }}
    >
      <InputBase
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Type your message here..."
        multiline
        sx={{ p: 1, flex: 1 }}
      />
      <Box sx={{ textAlign: "right" }}>
        <Button
          variant="contained"
          size="small"
          endIcon={<ArrowUpIcon />}
          onClick={() => {
            z.mutate.chats.sendMessage({
              id: crypto.randomUUID(),
              chatId: chatId,
              content: message,
              timestamp: Date.now(),
            });
          }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
}

function MessageStack(
  props: {
    messages: readonly Message[];
  } & StackProps,
) {
  const { messages, ...rest } = props;
  return (
    <Stack spacing={8} {...rest} sx={{ pb: 16, ...rest.sx }}>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </Stack>
  );
}

function Message(props: { message: Message }) {
  const { message } = props;
  const [showActions, setShowActions] = useState(false);
  return (
    <Box
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: message.role === "user" ? "flex-end" : "flex-start",
        gap: 1.5,
      }}
    >
      {message.role === "user" ? (
        <MessageUser content={message.content} />
      ) : (
        <MessageSystem content={message.content} />
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
        {message.role === "user" ? (
          <MessageActionsUser />
        ) : (
          <MessageActionsSystem />
        )}
      </Box>
    </Box>
  );
}

function MessageUser(props: { content: string }) {
  const { content } = props;
  return (
    <Paper
      role="article"
      aria-label="Your message"
      variant="outlined"
      sx={{ p: 2, maxWidth: "60%" }}
    >
      <Markdown>{content}</Markdown>
    </Paper>
  );
}

function MessageSystem(props: { content: string }) {
  const { content } = props;
  return (
    <Box role="article" aria-label="Assistant message" sx={{ width: "100%" }}>
      <Markdown>{content}</Markdown>
    </Box>
  );
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

function useChatId() {
  const params = useParams();
  return z.string().min(1).parse(params["chat-id"]);
}
