"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { useQuery } from "@rocicorp/zero/react";
import { useForm } from "@tanstack/react-form";
import { replaceEqualDeep } from "@tanstack/react-query";
import { dequal } from "dequal";
import {
  ArrowUpIcon,
  BookOpenIcon,
  CheckIcon,
  CircleStopIcon,
  CircleXIcon,
  CodeIcon,
  CopyIcon,
  GraduationCapIcon,
  RefreshCcwIcon,
  SparklesIcon,
  SquareIcon,
  SquarePenIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { Tabs } from "radix-ui";
import { createStore, useStore } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";

import { Markdown } from "~/components/markdown";
import { DEFAULT_MODEL, ModelCombobox } from "~/components/model-combobox";
import { ScrollArea } from "~/components/scroll-area";
import { Button } from "~/components/system/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/system/tooltip";
import { parseModelFromRole, streamResponse } from "~/lib/ai";
import { cn } from "~/lib/cn";
import { useCopyButton } from "~/lib/use-copy-button";
import { useZero } from "~/zero/react";
import type { ZeroRow } from "~/zero/schema";

// -- Query --

function useChatId() {
  const params = useParams();
  return String(params["chat-id"]);
}

function useChatQuery() {
  const zero = useZero();
  const chatId = useChatId();
  return useQuery(
    zero.query.chats
      .where("id", "=", chatId)
      .related("messages", (q) => q.orderBy("createdAt", "asc"))
      .one(),
  );
}

type Chat = NonNullable<ReturnType<typeof useChatQuery>[0]>;
type Message = Chat["messages"][number];

// -- Global Store --

type ChatStore = {
  chat: Chat | null;
  chatStatus: "pending" | "error" | "success";
  model: string;
  abortController: AbortController;
  storeChat: (chat: Chat) => void;
  setModel: (newModel: string) => void;
  abort: () => void;
};

const chatStore = createStore<ChatStore>((set) => ({
  chat: null,
  chatStatus: "pending",
  abortController: new AbortController(),
  model: DEFAULT_MODEL,
  storeChat: (newChat: Chat) =>
    set((state) => {
      const currentChat = state.chat;
      // We use `replaceEqualDeep` to optimize re-renders.
      // Zero actually provides fine-grained updates, but they are not available with useQuery() because
      // it needs to clone everything in order to follow the rules of React. We'll probably change this in the future.
      const optimizedChat = replaceEqualDeep(currentChat, newChat);
      const latestModel = parseModelFromRole(
        optimizedChat.messages.findLast((m) => m.role.startsWith("assistant/"))
          ?.role,
      );
      return {
        chat: optimizedChat,
        model: latestModel ?? state.model,
        chatStatus: "success",
      };
    }),
  setModel: (newModel: string) => set({ model: newModel }),
  abort: () =>
    set((state) => {
      try {
        state.abortController.abort("cancel");
      } catch {}
      return { ...state, abortController: new AbortController() };
    }),
}));

function useChatSelector<U>(selector: (chat: Chat) => U) {
  return useStoreWithEqualityFn(
    chatStore,
    (state) => {
      const chat = state.chat;
      if (!chat) {
        throw new Error(
          "Chat is not loaded: you are probably calling `useChatSelector` without using `useIsChatLoaded` first.",
        );
      }
      return selector(chat);
    },
    dequal,
  );
}

function useIsChatLoaded() {
  return useStore(chatStore, (state) => state.chatStatus === "success");
}

function useChatLoader() {
  const [chat, chatResult] = useChatQuery();
  const storeChat = useStore(chatStore, (state) => state.storeChat);

  // I don't like this effect, but it's probably the best solution until Zero adds support for selectors.
  // We want:
  // - a global store with selectors
  // - some form of structural sharing to optimize re-renders (useQuery() clones everything to follow the rules of React)
  // We could technically use .materialize() and maintain the view, but it's probably not worth the complexity right now.
  React.useEffect(() => {
    if (chat) {
      storeChat(chat);
    } else if (chatResult.type === "complete") {
      notFound();
    }
  }, [chat, chatResult.type, storeChat]);

  return null;
}

// -- Page --

export default function ChatPage() {
  const chatId = useChatId();
  const z = useZero();

  useChatLoader();

  const isChatLoaded = useIsChatLoaded();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const cb = () => {
      z.mutate.chats.abortChat({
        chatId: chatId,
      });
    };
    window.addEventListener("beforeunload", cb);
    return () => {
      window.removeEventListener("beforeunload", cb);
    };
  }, [chatId, z.mutate.chats]);

  return (
    <div className="relative h-full flex-1">
      <ScrollArea className="h-full flex-1">
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pt-8 pb-36">
          {isChatLoaded && <MessageStack />}
        </div>
        <SendMessageForm />
      </ScrollArea>
    </div>
  );
}

function MessageStack(props: { className?: string }) {
  const { className } = props;
  const messages = useChatSelector((chat) => chat.messages);
  if (messages.length === 0) {
    return <MessageStackEmpty />;
  }
  return (
    <div className={cn("flex flex-col gap-8 px-4 pb-16", className)}>
      {messages.map((message) =>
        message.content ? <Message key={message.id} message={message} /> : null,
      )}
    </div>
  );
}

