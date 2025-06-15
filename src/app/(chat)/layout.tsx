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
import { useZero } from "~/zero/react";
import type { ZeroRow } from "~/zero/schema";

export default function Layout(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <div className="flex h-screen gap-3 pr-4">
      <Sidebar />
      <div className="relative mt-3 w-60 grow rounded-t-3xl border-3 border-b-0 border-white bg-gradient-to-tl from-white/70 to-white/80 shadow-2xl shadow-black/5">
        {children}
      </div>
    </div>
  );
}

function Sidebar() {
  const z = useZero();
  const [open, setOpen] = useState(false); // TODO: implement this

  const [chats] = useQuery(z.query.chats.where("userId", "=", z.userID));
  const [chatTrees] = useQuery(
    z.query.chatTrees.where("userId", "=", z.userID),
  );

  return (
    <div className="flex w-60 flex-col items-center border-r-3 border-white/50 bg-linear-to-r from-transparent to-white/20 px-4 py-4">
      <div className="mb-3 flex w-full items-center justify-between">
        <button
          className="text-slate-900 transition-colors hover:text-blue-500"
          onClick={() => setOpen((prev) => !prev)}
        >
          <PanelLeftIcon className="size-5" />
        </button>
        <Logo />
        <PanelLeftIcon className="invisible size-5 text-blue-500" />
      </div>

      {chatTrees.length > 0 && (
        <SidebarContent chatTrees={chatTrees} chats={chats} />
      )}
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
  const z = useZero();
  const router = useRouter();
  return (
    <div className="flex h-full w-full flex-col">
      <Button
        className="w-full"
        size="lg"
        onClick={async () => {
          const chatId = crypto.randomUUID();
          await z.mutate.chats.init({
            id: chatId,
            timestamp: Date.now(),
            chatTreeId,
          }).client;
          router.push(`/chat/${chatId}`);
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

      <TabsPrimitive.Root
        className="flex grow flex-col gap-1.5"
        defaultValue="tree"
      >
        <TabsPrimitive.List className="text-muted-foreground flex justify-center gap-2 text-xs">
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
          className="flex grow flex-col justify-between"
        >
          <ChatTree
            className="w-full"
            chatTreeId={chatTreeId}
            expanded={expanded}
            onExpandedChange={setExpanded}
          />
          <ChatCombobox
            value={chatTreeId}
            onChange={setChatTreeId}
            options={chatTrees.map((chatTree) => ({
              id: chatTree.id,
              label: "Untitled",
            }))}
            className="w-full"
          />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="list">
          <div className="flex w-full flex-col gap-2">
            {chats.map((chat) => (
              <Link
                href={`/chat/${chat.id}`}
                key={chat.id}
                className="rounded-xl p-2 text-left text-sm text-slate-700 transition-colors hover:bg-white/20 hover:text-slate-900"
                // TODO: add chat title
              >
                {chat.id.slice(0, 8)}
              </Link>
            ))}
          </div>
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex h-10 w-full items-center justify-center gap-1 font-extrabold text-slate-900">
      <DropletIcon className="size-4 text-blue-500" strokeWidth={3} />
      Liqua
    </div>
  );
}
