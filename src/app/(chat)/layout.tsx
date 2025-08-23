"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { Dialog, DialogContent, DialogTitle } from "~/components/system/dialog";
import { Input } from "~/components/system/input";
import { ScrollArea } from "~/components/system/scroll-area";
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

  const [chatTrees] = useQuery(
    z.query.chatTrees.where("userId", "=", z.userID),
  );
  const startNewChat = useStartNewChat();

  return (
    <div className="relative h-full flex-col">
      <div
        className={cn(
          "absolute top-4 left-2 z-20 flex gap-0.5 transition-all",
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

        <SidebarContent chatTrees={chatTrees} />
      </div>
    </div>
  );
}

function SidebarContent(props: { chatTrees: ZeroRow<"chatTrees">[] }) {
  const { chatTrees } = props;
  const z = useZero();
  const [sortedChats] = useQuery(
    z.query.chats.where("userId", "=", z.userID).orderBy("updatedAt", "desc"),
  );
  const chatTreeId = chatTrees[0]?.id;
  const [expanded, setExpanded] = useState<Key[]>([]);
  const startNewChat = useStartNewChat();
  const openChatTelescope = useChatTelescopeState((state) => state.setOpen);
  if (!chatTreeId) {
    return null;
  }
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
        {(["tree", "list"] as const).map((mode) => (
          <TabsPrimitive.Content
            key={mode}
            value={mode}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ChatTree
                className="w-full px-4 py-1.5"
                mode={mode}
                sortedChats={sortedChats}
                chatTreeId={chatTreeId}
                expanded={expanded}
                onExpandedChange={setExpanded}
                getChatTitle={(chatId) => {
                  const chat = sortedChats.find((chat) => chat.id === chatId);
                  return chat?.title ?? "?";
                }}
              />
            </div>
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>
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
        if (focusedChat && open) {
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
  }, [
    cursor,
    filteredChats.length,
    focusedChat,
    open,
    router,
    setCursor,
    setOpen,
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Search chats</DialogTitle>
      <DialogContent
        className="flex h-1/2 w-full max-w-4xl! overflow-hidden p-2.5 focus-visible:outline-none"
        showCloseButton={false}
      >
        <div className="grid w-full grid-cols-2 gap-2.5">
          <div className="flex flex-col gap-2 overflow-hidden">
            <ScrollArea
              className="min-h-0 flex-1 overflow-hidden rounded-md border"
              contentClassName="min-w-0! p-1"
            >
              <ul className="text-sm [&>li]:rounded-sm [&>li]:px-2 [&>li]:py-1">
                {filteredChats.map((chat, index) => (
                  <li
                    key={index}
                    className={cn(
                      "hover:bg-primary/10 min-w-0 cursor-pointer truncate",
                      cursor === index && "bg-primary/10",
                    )}
                    onClick={() => {
                      setCursor(index);
                    }}
                  >
                    {chat.title}
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <Input
              placeholder="Search your chats..."
              autoFocus
              value={search}
              ref={inputRef}
              onChange={(e) => setSearch(e.target.value)}
              className="focus-visible:border-inherit focus-visible:ring-0"
            />
          </div>
          <div className="flex flex-col gap-2 overflow-hidden">
            <ScrollArea
              className="min-h-0 flex-1 overflow-hidden rounded-md border"
              contentClassName="p-2 min-w-0"
            >
              <ul className="flex flex-col gap-1 overflow-hidden">
                {focusedChat?.messages.map((message) => {
                  if (!message.content && message.status !== "error")
                    return null;
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
            </ScrollArea>
          </div>
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
