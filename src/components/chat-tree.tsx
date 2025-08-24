import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tooltip } from "@base-ui-components/react/tooltip";
import { useQuery } from "@rocicorp/zero/react";
import clsx from "clsx";
import {
  ArrowRightIcon,
  CornerDownRightIcon,
  FolderIcon,
  FolderMinusIcon,
  FolderOpenDotIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  MenuIcon,
  MessageSquareIcon,
  Settings2Icon,
  TextCursorIcon,
  TrashIcon,
} from "lucide-react";
import {
  Tree as AriaTree,
  Button,
  Collection,
  TreeItem,
  TreeItemContent,
  useDragAndDrop,
  type Key,
  type TreeItemProps,
} from "react-aria-components";

import { cn } from "~/lib/cn";
import { Tree } from "~/lib/tree";
import type { ChatTreeNode } from "~/lib/types";
import { useZero } from "~/zero/react";
import type { ZeroRow } from "~/zero/schema";
import { useAlertDialog } from "./alert";
import styles from "./chat-tree.module.css";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./context-menu";
import { openCustomizePromptDialog } from "./customize-prompt-dialog";
import { useRename } from "./rename-dialog";

export interface ChatTreeProps {
  mode?: "tree" | "list";
  chatTreeId: string;
  sortedChats: ZeroRow<"chats">[];
  getChatTitle: (chatId: string) => string;
  disableDragAndDrop?: boolean;
  className?: string;
  expanded?: Key[];
  onExpandedChange?: (expanded: Key[]) => void;
}

export function ChatTree(props: ChatTreeProps) {
  const {
    mode = "tree",
    sortedChats,
    chatTreeId,
    getChatTitle,
    className,
    expanded,
    onExpandedChange,
  } = props;

  const z = useZero();

  const [chatTree] = useQuery(
    z.query.chatTrees.where("id", "=", chatTreeId).one(),
  );

  const { tree: treeDataV2, items } = React.useMemo(() => {
    const tree =
      mode === "tree"
        ? new Tree(chatTree?.data ?? [])
        : // The list is just a special case of the tree
          new Tree(
            sortedChats.map(
              (chat) =>
                ({
                  id: chat.id,
                  kind: "chat",
                  chatId: chat.id,
                }) satisfies ChatTreeNode,
            ),
          );
    const items = tree.getNodes();
    return { tree, items };
  }, [chatTree?.data, mode, sortedChats]);

  const getItemText = React.useCallback(
    (node: ChatTreeNode) => {
      return node.kind === "chat" ? getChatTitle(node.chatId) : node.name;
    },
    [getChatTitle],
  );

  const { dragAndDropHooks } = useDragAndDrop({
    isDisabled: mode === "list",
    getItems: (keys) => {
      return [...keys].flatMap((key) => {
        const item = treeDataV2.findNodeById(String(key));
        if (!item) return [];
        return {
          "text/plain": getItemText(item),
        };
      });
    },
    getAllowedDropOperations: () => ["move"],
    renderDragPreview(items) {
      return (
        <div className="bg-primary/100 rounded-sm px-2 py-0.5 text-[0.8125rem] text-white">
          {items[0]?.["text/plain"]}
        </div>
      );
    },
    shouldAcceptItemDrop: (target) => {
      const item = treeDataV2.findNodeById(String(target.key));
      return item?.kind === "group";
    },
    onMove: (e) => {
      try {
        if (e.target.dropPosition === "before") {
          const nodeId = String(e.target.key);
          const newTree = treeDataV2.moveBefore(
            nodeId,
            [...e.keys].map(String),
          );
          void z.mutate.chatTrees.update({
            id: chatTreeId,
            data: newTree.getNodes(),
          });
        } else if (e.target.dropPosition === "after") {
          const nodeId = String(e.target.key);
          const newTree = treeDataV2.moveAfter(nodeId, [...e.keys].map(String));
          void z.mutate.chatTrees.update({
            id: chatTreeId,
            data: newTree.getNodes(),
          });
        } else if (e.target.dropPosition === "on") {
          const targetNodeId = String(e.target.key);
          let newTree = treeDataV2.clone();
          for (const key of e.keys) {
            const node = newTree.findNodeById(String(key));
            if (!node) continue;
            newTree = newTree.moveOn(node.id, targetNodeId);
          }
          void z.mutate.chatTrees.update({
            id: chatTreeId,
            data: newTree.getNodes(),
          });
        }
      } catch (error) {
        console.error(error);
      }
    },
  });

  return (
    <Tooltip.Provider>
      <AriaTree
        dragAndDropHooks={dragAndDropHooks}
        className={clsx(styles.tree, className)}
        aria-label="Chat explorer tree view with folders"
        items={items}
        expandedKeys={expanded}
        onExpandedChange={(newExpanded) => {
          onExpandedChange?.(Array.from(newExpanded));
        }}
        children={(item) => (
          <DynamicTreeItem
            mode={mode}
            treeDataV2={treeDataV2}
            chatTreeId={chatTreeId}
            id={item.id}
            childItems={item.childItems ?? []}
            textValue={getItemText(item)}
            getItemText={getItemText}
          >
            {getItemText(item)}
          </DynamicTreeItem>
        )}
      />
    </Tooltip.Provider>
  );
}

