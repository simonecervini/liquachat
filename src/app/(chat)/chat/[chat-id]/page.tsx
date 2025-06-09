"use client";

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
import { useForm } from "@tanstack/react-form";
import { cn } from "~/lib/cn";

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
    <div className="relative flex-1 h-full">
      <ScrollArea className="h-full flex-1">
        <div className="max-w-4xl mx-auto flex flex-col flex-1 pt-8 pb-36 px-4">
          <MessageStack messages={chat.messages} />
        </div>
        <SendMessageForm chatId={chatId} />
      </ScrollArea>
    </div>
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
            <button
              type="submit"
              disabled={!canSubmit}
              className="absolute bottom-1.5 right-1.5 bg-gradient-to-t from-blue-500 to-blue-400 shadow-sm size-10 rounded-xl text-white flex items-center justify-center hover:from-blue-600 hover:to-blue-500 transition-colors"
            >
              <ArrowUpIcon />
            </button>
          )}
        />
      </div>
    </form>
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
  const [showActions, setShowActions] = useState(false);
  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`flex flex-col gap-3 ${
        message.role === "user" ? "items-end" : "items-start"
      }`}
    >
      {message.role === "user" ? (
        <MessageUser content={message.content} />
      ) : (
        <MessageSystem content={message.content} />
      )}
      <div
        className={`flex gap-1 transition-opacity duration-100 ${
          showActions ? "opacity-100" : "opacity-0"
        }`}
      >
        {message.role === "user" ? (
          <MessageActionsUser />
        ) : (
          <MessageActionsSystem />
        )}
      </div>
    </div>
  );
}

function MessageUser(props: { content: string }) {
  const { content } = props;
  return (
    <div
      role="article"
      aria-label="Your message"
      className="p-4 max-w-[60%] bg-gradient-to-tl from-white/70 to-white/90 rounded-2xl border-2 border-white/50 backdrop-blur-lg shadow-xl shadow-black/5"
    >
      <Markdown>{content}</Markdown>
    </div>
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

function MessageActionsUser() {
  return (
    <>
      <button
        title="Retry message"
        className="p-2 text-slate-600 hover:bg-white/20 rounded-xl transition-colors"
      >
        <RefreshCcwIcon size={16} />
      </button>
      <button
        title="Edit message"
        className="p-2 text-slate-600 hover:bg-white/20 rounded-xl transition-colors"
      >
        <SquarePenIcon size={16} />
      </button>
      <button
        title="Copy message"
        className="p-2 text-slate-600 hover:bg-white/20 rounded-xl transition-colors"
      >
        <CopyIcon size={16} />
      </button>
    </>
  );
}

function MessageActionsSystem() {
  return (
    <>
      <button
        title="Copy message"
        className="p-2 text-slate-600 hover:bg-white/20 rounded-xl transition-colors"
      >
        <CopyIcon size={16} />
      </button>
    </>
  );
}

function useChatId() {
  const params = useParams();
  return z.string().min(1).parse(params["chat-id"]);
}