function MessageStackEmpty() {
  const sendUserMessage = useSendUserMessage();
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
        How can I help you, YOUR_NAME?
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
                  onClick={async () => {
                    await sendUserMessage({
                      prompt: suggestion,
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

      {(message.status === "aborted" || message.status === "error") && (
        <div className="bg-secondary text-secondary-foreground w-full max-w-sm rounded-md p-4 text-xs font-medium">
          {message.status === "aborted" ? (
            <>
              <CircleStopIcon className="mr-1.5 inline-block size-4 align-middle" />
              Stopped by user
            </>
          ) : (
            <>
              <CircleXIcon className="mr-1.5 inline-block size-4 align-middle" />
              Error while generating response, please try again.
            </>
          )}
        </div>
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
  const chatId = useChatId();
  const z = useZero();
  const pushAssistantMessage = usePushAssistantMessage();
  const form = useForm({
    defaultValues: {
      message: originalMessage.content,
    },
    onSubmit: async ({ value }) => {
      const newMessage = value.message.trim();
      if (newMessage && newMessage !== originalMessage.content.trim()) {
        const nextMessage = await z.query.messages
          .where("chatId", "=", chatId)
          .where("createdAt", ">", originalMessage.createdAt)
          .orderBy("createdAt", "asc")
          .one();
        await z.mutate.chats.updateMessage({
          id: originalMessage.id,
          content: value.message,
          timestamp: Date.now(),
        }).server;
        await pushAssistantMessage({
          prompt: newMessage,
          model: parseModelFromRole(nextMessage?.role),
        });
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
              const model = parseModelFromRole(message.role);
              await z.mutate.chats.deleteLaterMessages({
                messageId: message.id,
                includeMessage: false,
              }).client;
              await pushAssistantMessage({
                prompt: message.content,
                model,
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

function MessageActionsSystem(props: {
  message: Message /* & { role: `assistant/${string}` }; */;
}) {
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
              const model = parseModelFromRole(message.role);
              await z.mutate.chats.deleteLaterMessages({
                messageId: message.id,
                includeMessage: true,
              }).client;
              await pushAssistantMessage({
                prompt: message.content,
                model,
              });
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

function SendMessageForm() {
  const chatId = useChatId();
  const sendUserMessage = useSendUserMessage();
  const model = useStore(chatStore, (state) => state.model);
  const setModel = useStore(chatStore, (state) => state.setModel);
  const pendingMessage = useStore(chatStore, (state) =>
    state.chat?.messages.find((message) => message.status === "streaming"),
  );
  const isChatLoaded = useIsChatLoaded();
  const abort = useStore(chatStore, (state) => state.abort);
  const z = useZero();

  const form = useForm({
    defaultValues: {
      message: "",
    },
    onSubmit: async ({ value }) => {
      await sendUserMessage({ prompt: value.message });
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
            if (pendingMessage) {
              abort();
              await z.mutate.chats.abortChat({
                chatId,
              }).client;
            } else {
              await form.handleSubmit();
            }
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
                disabled={!!pendingMessage}
                rows={4}
              />
            )}
          />

          <Button
            type="submit"
            disabled={!isChatLoaded}
            className="absolute right-1.5 bottom-1.5"
            size="icon-lg"
          >
            {pendingMessage ? (
              <>
                <SquareIcon className="fill-current" />
                <span className="sr-only">Stop</span>
              </>
            ) : (
              <>
                <ArrowUpIcon />
                <span className="sr-only">Send</span>
              </>
            )}
          </Button>
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

function useSendUserMessage() {
  const chatId = useChatId();
  const pushAssistantMessage = usePushAssistantMessage();
  const z = useZero();
  const model = useStore(chatStore, (state) => state.model);
  return React.useCallback(
    async (input: { prompt: string }) => {
      await z.mutate.chats.sendUserMessage({
        id: crypto.randomUUID(),
        chatId: chatId,
        content: input.prompt,
        timestamp: Date.now(),
      }).client;
      await pushAssistantMessage({ prompt: input.prompt, model });
    },
    [chatId, model, pushAssistantMessage, z.mutate.chats],
  );
}

function usePushAssistantMessage() {
  const z = useZero();
  const chatId = useChatId();
  const abortController = useStore(chatStore, (state) => state.abortController);
  return React.useCallback(
    async (input: { prompt: string; model?: string }) => {
      // TODO: use .toSorted() insted of cloning the array
      const messages = (
        await z.query.messages.where("chatId", "=", chatId)
      ).toSorted((a, b) => a.createdAt - b.createdAt);
      const lastMessage = messages.findLast((m) =>
        m.role.startsWith("assistant/"),
      );
      const messageId = crypto.randomUUID();
      const model =
        input.model ??
        lastMessage?.role.slice("assistant/".length) ??
        DEFAULT_MODEL; // TODO: handle fallback
      await z.mutate.chats.pushAssistantMessageChunk({
        chatId: chatId,
        messageId,
        chunk: "",
        chunkType: "first",
        timestamp: Date.now(),
        model,
      }).client;
      console.log(messages);
      const response = streamResponse(messages, {
        ...(model.startsWith("ollama/")
          ? {
              provider: "ollama",
              modelId: model.slice("ollama/".length),
            }
          : {
              provider: "openrouter",
              modelId: model, // Remember: `deepseek/deepseek-r1-0528:free` is free
            }),
        abortSignal: abortController.signal,
      });
      for await (const chunk of response) {
        await z.mutate.chats.pushAssistantMessageChunk({
          chatId: chatId,
          messageId,
          chunk,
          chunkType: "middle",
          timestamp: Date.now(),
          model,
        }).client;
      }
      await z.mutate.chats.pushAssistantMessageChunk({
        chatId: chatId,
        messageId,
        chunk: "",
        chunkType: "last",
        timestamp: Date.now(),
        model,
      }).client;
    },
    [abortController.signal, chatId, z.mutate.chats, z.query.messages],
  );
}
