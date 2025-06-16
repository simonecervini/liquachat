"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@rocicorp/zero/react";
import {
  DropletIcon,
  FolderTreeIcon,
  ListIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { Tabs as TabsPrimitive } from "radix-ui";
import type { Key } from "react-aria-components";

import { ChatTree } from "~/components/chat-tree";
import { ChatCombobox } from "~/components/chat-tree-combobox";
import { Button } from "~/components/system/button";
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
          "relative grow transition-all before:absolute before:top-3 before:right-3 before:bottom-0 before:left-4 before:rounded-t-3xl before:border-3 before:border-b-0 before:border-white before:bg-white before:bg-gradient-to-tl before:from-white/70 before:to-white/80 before:shadow-2xl before:shadow-black/5 before:transition-all before:content-['']",
          !sidebarOpen && "before:inset-0 before:rounded-none",
        )}
      >
        {children}
      </div>
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
    <div className="relative flex h-full flex-col">
      <div
        className={cn(
          "absolute top-4 left-2 z-10 flex gap-0.5 transition-all",
          !open && "left-4",
        )}
      >
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(!open)}>
          <PanelLeftIcon />
        </Button>
        {!open && (
          <>
            <Button
              className="animate-in fade-in"
              variant="ghost"
              size="icon"
              onClick={async () => {
                // TODO: use the last used chat tree
                await startNewChat(chatTrees[0]!.id);
              }}
            >
              <PlusIcon />
            </Button>
          </>
        )}
      </div>
      <div
        className={cn(
          "flex h-full flex-col items-center border-r-3 border-white/50 bg-linear-to-r from-transparent to-white/20 pt-4 transition-all duration-300",
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
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Key[]>([]);
  const startNewChat = useStartNewChat();
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="px-4">
        <Button
          className="w-full"
          size="lg"
          onClick={async () => {
            await startNewChat(chatTreeId);
          }}
        >
          <PlusIcon />
          New Chat
        </Button>

        <div className="relative mt-3.5 mb-4.5 w-full">
          <input
            type="text"
            placeholder="Search your chats..."
            className="focus:border-primary w-full border-b border-gray-300 bg-transparent py-2 pl-6.5 text-xs focus:outline-none"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpanded([]);
            }}
          />
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-0 size-4 -translate-y-1/2 transform" />
        </div>
      </div>

      <TabsPrimitive.Root
        className="flex min-h-0 flex-1 flex-col"
        defaultValue="tree"
      >
        <TabsPrimitive.List className="text-muted-foreground flex justify-center gap-2 px-4 text-xs">
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

function Logo(props: { className?: string }) {
  const { className } = props;
  return (
    <div
      className={cn(
        "flex h-10 w-full items-center justify-center gap-1 font-extrabold text-slate-900",
        className,
      )}
    >
      <DropletIcon className="size-4 text-blue-500" strokeWidth={3} />
      Liqua
    </div>
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
