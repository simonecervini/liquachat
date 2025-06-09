"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useZero } from "~/zero/react";
import { useQuery } from "@rocicorp/zero/react";
import { type ZeroRow } from "~/zero/schema";

export default function Page() {
  const z = useZero();
  const router = useRouter();
  const [lastChat, result] = useQuery(
    z.query.chats.orderBy("createdAt", "desc").one(),
  );

  React.useEffect(() => {
    if (result.type === "complete") {
      if (!lastChat) {
        const newChat: ZeroRow<"chats"> = {
          id: crypto.randomUUID(),
          title: null,
          public: false,
          userId: z.userID,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        // TODO: use custom mutators
        void z.mutate.chats.insert(newChat).then(() => {
          router.replace(`/chat/${newChat.id}`);
        });
      } else {
        router.replace(`/chat/${lastChat.id}`);
      }
    }
  }, [lastChat, result.type, router, z.mutate.chats, z.userID]);

  return null;
}
