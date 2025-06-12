"use client";

import * as React from "react";
import {
  ArrowUpIcon,
  CheckIcon,
  CopyIcon,
  RefreshCcwIcon,
  SquarePenIcon,
} from "lucide-react";
import { Markdown } from "~/components/markdown";
import { ScrollArea } from "~/components/scroll-area";
import { useParams } from "next/navigation";
import { z } from "zod";
import { useZero } from "~/zero/react";
import { useQuery } from "@rocicorp/zero/react";
import { useForm } from "@tanstack/react-form";
import { cn } from "~/lib/cn";
import { Button } from "~/components/system/button";
import { useCopyButton } from "~/lib/use-copy-button";
import type { ZeroRow } from "~/zero/schema";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/system/tooltip";

function useChat() {
  const params = useParams();
  const chatId = z.string().min(1).parse(params["chat-id"]);
  const zero = useZero();
  const [chat] = useQuery(
    zero.query.chats
      .where("id", "=", chatId)
      .related("messages", (q) => q.orderBy("createdAt", "asc"))
      .one(),
  );
  return chat;
}

type Chat = NonNullable<ReturnType<typeof useChat>>;
type Message = Chat["messages"][number];

export default function ChatPage() {
  const chat = useChat();

  if (!chat) {
    return "loading...";
  }

  return (
    <div className="relative flex-1 h-full">
      <ScrollArea className="h-full flex-1">
        <div className="max-w-4xl w-full mx-auto flex flex-col flex-1 pt-8 pb-36 px-4">
          <MessageStack messages={chat.messages} />
        </div>
        <SendMessageForm chatId={chat.id} />
      </ScrollArea>
    </div>
  );
}

function MessageStack(props: {
  messages: readonly Message[];
  className?: string;
}) {
  const { messages, className } = props;
  return (
    <div className={cn("flex flex-col gap-8 pb-16", className)}>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
}

function Message(props: { message: Message }) {
  const { message } = props;
  const [editMode, setEditMode] = React.useState(false);
  return (
    <div
      className={`flex flex-col gap-3 ${
        message.role === "user" ? "items-end" : "items-start"
      }`}
    >
      {message.role === "user" ? (
        <MessageUser
          message={message}
          editMode={editMode}
          setEditMode={setEditMode}
        />
      ) : (
        <MessageSystem content={message.content} />
      )}
      <div className="flex gap-1">
        {message.role === "user" ? (
          <MessageActionsUser
            message={message}
            editMode={editMode}
            setEditMode={setEditMode}
          />
        ) : (
          <MessageActionsSystem message={message} />
        )}
      </div>
    </div>
  );
}

function MessageUser(props: {
  message: Message;
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { message, editMode } = props;
  return (
    <div
      role="article"
      aria-label="Your message"
      className={cn(
        "p-4 max-w-[60%] flex bg-gradient-to-tl from-white/70 to-white/90 rounded-2xl backdrop-blur-lg",
        editMode
          ? "w-full outline-slate-400/60 outline-2 outline-dashed bg-transparent p-0"
          : "shadow-xl shadow-primary/5",
      )}
    >
      {editMode ? (
        <EditMessageForm {...props} />
      ) : (
        <Markdown>{message.content}</Markdown>
      )}
    </div>
  );
}

function EditMessageForm(props: React.ComponentProps<typeof MessageUser>) {
  const { message: originalMessage, setEditMode } = props;
  const z = useZero();
  const form = useForm({
    defaultValues: {
      message: originalMessage.content,
    },
    onSubmit: async ({ value }) => {
      const newMessage = value.message.trim();
      if (newMessage && newMessage !== originalMessage.content.trim()) {
        await z.mutate.chats.updateMessage({
          id: originalMessage.id,
          content: value.message,
          timestamp: Date.now(),
        }).client;
      }
      setEditMode(false);
    },
  });
  return (
    <form
      className="w-full relative"
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await form.handleSubmit();
      }}
    >
      <form.Field
        name="message"
        children={(field) => (
          <textarea
            autoFocus
            value={field.state.value}
            onChange={(e) => {
              field.handleChange(e.target.value);
            }}
            placeholder="Type your message here..."
            // The font size (text-sm/loose) is set to match the Markdown component
            className="w-full placeholder:text-slate-400 focus-visible:outline-none border-none outline-none focus-visible:border-none text-sm/loose p-4 pb-12 field-sizing-content"
            onBlur={field.handleBlur}
            onFocus={(e) => {
              // Move cursor to the end of the textarea
              const tempValue = e.target.value;
              e.target.value = "";
              e.target.value = tempValue;
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                setEditMode(false);
              }
            }}
          />
        )}
      />

      <div className="flex gap-1.5 absolute bottom-2 right-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit]}
          children={([canSubmit]) => (
            <>
              <Button
                type="button"
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  setEditMode(false);
                }}
                disabled={!canSubmit}
              >
                Cancel
              </Button>
              <Button type="submit" size="icon" disabled={!canSubmit}>
                <ArrowUpIcon />
                <span className="sr-only">Send</span>
              </Button>
            </>
          )}
        />
      </div>
    </form>
  );
}

