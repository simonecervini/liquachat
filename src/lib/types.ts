export type ChatTreeNode = {
  id: string;
  name: string;
  kind: "group" | "chat";
  childItems?: ChatTreeNode[];
};
