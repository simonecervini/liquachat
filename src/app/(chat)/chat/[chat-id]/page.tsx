"use client";

import * as React from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useQuery } from "@rocicorp/zero/react";
import { useForm } from "@tanstack/react-form";
import { replaceEqualDeep, useMutation } from "@tanstack/react-query";
import { dequal } from "dequal";
import {
  ArrowUpIcon,
  BookOpenIcon,
  CheckIcon,
  CircleStopIcon,
  CircleXIcon,
  CodeIcon,
  CopyIcon,
  GitBranchIcon,
  GraduationCapIcon,
  LoaderIcon,
  RefreshCcwIcon,
  SparklesIcon,
  SquareIcon,
  SquarePenIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { Tabs } from "radix-ui";
import { toast } from "sonner";
import { createStore, useStore } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";

import { Markdown } from "~/components/markdown";
import {
  DEFAULT_MODEL,
  ModelCombobox,
  useModels,
} from "~/components/model-combobox";
import { Button } from "~/components/system/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/system/dialog";
import { Input } from "~/components/system/input";
import { ScrollArea } from "~/components/system/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/system/tooltip";
import {
  isOllamaRunning,
  parseModelFromRole,
  streamResponse,
  type ReasoningEffort,
} from "~/lib/ai";
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
      // FIXME: this should work, but something is wrong
      // notFound();
    }
  }, [chat, chatResult.type, storeChat]);

  return null;
}

// -- Page --

export default function ChatPage() {
  const chatId = useChatId();
  const z = useZero();
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
    <>
      <ChatLoader />

      <div className="relative h-full flex-1">
        <MessageStackScrollable className="h-full flex-1">
          {isChatLoaded && <MessageStack />}
        </MessageStackScrollable>
        <SendMessageForm />
      </div>
    </>
  );
}

function ChatLoader() {
  // Required to optimize re-renders
  useChatLoader();
  return null;
}

