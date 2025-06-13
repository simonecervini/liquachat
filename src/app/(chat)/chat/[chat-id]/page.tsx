"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@rocicorp/zero/react";
import { useForm } from "@tanstack/react-form";
import { dequal } from "dequal";
import {
  ArrowUpIcon,
  BookOpenIcon,
  CheckIcon,
  CodeIcon,
  CopyIcon,
  GraduationCapIcon,
  RefreshCcwIcon,
  SparklesIcon,
  SquarePenIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { Tabs } from "radix-ui";
import { z } from "zod";

import { Markdown } from "~/components/markdown";
import { ModelCombobox } from "~/components/model-combobox";
import { ScrollArea } from "~/components/scroll-area";
import { Button } from "~/components/system/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/system/tooltip";
import { streamResponse } from "~/lib/ai";
import { cn } from "~/lib/cn";
import { useCopyButton } from "~/lib/use-copy-button";
import { useZero } from "~/zero/react";
import type { ZeroRow } from "~/zero/schema";

function useChatId() {
  const params = useParams();
  const chatId = z.string().min(1).parse(params["chat-id"]);
  return chatId;
}

function useChat() {
  const chatId = useChatId();
  const zero = useZero();
  return useQuery(
    zero.query.chats
      .where("id", "=", chatId)
      .related("messages", (q) => q.orderBy("createdAt", "asc"))
      .one(),
  );
}

type Chat = NonNullable<ReturnType<typeof useChat>[0]>;
type Message = Chat["messages"][number];

export default function ChatPage() {
  const chatId = useChatId();

  return (
    <div className="relative h-full flex-1">
      <ScrollArea className="h-full flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-8 pb-36">
          <MessageStack />
        </div>
        <SendMessageForm chatId={chatId} />
      </ScrollArea>
    </div>
  );
}

function MessageStack(props: { className?: string }) {
  const { className } = props;
  const [chat, chatResult] = useChat();
  const messages = chat?.messages ?? [];
  if (messages.length === 0) {
    if (chatResult.type === "complete") {
      return <MessageStackEmpty />;
    } else {
      return null;
    }
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
  const chatId = useChatId();
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
      className="items-left mx-auto flex w-full max-w-2xl flex-col py-20"
    >
      <h2 className="mb-8 text-3xl font-semibold">
        How can I help you, Simone?
      </h2>
      <Tabs.Root defaultValue="create" className="w-full">
        <Tabs.List className="mb-8 flex justify-start gap-2">
          {Object.entries(tabs).map(([key, tab]) => {
            const Icon = tab.icon;
            return (
              <Tabs.Trigger
                key={key}
                value={key}
                className="data-[state=inactive]:bg-secondary data-[state=inactive]:text-secondary-foreground inline-flex h-9 items-center gap-2 rounded-md bg-gradient-to-t from-blue-500 to-blue-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-600 hover:to-blue-500 data-[state=inactive]:bg-none data-[state=inactive]:shadow-none data-[state=inactive]:hover:bg-blue-200"
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
                    z.mutate.chats.sendUserMessage({
                      id: crypto.randomUUID(),
                      chatId,
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

const Message = React.memo(function Message(props: { message: Message }) {
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
}, dequal);

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
        "flex max-w-[60%] rounded-2xl bg-gradient-to-tl from-white/70 to-white/90 p-4 backdrop-blur-lg",
        editMode
          ? "w-full bg-transparent p-0 outline-2 outline-slate-400/60 outline-dashed"
          : "shadow-primary/5 shadow-xl",
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
  const pushAssistantMessage = usePushAssistantMessage();
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
        await pushAssistantMessage({ prompt: newMessage });
      }
      setEditMode(false);
    },
  });
  return (
    <form
      className="relative w-full"
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
            className="field-sizing-content w-full border-none p-4 pb-12 text-sm/loose outline-none placeholder:text-slate-400 focus-visible:border-none focus-visible:outline-none"
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

      <div className="absolute right-2 bottom-2 flex gap-1.5">
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
  const pushAssistantMessage = usePushAssistantMessage();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Button
            size="icon"
            variant="ghost"
            onClick={async () => {
              await z.mutate.chats.deleteLaterMessages({
                messageId: message.id,
                includeMessage: false,
              }).client;
              await pushAssistantMessage({ prompt: message.content });
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
  const pushAssistantMessage = usePushAssistantMessage();
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
            onClick={async () => {
              await z.mutate.chats.deleteLaterMessages({
                messageId: message.id,
                includeMessage: true,
              }).client;
              await pushAssistantMessage({ prompt: message.content });
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
  const pushAssistantMessage = usePushAssistantMessage();
  const [model, setModel] = React.useState("o4-mini");
  const form = useForm({
    defaultValues: {
      message: "",
    },
    onSubmit: async ({ value }) => {
      await z.mutate.chats.sendUserMessage({
        id: crypto.randomUUID(),
        chatId: chatId,
        content: value.message,
        timestamp: Date.now(),
      }).client;
      await pushAssistantMessage({ prompt: value.message });
      form.reset();
    },
  });
  return (
    <div className="border-primary/10 absolute bottom-0 left-1/2 w-full max-w-2xl -translate-x-1/2 rounded-t-3xl border-x-3 border-t-3 bg-white/100 text-sm text-slate-500 shadow-2xl shadow-blue-700/10">
      <div className="relative h-full w-full">
        <form
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
                className="h-full w-full resize-none border-none bg-transparent p-6 outline-none"
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
                className="absolute right-1.5 bottom-1.5"
                size="icon-lg"
              >
                <ArrowUpIcon />
                <span className="sr-only">Send</span>
              </Button>
            )}
          />
        </form>
        <div className="absolute bottom-1.5 left-1.5 flex gap-1">
          <ModelCombobox
            value={model}
            onChange={(value) => {
              setModel(value);
            }}
            slotProps={{
              popoverContent: {
                align: "start",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

function usePushAssistantMessage() {
  const z = useZero();
  const chatId = useChatId();
  return React.useCallback(
    async (input: { prompt: string }) => {
      const response = streamResponse(input.prompt, {
        provider: "openrouter",
        modelId: "deepseek/deepseek-r1-0528:free",
        // provider: "ollama",
        // modelId: "llama3.2", // usage: `ollama run llama3.2`
      });
      const messageId = crypto.randomUUID();
      let isFirstChunk = true;
      for await (const chunk of response) {
        z.mutate.chats.pushAssistantMessageChunk({
          chatId: chatId,
          messageId,
          chunk,
          isFirstChunk,
          timestamp: Date.now(),
        });
        isFirstChunk = false;
      }
    },
    [chatId, z.mutate.chats],
  );
}
