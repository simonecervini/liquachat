export type ChatTreeNode = {
  id: string;
  childItems?: ChatTreeNode[];
} & ({ kind: "group"; name: string } | { kind: "chat"; chatId: string });
