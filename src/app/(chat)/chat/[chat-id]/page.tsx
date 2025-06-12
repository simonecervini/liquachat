"use client";

import * as React from "react";
import {
  ArrowUpIcon,
  CheckIcon,
  CopyIcon,
  RefreshCcwIcon,
  SquarePenIcon,
  SparklesIcon,
  BookOpenIcon,
  CodeIcon,
  GraduationCapIcon,
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
import { Tabs } from "radix-ui";
import { motion } from "motion/react";

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
  if (messages.length === 0) {
    return <MessageStackEmpty />;
  }
  return (
    <div className={cn("flex flex-col gap-8 pb-16", className)}>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageStackEmpty() {
  const chat = useChat();
  const z = useZero();
  const tabs = {
    create: {
      title: "Create",
      icon: SparklesIcon,
      suggestions: [
        "Write a short story about a robot discovering emotions",
        "Help me outline a sci-fi novel set in a post-apocalyptic world",
        "Create a character profile for a complex villain with sympathetic motives",
        "Give me 5 creative writing prompts for flash fiction",
      ],
    },
    explore: {
      title: "Explore",
      icon: BookOpenIcon,
      suggestions: [
        "Good books for fans of Rick Rubin",
        "Countries ranked by number of corgis",
        "Most successful companies in the world",
        "How much does Claude cost?",
      ],
    },
    code: {
      title: "Code",
      icon: CodeIcon,
      suggestions: [
        "Help me debug this React component",
        "Explain async/await in JavaScript",
        "Write a Python script to analyze CSV data",
        "Best practices for API design",
      ],
    },
    learn: {
      title: "Learn",
      icon: GraduationCapIcon,
      suggestions: [
        "Explain quantum computing in simple terms",
        "How does machine learning work?",
        "What are the fundamentals of economics?",
        "Teach me the basics of photography",
      ],
    },
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col items-left max-w-2xl w-full mx-auto py-20"
    >
      <h2 className="text-3xl font-semibold mb-8">
        How can I help you, Simone?
      </h2>
      <Tabs.Root defaultValue="create" className="w-full">
        <Tabs.List className="flex justify-start gap-2 mb-8">
          {Object.entries(tabs).map(([key, tab]) => {
            const Icon = tab.icon;
            return (
              <Tabs.Trigger
                key={key}
                value={key}
                className="h-9 px-4 py-2 bg-gradient-to-t text-sm from-blue-500 to-blue-400 shadow-sm hover:from-blue-600 hover:to-blue-500 text-white rounded-md font-medium transition-all data-[state=inactive]:bg-none data-[state=inactive]:bg-secondary data-[state=inactive]:text-secondary-foreground data-[state=inactive]:shadow-none data-[state=inactive]:hover:bg-blue-200 inline-flex items-center gap-2"
              >
                <Icon className="size-4" />
                {tab.title}
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>
        {Object.entries(tabs).map(([key, tab]) => (
          <Tabs.Content
            key={key}
            value={key}
            className="flex flex-col gap-2 divide-y divide-slate-200"
          >
            {tab.suggestions.map((suggestion, index) => (
              <div key={index} className="pb-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  size="lg"
                  onClick={() => {
                    if (!chat) return;
                    z.mutate.chats.sendMessage({
                      id: crypto.randomUUID(),
                      chatId: chat.id,
                      content: suggestion,
                      timestamp: Date.now(),
                    });
                  }}
                >
                  {suggestion}
                </Button>
              </div>
            ))}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </motion.div>
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
