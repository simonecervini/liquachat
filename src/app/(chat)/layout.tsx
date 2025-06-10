"use client";

import * as React from "react";
import { PanelLeftIcon, SearchIcon, PlusIcon, DropletIcon } from "lucide-react";
import { useState } from "react";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema, type AuthData } from "~/zero/schema";
import { Zero } from "@rocicorp/zero";
import { createMutators } from "~/zero";
import { env } from "~/env";
import { useRouter } from "next/navigation";
import { ChatTree } from "~/components/chat-tree";
import { ContainedButton } from "~/components/button";

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
      <div className="flex pr-4 h-screen gap-3">
        <Sidebar />
        <div className="mt-3 bg-gradient-to-tl grow from-white/70 to-white/80 w-60 rounded-t-3xl border-[3px] border-white shadow-2xl shadow-black/5 relative">
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
    <div className="flex flex-col w-60 border-r-2 border-white/50 bg-linear-to-r from-transparent to-white/20 px-4 py-4 items-center">
      <div className="flex items-center justify-between w-full mb-3">
        <button
          className="text-slate-900 hover:text-blue-500 transition-colors"
          onClick={() => setOpen((prev) => !prev)}
        >
          <PanelLeftIcon className="size-5" />
        </button>
        <Logo />
        <PanelLeftIcon className="text-blue-500 size-5 invisible" />
      </div>

      <ContainedButton
        className="mb-4 w-full"
        onClick={async () => {
          const chatId = crypto.randomUUID();
          await zero.mutate.chats.init({ id: chatId, timestamp: Date.now() })
            .client;
          router.push(`/chat/${chatId}`);
        }}
      >
        <PlusIcon />
        New Chat
      </ContainedButton>

      <div className="relative w-full mb-4">
        <input
          type="text"
          placeholder="Search your threads..."
          className="w-full px-8 py-2 text-sm border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-600"
        />
        <SearchIcon
          size={16}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400"
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
    <div className="flex items-center justify-center w-full h-10 font-extrabold gap-1 text-slate-900">
      <DropletIcon className="text-blue-500 size-4" strokeWidth={3} />
      Azura
    </div>
  );
}