interface DynamicTreeItemProps extends TreeItemProps<object> {
  children: React.ReactNode;
  mode: "tree" | "list";
  treeDataV2: Tree<ChatTreeNode>;
  chatTreeId: string;
  getItemText: (item: ChatTreeNode) => string;
  childItems?: Iterable<ChatTreeNode>;
  isLoading?: boolean;
  renderLoader?: (id: React.Key | undefined) => boolean;
}

function DynamicTreeItem(props: DynamicTreeItemProps) {
  const {
    mode,
    childItems,
    getItemText,
    renderLoader,
    treeDataV2,
    chatTreeId,
  } = props;
  const pathname = usePathname();
  const router = useRouter();
  const z = useZero();
  const { openAlert } = useAlertDialog();
  const { rename } = useRename();

  const item = treeDataV2.findNodeById(String(props.id));
  if (!item) return null;

  return (
    <TreeItem
      {...props}
      href={item.kind === "chat" ? `/chat/${item.chatId}` : undefined}
      className={({ isPressed }) =>
        clsx(
          "group rounded-sm transition-transform duration-100 outline-none",
          isPressed && "scale-98",
        )
      }
    >
      <TreeItemContent>
        {({
          isExpanded,
          hasChildItems,
          level,
          id,
          state,
          isFocusVisible,
          isHovered,
        }) => {
          const isSelected =
            item.kind === "chat" && pathname.startsWith(`/chat/${item.chatId}`);
          return (
            <Tooltip.Root delay={150}>
              <ContextMenu>
                <Tooltip.Trigger className="w-full">
                  <ContextMenuTrigger
                    className={cn(
                      "hover:bg-primary/10 flex cursor-default items-center gap-2.5 rounded-sm border-2 border-transparent px-2 py-2 text-[0.8125rem]",
                      isSelected && "text-primary bg-white hover:bg-white",
                      isFocusVisible && "border-primary",
                      isFocusVisible && !isSelected && "bg-primary/10",
                    )}
                    style={{
                      marginInlineStart: `${(level - 1) * 10}px`,
                    }}
                  >
                    {item.kind === "group" && (
                      <Button slot="chevron" className="text-muted-foreground">
                        {hasChildItems ? (
                          isExpanded ? (
                            <FolderOpenIcon className="size-4" />
                          ) : (
                            <FolderIcon className="size-4" />
                          )
                        ) : (
                          // Empty folder
                          <FolderOpenDotIcon className="size-4" />
                        )}
                      </Button>
                    )}
                    {mode === "tree" && item.kind !== "group" && (
                      <Button slot="drag">
                        <MenuIcon
                          className={cn(
                            "text-muted-foreground size-4",
                            isHovered && "text-black",
                            isSelected && "text-primary",
                          )}
                        />
                      </Button>
                    )}
                    <span className="truncate">
                      {props.children}
                      {item.kind === "group" && !hasChildItems && (
                        <span className="text-muted-foreground pl-0.5 text-[0.6rem]">
                          {" (empty)"}
                        </span>
                      )}
                    </span>
                  </ContextMenuTrigger>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner
                    sideOffset={8}
                    align="center"
                    side="right"
                  >
                    <Tooltip.Popup className="border-primary/5 rounded-md border-2 bg-white p-3 text-xs shadow-xl shadow-black/5">
                      <p className="mb-2 flex items-center gap-1.5 text-[0.8125rem] font-medium">
                        {item.kind === "chat" ? (
                          <MessageSquareIcon className="text-muted-foreground inline-block size-4" />
                        ) : (
                          <FolderIcon className="text-muted-foreground inline-block size-4" />
                        )}
                        {props.children}
                      </p>
                      <p className="text-muted-foreground border-muted-foreground/10 pt-0.5 text-xs">
                        {item.kind === "chat"
                          ? "Open chat"
                          : `Open folder (${item.childItems?.length ?? 0} items)`}
                        <ArrowRightIcon className="ml-1 inline-block size-[1em]" />
                      </p>
                    </Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => {
                      if (item.kind === "chat") {
                        router.push(`/chat/${item.chatId}`);
                      } else {
                        state.toggleKey(id);
                      }
                    }}
                  >
                    {item.kind === "chat" ? (
                      <CornerDownRightIcon />
                    ) : isExpanded ? (
                      <FolderMinusIcon />
                    ) : (
                      <FolderOpenIcon />
                    )}
                    {item.kind === "chat"
                      ? "Open"
                      : isExpanded
                        ? "Close folder"
                        : "Open folder"}
                  </ContextMenuItem>
                  {mode === "tree" && (
                    <ContextMenuItem
                      onClick={() => {
                        const newTree = treeDataV2.updateNode(
                          String(id),
                          (node) => {
                            Object.assign(node, {
                              id: crypto.randomUUID(),
                              name: "New folder",
                              kind: "group",
                              childItems: deepRegenerateIds([node]),
                            });
                          },
                        );
                        void z.mutate.chatTrees.update({
                          id: chatTreeId,
                          data: newTree.getNodes(),
                        });
                      }}
                    >
                      <FolderPlusIcon />
                      Move to new folder
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  {item.kind === "chat" && (
                    <>
                      <ContextMenuItem
                        onClick={async () => {
                          const chat = await z.query.chats
                            .where("id", "=", item.chatId)
                            .one();
                          if (!chat) return;
                          openCustomizePromptDialog(
                            item.chatId,
                            chat.customInstructions ?? "",
                          );
                        }}
                      >
                        <Settings2Icon />
                        Customize prompt
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                    </>
                  )}
                  <ContextMenuItem
                    onClick={() => {
                      rename({
                        initialValue: getItemText(item),
                        title:
                          item.kind === "chat"
                            ? "Rename chat"
                            : "Rename folder",
                        description:
                          item.kind === "chat"
                            ? "Rename the chat to a new name."
                            : "Rename the folder to a new name.",
                        onSubmit: (value) => {
                          if (item.kind === "chat") {
                            z.mutate.chats.rename({
                              id: item.chatId,
                              title: value,
                              // We need to change "something" in the tree data to trigger a re-render
                              // The tree view probably implements a lot of logic with global state and structural sharing to optimize re-renders
                              // The `key` prop on the DynamicTreeItem or Tree component is not enough because we need to sync the change across all clients
                              // Regenerating the id is not very elegant, but it works and have zero impact on the user
                              // TODO: remove this when treeDataV2 is used everywhere
                              newNodeId: crypto.randomUUID(),
                            });
                          } else {
                            const newTree = treeDataV2.updateNode(
                              String(id),
                              (node) => {
                                if (node.kind !== "group") {
                                  throw new Error("Node is not a group");
                                }
                                node.name = value;
                              },
                            );
                            void z.mutate.chatTrees.update({
                              id: chatTreeId,
                              data: newTree.getNodes(),
                            });
                          }
                        },
                      });
                    }}
                  >
                    <TextCursorIcon />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      openAlert({
                        title: "Are you sure?",
                        message:
                          item.kind === "chat"
                            ? "This action cannot be undone. This will permanently delete this chat."
                            : "This action cannot be undone. This will permanently delete this folder and all its content.",
                        confirmLabel: "Delete",
                        onConfirm: async () => {
                          let shouldRedirect = false;
                          if (item.kind === "chat") {
                            z.mutate.chats.delete({
                              chatId: item.chatId,
                            });
                            shouldRedirect = pathname.startsWith(
                              `/chat/${item.chatId}`,
                            );
                          } else {
                            z.mutate.chatTrees.deleteGroup({
                              chatTreeId,
                              groupId: id.toString(),
                            });
                            // TODO: maybe add `tree.slice(start)` to the Tree class?
                            const subTreeRootNode = treeDataV2.findNodeById(
                              id.toString(),
                            );
                            if (subTreeRootNode) {
                              const subTree = new Tree([subTreeRootNode]);
                              shouldRedirect = !!subTree.findNode(
                                (node) =>
                                  node.kind === "chat" &&
                                  pathname.startsWith(`/chat/${node.chatId}`),
                              );
                            }
                          }
                          if (shouldRedirect) {
                            router.replace("/");
                          }
                        },
                      });
                    }}
                  >
                    <TrashIcon />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </Tooltip.Root>
          );
        }}
      </TreeItemContent>
      <Collection
        items={childItems}
        children={(item) => (
          <DynamicTreeItem
            mode={mode}
            treeDataV2={treeDataV2}
            chatTreeId={chatTreeId}
            renderLoader={renderLoader}
            isLoading={props.isLoading}
            id={item.id}
            childItems={item.childItems ?? []}
            textValue={getItemText(item)}
            href={props.href}
            getItemText={getItemText}
          >
            {getItemText(item)}
          </DynamicTreeItem>
        )}
      />
    </TreeItem>
  );
}

// Required to avoid freezing the whole page
function deepRegenerateIds(items: ChatTreeNode[]): ChatTreeNode[] {
  return items.map((item) => {
    return {
      ...item,
      id: crypto.randomUUID(),
      childItems: item.childItems
        ? deepRegenerateIds(item.childItems)
        : undefined,
    };
  });
}