function MessageSystem(props: { content: string }) {
  const { content } = props;
  return (
    <div role="article" aria-label="Assistant message" className="w-full">
      <Markdown>{content}</Markdown>
    </div>
  );
}

function MessageActionsUser(props: {
  message: ZeroRow<"messages">;
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { message, editMode, setEditMode } = props;
  const { buttonProps: copyButtonProps, copied } = useCopyButton(
    message.content,
  );
  const z = useZero();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              z.mutate.chats.updateMessage({
                id: message.id,
                content: message.content,
                timestamp: Date.now(),
              });
            }}
          >
            <RefreshCcwIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Retry message</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Button
            size="icon"
            variant="ghost"
            disabled={editMode}
            onClick={() => setEditMode((prev) => !prev)}
          >
            <SquarePenIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit message</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Button size="icon" variant="ghost" {...copyButtonProps}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy message</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MessageActionsSystem(props: { message: Message }) {
  const { message } = props;
  const { buttonProps: copyButtonProps, copied } = useCopyButton(
    message.content,
  );
  const chat = useChat();
  const z = useZero();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button size="icon" variant="ghost" {...copyButtonProps}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy message</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              const index =
                chat?.messages.findIndex((m) => m.id === message.id) ?? -1;
              const prevMessage = chat?.messages[index - 1];
              if (prevMessage) {
                z.mutate.chats.updateMessage({
                  id: prevMessage.id,
                  content: prevMessage.content,
                  timestamp: Date.now(),
                });
              }
            }}
          >
            <RefreshCcwIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Retry message</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SendMessageForm(props: { chatId: string; className?: string }) {
  const { chatId } = props;
  const z = useZero();
  const form = useForm({
    defaultValues: {
      message: "",
    },
    onSubmit: async ({ value }) => {
      z.mutate.chats.sendMessage({
        id: crypto.randomUUID(),
        chatId: chatId,
        content: value.message,
        timestamp: Date.now(),
      });
      form.reset();
    },
  });
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await form.handleSubmit();
      }}
      className="text-slate-500 absolute bottom-0 rounded-t-3xl border-t-3 border-x-3 shadow-2xl border-primary/10 shadow-blue-700/10 text-sm max-w-2xl w-full left-1/2 -translate-x-1/2 bg-white/100"
    >
      <div className="w-full h-full relative">
        <form.Field
          name="message"
          children={(field) => (
            <textarea
              name={field.name}
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              onKeyDown={async (event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  await form.handleSubmit();
                }
              }}
              placeholder="Type your message here..."
              className="p-6 w-full h-full resize-none border-none outline-none bg-transparent"
              rows={4}
            />
          )}
        />

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit]) => (
            <Button
              type="submit"
              disabled={!canSubmit}
              className="absolute bottom-1.5 right-1.5"
              size="icon-lg"
            >
              <ArrowUpIcon />
              <span className="sr-only">Send</span>
            </Button>
          )}
        />
      </div>
    </form>
  );
}
