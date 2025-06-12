"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@rocicorp/zero/react";

import { useZero } from "~/zero/react";

export default function Page() {
  const z = useZero();
  const router = useRouter();
  const [lastChat, result] = useQuery(
    z.query.chats.orderBy("createdAt", "desc").one(),
  );

  React.useEffect(() => {
    if (result.type === "complete") {
      if (!lastChat) {
        const id = crypto.randomUUID();
        const timestamp = Date.now();
        void z.mutate.chats.init({ id, timestamp }).client.then(() => {
          router.replace(`/chat/${id}`);
        });
      } else {
        router.replace(`/chat/${lastChat.id}`);
      }
    }
  }, [lastChat, result.type, router, z.mutate.chats, z.userID]);

  return null;
}
