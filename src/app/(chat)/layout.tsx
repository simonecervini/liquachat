"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zero } from "@rocicorp/zero";
import { ZeroProvider } from "@rocicorp/zero/react";
import { DropletIcon, PanelLeftIcon, PlusIcon, SearchIcon } from "lucide-react";

import { ChatTree } from "~/components/chat-tree";
import { Button } from "~/components/system/button";
import { env } from "~/env";
import { createMutators } from "~/zero";
import { schema, type AuthData } from "~/zero/schema";

// TODO: this is for testing purposes
const authData: AuthData = {
  sub: "a167ca4e-8edb-4f24-a453-24d53be7179c",
};
const zero = new Zero({
  userID: authData.sub,
  server: env.NEXT_PUBLIC_ZERO_SERVER_URL,
  schema,
  kvStore: "mem",
  mutators: createMutators(authData),
});

export default function Layout(props: { children: React.ReactNode }) {
  const { children } = props;
  return (
    <ZeroProvider zero={zero}>
      <div className="flex h-screen gap-3 pr-4">
        <Sidebar />
        <div className="relative mt-3 w-60 grow rounded-t-3xl border-3 border-b-0 border-white bg-gradient-to-tl from-white/70 to-white/80 shadow-2xl shadow-black/5">
          {children}
        </div>
      </div>
    </ZeroProvider>
  );
}

function Sidebar() {
  const [open, setOpen] = useState(false); // TODO: implement this
  const router = useRouter();
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

      <Button
        className="mb-4 w-full"
        size="lg"
        onClick={async () => {
          const chatId = crypto.randomUUID();
          await zero.mutate.chats.init({ id: chatId, timestamp: Date.now() })
            .client;
          router.push(`/chat/${chatId}`);
        }}
      >
        <PlusIcon />
        New Chat
      </Button>

      <div className="relative mb-4 w-full">
        <input
          type="text"
          placeholder="Search your threads..."
          className="w-full border-b border-gray-300 bg-transparent px-8 py-2 text-sm focus:border-blue-600 focus:outline-none"
        />
        <SearchIcon
          size={16}
          className="absolute top-1/2 left-0 -translate-y-1/2 transform text-gray-400"
        />
      </div>

      <ChatTree className="w-full" />

      {/* <div className="flex flex-col gap-2 w-full">
        {chats.map((chat) => (
          <Link
            href={`/chat/${chat.id}`}
            key={chat.id}
            className="text-left p-2 hover:bg-white/20 rounded-xl text-slate-700 hover:text-slate-900 transition-colors text-sm"
          >
            {chat.title ?? "Untitled"}
          </Link>
        ))}
      </div> */}
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
