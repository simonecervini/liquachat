"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@rocicorp/zero/react";
import {
  CircleXIcon,
  FolderTreeIcon,
  ListIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { matchSorter } from "match-sorter";
import { Tabs as TabsPrimitive } from "radix-ui";
import type { Key } from "react-aria-components";
import { create } from "zustand";

import { ChatTree } from "~/components/chat-tree";
import { ChatCombobox } from "~/components/chat-tree-combobox";
import { Logo } from "~/components/logo";
import { Markdown } from "~/components/markdown";
import { Button } from "~/components/system/button";
import { Dialog, DialogContent } from "~/components/system/dialog";
import { Input } from "~/components/system/input";
import { cn } from "~/lib/cn";
import { useZero } from "~/zero/react";
import type { ZeroRow } from "~/zero/schema";

export default function Layout(props: { children: React.ReactNode }) {
  const { children } = props;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="flex h-screen">
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div
        className={cn(
          "relative grow transition-all before:absolute before:inset-0 before:rounded-t-3xl before:border-3 before:border-b-0 before:border-white before:bg-white before:bg-gradient-to-tl before:from-white/70 before:to-white/80 before:shadow-2xl before:shadow-black/5 before:transition-all before:content-[''] before:sm:top-3.5 before:sm:right-3.5 before:sm:left-3.5",
          !sidebarOpen && "before:inset-0! before:rounded-none",
        )}
      >
        {children}
      </div>
      <ChatTelescope />
    </div>
  );
}

function Sidebar(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { open, onOpenChange } = props;
  const z = useZero();

  const [chats] = useQuery(z.query.chats.where("userId", "=", z.userID));
  const [chatTrees] = useQuery(
    z.query.chatTrees.where("userId", "=", z.userID),
  );
  const startNewChat = useStartNewChat();

  return (
    <div className="relative h-full flex-col">
      <div
        className={cn(
          "absolute top-4 left-2 z-10 flex gap-0.5 transition-all",
          !open && "sm:left-4",
        )}
      >
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(!open)}>
          <PanelLeftIcon />
        </Button>
        <Button
          className={cn(
            "animate-in fade-in sm:hidden",
            !open && "inline-flex!",
          )}
          variant="ghost"
          size="icon"
          onClick={async () => {
            // TODO: use the last used chat tree
            await startNewChat(chatTrees[0]!.id);
          }}
        >
          <PlusIcon />
        </Button>
      </div>
      <div
        className={cn(
          "hidden h-full flex-col items-center border-r-3 border-white/50 bg-linear-to-r from-transparent to-white/20 pt-4 transition-all duration-300 sm:flex",
          open ? "w-60 opacity-100" : "w-0 opacity-0",
        )}
      >
        <Logo className="mb-2 px-4" />

        {chatTrees.length > 0 && (
          <SidebarContent chatTrees={chatTrees} chats={chats} />
        )}
      </div>
    </div>
  );
}

function SidebarContent(props: {
  chatTrees: ZeroRow<"chatTrees">[];
  chats: ZeroRow<"chats">[];
}) {
  const { chatTrees, chats } = props;
  const [chatTreeId, setChatTreeId] = useState(chatTrees[0]!.id);
  const [expanded, setExpanded] = useState<Key[]>([]);
  const startNewChat = useStartNewChat();
  const openChatTelescope = useChatTelescopeState((state) => state.setOpen);
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="mb-2 flex flex-col gap-2 px-2 pb-2">
        <Button
          size="lg"
          onClick={async () => {
            await startNewChat(chatTreeId);
          }}
        >
          <PlusIcon />
          New Chat
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => openChatTelescope(true)}
        >
          <SearchIcon />
          Search chats
        </Button>
      </div>

      <TabsPrimitive.Root
        className="flex min-h-0 flex-1 flex-col"
        defaultValue="tree"
      >
        <TabsPrimitive.List className="text-muted-foreground mb-1 flex justify-center gap-2 px-4 text-xs">
          <TabsPrimitive.Trigger
            className="data-[state=active]:text-primary flex items-center gap-2 rounded-[0.5em] px-1.5 py-1"
            value="tree"
          >
            <FolderTreeIcon className="size-4" />
            Tree
          </TabsPrimitive.Trigger>
          <TabsPrimitive.Trigger
            className="data-[state=active]:text-primary flex items-center gap-2 rounded-[0.5em] px-1.5 py-1"
            value="list"
          >
            <ListIcon className="size-4" />
            List
          </TabsPrimitive.Trigger>
        </TabsPrimitive.List>
        <TabsPrimitive.Content
          value="tree"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ChatTree
              className="w-full px-4 py-1.5"
              chatTreeId={chatTreeId}
              expanded={expanded}
              onExpandedChange={setExpanded}
              getChatTitle={(chatId) => {
                const chat = chats.find((chat) => chat.id === chatId);
                return chat?.title ?? "?";
              }}
            />
          </div>
          <div className="mb-2 px-4">
            <ChatCombobox
              value={chatTreeId}
              onChange={setChatTreeId}
              options={chatTrees.map((chatTree) => ({
                id: chatTree.id,
                label: "Untitled",
              }))}
              className="w-full flex-shrink-0"
            />
          </div>
        </TabsPrimitive.Content>
        <TabsPrimitive.Content
          value="list"
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <ChatList chats={chats} className="px-4 pt-3.5" />
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
  );
}

