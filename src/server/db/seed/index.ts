import fs from "node:fs";
import path from "node:path";

import type { ChatTreeNode } from "~/lib/types";
import { db } from "..";
import { chats, chatTrees, messages } from "../schema";

type ChatDefinition = {
  name: string;
  kind: "group" | "chat";
  contentFile?: string;
  items?: ChatDefinition[];
};

export const chatDefinitions: ChatDefinition[] = [
  {
    name: "Code",
    kind: "group",
    items: [
      {
        name: "React",
        kind: "group",
        items: [
          {
            name: "useState vs useEffect",
            kind: "chat",
            contentFile: "use-state-vs-use-effect.md",
          },
          {
            name: "State Management Patterns",
            kind: "chat",
            contentFile: "state-management-patterns.md",
          },
        ],
      },
      {
        name: "TypeScript",
        kind: "group",
        items: [
          {
            name: "TypeScript Generics",
            kind: "chat",
            contentFile: "typescript-generics.md",
          },
          {
            name: "Utility Types",
            kind: "chat",
            contentFile: "utility-types.md",
          },
        ],
      },
      {
        name: "How to center a div",
        kind: "chat",
        contentFile: "how-to-center-a-div.md",
      },
    ],
  },
  {
    name: "Food",
    kind: "group",
    items: [
      {
        name: "Recipes",
        kind: "group",
        items: [
          {
            name: "Pasta Carbonara",
            kind: "chat",
            contentFile: "pasta-carbonara.md",
          },
          {
            name: "Homemade Pizza",
            kind: "chat",
            contentFile: "homemade-pizza.md",
          },
        ],
      },
      {
        name: "Best restaurants in Rome",
        kind: "chat",
        contentFile: "best-restaurants-in-rome.md",
      },
    ],
  },
  {
    name: "Summer travel ideas",
    kind: "chat",
    contentFile: "summer-travel-ideas.md",
  },
  {
    name: "Beginner workout plan",
    kind: "chat",
    contentFile: "beginner-workout-plan.md",
  },
  {
    name: "History of the Internet",
    kind: "chat",
    contentFile: "history-of-the-internet.md",
  },
];

export async function insertDemoChats(userId: string) {
  const { chatTree, chatsToSeed } = buildChatTree(chatDefinitions);

  await db.transaction(async (tx) => {
    const promises: Promise<unknown>[] = [
      tx
        .insert(chatTrees)
        .values({ id: crypto.randomUUID(), userId, data: chatTree }),
    ];
    for (const chat of chatsToSeed) {
      promises.push(seedChat(chat, userId));
    }
    await Promise.all(promises);
  });
}

function buildChatTree(definitions: ChatDefinition[]) {
  const chatTree: ChatTreeNode[] = [];
  const chatsToSeed: { id: string; contentFile: string; title: string }[] = [];

  for (const def of definitions) {
    const id = crypto.randomUUID();

    if (def.kind === "group") {
      const children = buildChatTree(def.items ?? []);
      const node: ChatTreeNode = {
        id,
        name: def.name,
        kind: "group",
        childItems: children.chatTree,
      };
      chatTree.push(node);
      chatsToSeed.push(...children.chatsToSeed);
    } else {
      const chatId = crypto.randomUUID();
      const node: ChatTreeNode = {
        id,
        kind: "chat",
        chatId,
      };

      if (def.contentFile) {
        chatsToSeed.push({
          id: chatId,
          contentFile: def.contentFile,
          title: def.name,
        });
      }

      chatTree.push(node);
    }
  }

  return { chatTree, chatsToSeed };
}

async function seedChat(
  chat: { id: string; contentFile: string; title: string },
  userId: string,
) {
  await db.insert(chats).values({
    id: chat.id,
    title: chat.title,
    public: false,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const filePath = path.join(
    process.cwd(),
    `src/server/db/seed/data/${chat.contentFile}`,
  );
  const content = fs.readFileSync(filePath, "utf-8");
  const messageParts = content
    .split("---")
    .map((part) => part.replace(/### (user|assistant)\s*/, "").trim())
    .filter((part) => part.length > 0);

  let messageDate = new Date();

  for (let i = 0; i < messageParts.length; i++) {
    const isUser = i % 2 === 0;
    const messageContent = messageParts[i]!;

    if (isUser) {
      await db.insert(messages).values({
        id: crypto.randomUUID(),
        chatId: chat.id,
        userId,
        role: "user",
        content: messageContent,
        createdAt: messageDate,
      });
    } else {
      await db.insert(messages).values({
        id: crypto.randomUUID(),
        chatId: chat.id,
        role: "assistant",
        content: messageContent,
        createdAt: messageDate,
      });
    }

    messageDate = new Date(messageDate.getTime() + 1000);
  }
}
