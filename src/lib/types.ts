export type ChatTreeNode = {
  id: string;
  name: string;
  childItems?: ChatTreeNode[];
} & ({ kind: "group" } | { kind: "chat"; chatId: string });