function MessageStackScrollable(props: {
  className?: string;
  children: React.ReactNode;
}) {
  const { className, children } = props;
  return (
    <ScrollArea
      // NOTE: we need the padding to offset the 'before:' absolute positioning on the root element
      className={cn("h-full flex-1 px-3.5 pt-3.5", className)}
      viewportClassName="flex flex-col-reverse"
      scrollbarClassName="invisible" // NOTE: without this, the scroll to bottom doesn't work
    >
      <div className="pointer-events-none absolute inset-x-3.5 top-3.5 z-10 h-10 rounded-t-full bg-gradient-to-t from-transparent to-white" />
      <div
        // NOTE: the min height value is required to offset the container padding
        className="mx-auto flex min-h-[calc(100vh-0.875rem)] w-full max-w-4xl flex-1 flex-col px-4 pt-8 pb-36"
      >
        {children}
      </div>
    </ScrollArea>
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
      {messages.map((message) => {
        if (!message.content && message.status === "streaming") {
          return (
            <div key={message.id}>
              <LoaderIcon className="size-8 animate-spin" />
            </div>
          );
        }
        return message.content ||
          message.status === "error" ||
          message.status === "aborted" ? (
          <Message key={message.id} message={message} />
        ) : null;
      })}
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
      <h2 className="mb-8 text-3xl font-semibold">How can I help you?</h2>
      <Tabs.Root defaultValue="create" className="w-full">
        <Tabs.List className="mb-8 flex justify-start gap-2">
          {Object.entries(tabs).map(([key, tab]) => {
            const Icon = tab.icon;
            return (
              <Tabs.Trigger
                key={key}
                value={key}
                className="data-[state=inactive]:bg-secondary data-[state=inactive]:text-secondary-foreground inline-flex h-9 items-center gap-2 rounded-md bg-gradient-to-t from-blue-500 to-blue-400 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-600 hover:to-blue-500 data-[state=inactive]:bg-none data-[state=inactive]:shadow-none data-[state=inactive]:hover:bg-blue-200"
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
              Error while generating response. Common causes: invalid OpenRouter
              API key, insufficient credits, or non-existent Ollama model.
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
        "flex max-w-[60%] rounded-2xl bg-gradient-to-tl from-white/70 to-white/90 p-4 wrap-break-word backdrop-blur-lg",
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
    <div
      role="article"
      aria-label="Assistant message"
      className="w-full wrap-break-word"
    >
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
  const chatId = useChatId();
  const { buttonProps: copyButtonProps, copied } = useCopyButton(
    message.content,
  );
  const z = useZero();
  const pushAssistantMessage = usePushAssistantMessage();
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={async () => {
              const nextMessage = await z.query.messages
                .where("chatId", "=", chatId)
                .where("createdAt", ">", message.createdAt)
                .orderBy("createdAt", "asc")
                .one();
              await z.mutate.chats.deleteLaterMessages({
                messageId: message.id,
                includeMessage: false,
              }).client;
              await pushAssistantMessage({
                prompt: message.content,
                model: parseModelFromRole(nextMessage?.role),
              });
            }}
          >
            <RefreshCcwIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Retry message</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
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
        <TooltipTrigger asChild>
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
  const chatId = useChatId();
  const pushAssistantMessage = usePushAssistantMessage();
  const z = useZero();
  const router = useRouter();
  const { mutate: fork, isPending: isForking } = useMutation({
    mutationFn: async () => {
      // TODO: we should not wait for the server to complete, but it doesn't work otherwise
      // We should not need this (tanstack) mutation at all
      const forkedChatId = crypto.randomUUID();
      await z.mutate.chats.fork({
        chatId: chatId,
        forkedChatId,
        messageId: message.id,
      }).server;
      router.push(`/chat/${forkedChatId}`);
    },
  });
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" {...copyButtonProps}>
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copy message</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={async () => {
              if (!isForking) {
                fork(undefined, {
                  onSuccess: () => {
                    toast.success(
                      "Started new fork — you've already been redirected.",
                      {
                        description:
                          "In the tree view, you can find both the original chat and the forked chat in a new folder.",
                      },
                    );
                  },
                });
              }
            }}
          >
            <GitBranchIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Start new fork</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
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
  const [openRouterKeyDialogOpen, setOpenRouterKeyDialogOpen] =
    React.useState(false);
  const chatId = useChatId();
  const sendUserMessage = useSendUserMessage();
  const [reasoningEffort, setReasoningEffort] =
    React.useState<ReasoningEffort>("high");
  const { data: models } = useModels();
  const model = useStore(chatStore, (state) => state.model);
  const setModel = useStore(chatStore, (state) => state.setModel);
  const pendingMessage = useStore(
    chatStore,
    (state) =>
      // NOTE: do not return the object, it will cause a ton of re-renders while the message is streaming
      !!state.chat?.messages.find((message) => message.status === "streaming"),
  );
  const isChatLoaded = useIsChatLoaded();
  const abort = useStore(chatStore, (state) => state.abort);
  const z = useZero();

  const form = useForm({
    defaultValues: {
      message: "",
    },
    onSubmit: async ({ value }) => {
      const prompt = value.message.trim();
      if (prompt) {
        if (model.startsWith("ollama/")) {
          if (!(await isOllamaRunning())) {
            toast.error(
              "Ollama models unavailable: Ollama service is not running. Please start Ollama and try again.",
            );
            return;
          }
        } else {
          if (!window.localStorage.getItem("openrouter-api-key")) {
            setOpenRouterKeyDialogOpen(true);
            return;
          }
        }
        form.reset();
        await sendUserMessage({ prompt });
      }
    },
  });

  const handleSubmit = async (
    event:
      | React.FormEvent<HTMLFormElement>
      | React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
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
  };

  return (
    <>
      <div className="absolute bottom-0 left-1/2 w-full max-w-2xl -translate-x-1/2 px-1">
        <div className="border-primary/10 relative h-full w-full rounded-t-3xl border-x-3 border-t-3 bg-white/100 text-sm text-slate-500 shadow-2xl shadow-blue-700/10">
          <form onSubmit={handleSubmit}>
            <form.Field
              name="message"
              children={(field) => (
                <textarea
                  name={field.name}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Type your message here..."
                  className="h-full w-full resize-none border-none bg-transparent p-6 outline-none"
                  rows={4}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      await handleSubmit(e);
                    }
                  }}
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
          <div className="absolute bottom-1.5 left-1.5 flex gap-0.5 rounded-md bg-white/50 backdrop-blur-xl">
            <ModelCombobox
              value={model}
              onChange={(value) => {
                setModel(value);
              }}
              slotProps={{
                button: {
                  className: "text-xs",
                  size: "sm",
                },
                popoverContent: {
                  align: "start",
                },
              }}
            />
            <ReasoningEffortButton
              variant="ghost"
              size="sm"
              className="text-xs"
              value={reasoningEffort}
              onChange={(value) => {
                setReasoningEffort(value);
              }}
              disabled={!models.find((m) => m.id === model)?.reasoning}
            />
          </div>
        </div>
      </div>
      <OpenRouterKeyDialog
        open={openRouterKeyDialogOpen}
        onOpenChange={setOpenRouterKeyDialogOpen}
        onSubmit={async () => {
          await form.handleSubmit();
        }}
      />
    </>
  );
}

function ReasoningEffortButton(
  props: {
    value: ReasoningEffort;
    onChange: (value: ReasoningEffort) => void;
  } & Omit<React.ComponentProps<typeof Button>, "onChange">,
) {
  const { value, onChange, ...rest } = props;
  const disabled = rest.disabled ?? false;
  const valueForIcon = disabled ? "high" : value;
  return (
    <Button
      onClick={() => {
        onChange(
          value === "high" ? "low" : value === "medium" ? "high" : "medium",
        );
      }}
      disabled={disabled}
      {...rest}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="M12,4.69c0-1.66-1.33-3-2.99-3.01-1.66,0-3,1.33-3.01,2.99,0,.05,0,.1,0,.14-2.14,.55-3.43,2.73-2.88,4.87,.08,.31,.2,.62,.35,.9-1.71,1.39-1.98,3.91-.58,5.63,.32,.39,.7,.71,1.14,.96-.28,2.19,1.26,4.2,3.45,4.48,2.19,.28,4.2-1.26,4.48-3.45,.02-.17,.03-.34,.03-.51V4.69Z"></path>
        <path d="M12,17.69c0,.17,.01,.34,.03,.51,.28,2.19,2.29,3.74,4.48,3.45,2.19-.28,3.74-2.29,3.45-4.48,.44-.25,.82-.57,1.14-.96,1.39-1.71,1.13-4.23-.58-5.63,.15-.28,.27-.59,.35-.9,.55-2.14-.74-4.32-2.88-4.87,0-.05,0-.1,0-.14,0-1.66-1.35-3-3.01-2.99-1.66,0-3,1.35-2.99,3.01v13Z"></path>
        {valueForIcon === "high" && (
          <>
            <path d="M17.22,13.44c-3.72,1.79-5.31-1.79-5.21-4.66"></path>
            <path d="M11.94,8.78c.1,2.87-1.49,6.45-5.21,4.66"></path>
          </>
        )}
        {valueForIcon !== "low" && (
          <>
            <path d="M6,4.81c.02,.48,.32,2.19,2.42,2.76"></path>
            <path d="M15.58,7.57c2.1-.57,2.4-2.28,2.42-2.76"></path>
            <path d="M7.85,17.43c-1.49,.47-3.22,.08-3.82-.26"></path>
            <path d="M19.97,17.17c-.6,.34-2.33,.73-3.82,.26"></path>
          </>
        )}
        <path d="M3.48,10.58c.93-.61,1.8-.83,2.88-.7"></path>
        <path d="M17.64,9.88c1.08-.13,1.95,.1,2.88,.7"></path>
      </svg>
      {disabled ? "default" : value}
    </Button>
  );
}

function OpenRouterKeyDialog(
  props: { onSubmit?: () => void } & React.ComponentProps<typeof Dialog>,
) {
  const { onSubmit, ...rest } = props;
  const form = useForm({
    defaultValues: {
      value: "",
    },
    onSubmit: ({ value }) => {
      const newValue = value.value?.trim();
      if (newValue) {
        window.localStorage.setItem("openrouter-api-key", newValue);
        onSubmit?.();
      }
      props.onOpenChange?.(false);
    },
  });
  return (
    <Dialog {...rest}>
      <DialogContent className="sm:max-w-[500px]">
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Configure OpenRouter API Key</DialogTitle>
            <DialogDescription>
              To use AI models, you need an OpenRouter API key. Get one from the{" "}
              <a
                href="https://openrouter.ai/settings/keys"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-4"
              >
                OpenRouter website
              </a>
              .<br />
              <br />
              Your key is stored in your browser and sent to OpenRouter only
              during AI requests - it is NEVER sent to any other servers under
              any circumstances.
              <br />
              <br />
              <strong>YOU make the requests</strong> to OpenRouter directly with
              your browser, and <strong>YOU stream the AI responses</strong> to
              all connected clients. No intermediaries.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 mb-4 grid gap-4">
            <form.Field
              name="value"
              children={(field) => (
                <Input
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={field.state.value}
                  onChange={(e) => {
                    field.handleChange(e.target.value);
                  }}
                  onBlur={field.handleBlur}
                  autoFocus
                />
              )}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <form.Subscribe
              selector={(state) => [state.canSubmit]}
              children={([canSubmit]) => (
                <Button type="submit" disabled={!canSubmit}>
                  Save
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function useSendUserMessage() {
  const chatId = useChatId();
  const pushAssistantMessage = usePushAssistantMessage();
  const z = useZero();
  const model = useStore(chatStore, (state) => state.model);
  return React.useCallback(
    async (input: { prompt: string; reasoningEffort?: ReasoningEffort }) => {
      await z.mutate.chats.sendUserMessage({
        id: crypto.randomUUID(),
        chatId: chatId,
        content: input.prompt,
        timestamp: Date.now(),
      }).client;
      await pushAssistantMessage({
        model,
        prompt: input.prompt,
        reasoningEffort: input.reasoningEffort,
      });
    },
    [chatId, model, pushAssistantMessage, z.mutate.chats],
  );
}

function usePushAssistantMessage() {
  const z = useZero();
  const chatId = useChatId();
  const abortController = useStore(chatStore, (state) => state.abortController);
  return React.useCallback(
    async (input: {
      prompt: string;
      model?: string;
      reasoningEffort?: ReasoningEffort;
    }) => {
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
      let error = false;
      try {
        const response = streamResponse(messages, {
          ...(model.startsWith("ollama/")
            ? {
                provider: "ollama",
                modelId: model.slice("ollama/".length),
              }
            : {
                provider: "openrouter",
                modelId: model, // Remember: `deepseek/deepseek-r1-0528:free` is free
                reasoningEffort: input.reasoningEffort,
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
      } catch (err) {
        console.error("Error streaming response:", err);
        error = true;
      }
      await z.mutate.chats.pushAssistantMessageChunk({
        chatId: chatId,
        messageId,
        chunk: "",
        chunkType: error ? "last-error" : "last",
        timestamp: Date.now(),
        model,
      }).client;
    },
    [abortController.signal, chatId, z.mutate.chats, z.query.messages],
  );
}