function ChatList(props: { chats: ZeroRow<"chats">[]; className?: string }) {
  const { chats, className } = props;

  const children = React.useMemo(() => {
    const _items: Array<
      | { kind: "DIVIDER"; id: string; title: string }
      | { kind: "CHAT"; chat: ZeroRow<"chats"> }
    > = [];
    const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
    let lastDividerTitle: string | undefined;
    for (const chat of sortedChats) {
      const date = new Date(chat.updatedAt);
      const title = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (title !== lastDividerTitle) {
        _items.push({ kind: "DIVIDER", id: crypto.randomUUID(), title });
        lastDividerTitle = title;
      }
      _items.push({ kind: "CHAT", chat });
    }
    return _items;
  }, [chats]);

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      {children.map((child) =>
        child.kind === "CHAT" ? (
          <Button
            variant="ghost"
            asChild
            key={child.chat.id}
            className="block justify-start truncate text-sm font-normal"
            title={child.chat.title}
          >
            <Link href={`/chat/${child.chat.id}`}>{child.chat.title}</Link>
          </Button>
        ) : (
          <div className="text-sm font-semibold" key={child.id}>
            {child.title}
          </div>
        ),
      )}
    </div>
  );
}

const useChatTelescopeState = create<{
  search: string;
  cursor: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  setCursor: (cursor: number) => void;
  setSearch: (search: string) => void;
}>()((set) => ({
  search: "",
  cursor: 0,
  open: false,
  setOpen: (open: boolean) => set({ open, cursor: 0 }),
  setCursor: (cursor: number) => set({ cursor }),
  setSearch: (search: string) => set({ search, cursor: 0 }),
}));

// Inspired by the GOAT https://github.com/nvim-telescope/telescope.nvim
function ChatTelescope() {
  // TODO: we need to use `useDeferredValue` here
  const z = useZero();
  const router = useRouter();
  const [chats] = useQuery(
    z.query.chats
      .where("userId", "=", z.userID)
      .orderBy("title", "asc")
      .related("messages", (q) => q.orderBy("createdAt", "asc")),
  );

  const { open, setOpen, cursor, setCursor, search, setSearch } =
    useChatTelescopeState();

  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredChats = React.useMemo(() => {
    return matchSorter(chats, search, {
      keys: ["title", "messages.*.content"],
    });
  }, [chats, search]);

  const focusedChat = filteredChats[cursor];

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        setCursor(Math.min(cursor + 1, filteredChats.length - 1));
      } else if (e.key === "ArrowUp") {
        setCursor(Math.max(cursor - 1, 0));
      } else if (e.key === "Enter") {
        if (focusedChat) {
          router.push(`/chat/${focusedChat.id}`);
        }
        setOpen(false);
      } else if (e.key === "Escape") {
        setOpen(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        setOpen(true);
      } else if (e.key !== "Tab") {
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cursor, filteredChats.length, focusedChat, router, setCursor, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="flex h-1/2 w-full max-w-4xl! overflow-hidden p-3 focus-visible:outline-none"
        showCloseButton={false}
      >
        <div className="grid grow grid-cols-2 gap-2.5">
          <div className="flex h-full flex-col gap-2.5">
            <div className="grow rounded-lg border">
              <ul className="flex flex-col gap-1 p-1 text-sm [&>li]:rounded-sm [&>li]:px-2 [&>li]:py-1">
                {filteredChats.map((chat, index) => (
                  <li
                    key={chat.id}
                    className={cn(
                      "cursor-pointer",
                      cursor === index && "bg-primary/10",
                    )}
                  >
                    {chat.title}
                  </li>
                ))}
              </ul>
            </div>
            <Input
              placeholder="Search your chats..."
              autoFocus
              value={search}
              ref={inputRef}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul className="flex flex-col gap-1.5 overflow-y-scroll p-0.5 text-sm">
            {focusedChat?.messages.map((message) => {
              if (!message.content && message.status !== "error") return null;
              return (
                <li
                  key={message.id}
                  className="bg-secondary/50 rounded-sm p-2 text-xs/loose"
                >
                  {message.content ? (
                    <Markdown className="gap-1 text-xs/loose">
                      {message.content}
                    </Markdown>
                  ) : (
                    <>
                      <CircleXIcon className="mr-1 inline-block size-[1em] align-middle" />
                      Error while generating response
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function useStartNewChat() {
  const z = useZero();
  const router = useRouter();
  return React.useCallback(
    async (chatTreeId: string) => {
      const chatId = crypto.randomUUID();
      await z.mutate.chats.init({
        id: chatId,
        timestamp: Date.now(),
        chatTreeId,
      }).client;
      router.push(`/chat/${chatId}`);
    },
    [router, z.mutate.chats],
  );
}
