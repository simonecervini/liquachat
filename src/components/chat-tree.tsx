import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@rocicorp/zero/react";
import clsx from "clsx";
import {
  CopyIcon,
  CornerDownRightIcon,
  FolderIcon,
  FolderMinusIcon,
  FolderOpenDotIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  FoldersIcon,
  MenuIcon,
  TextCursorIcon,
  TrashIcon,
} from "lucide-react";
import {
  Button,
  Collection,
  Tree,
  TreeItem,
  TreeItemContent,
  useDragAndDrop,
  type Key,
  type TreeItemProps,
} from "react-aria-components";

import { cn } from "~/lib/cn";
import type { ChatTreeNode } from "~/lib/types";
import { useTreeData as __useTreeData } from "~/lib/use-tree-data";
import { useZero } from "~/zero/react";
import { useAlertDialog } from "./alert";
import styles from "./chat-tree.module.css";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./context-menu";
import { useRename } from "./rename-dialog";

export interface ChatTreeProps {
  chatTreeId: string;
  getChatTitle: (chatId: string) => string;
  className?: string;
  expanded?: Key[];
  onExpandedChange?: (expanded: Key[]) => void;
}

export function ChatTree(props: ChatTreeProps) {
  const { chatTreeId, getChatTitle, className, expanded, onExpandedChange } =
    props;

  const z = useZero();
  const [treeData, isPending] = useTreeData(props);

  React.useEffect(() => {
    if (isPending || treeData.items.length === 0) return;
    void z.mutate.chatTrees.update({
      id: chatTreeId,
      data: toNodeItems(treeData.items),
    });
  }, [chatTreeId, isPending, treeData.items, z.mutate.chatTrees]);

  const getItemText = React.useCallback(
    (item: TreeData["items"][number]) => {
      return item.value.kind === "chat"
        ? getChatTitle(item.value.chatId)
        : item.value.name;
    },
    [getChatTitle],
  );

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => {
      return [...keys].map((key) => {
        const item = treeData.getItem(key)!;
        return {
          "text/plain": getItemText(item),
        };
      });
    },
    getAllowedDropOperations: () => ["move"],
    renderDragPreview(items) {
      return (
        <div className="bg-primary/100 rounded-sm px-2 py-0.5 text-sm text-white">
          {items[0]?.["text/plain"]}
        </div>
      );
    },
    shouldAcceptItemDrop: (target) => {
      const item = treeData.getItem(target.key);
      return item?.value.kind === "group";
    },
    onMove: (e) => {
      try {
        if (e.target.dropPosition === "before") {
          treeData.moveBefore(e.target.key, e.keys);
        } else if (e.target.dropPosition === "after") {
          treeData.moveAfter(e.target.key, e.keys);
        } else if (e.target.dropPosition === "on") {
          const targetNode = treeData.getItem(e.target.key);
          if (targetNode) {
            const targetIndex = targetNode.children
              ? targetNode.children.length
              : 0;
            const keyArray = Array.from(e.keys);
            for (let i = 0; i < keyArray.length; i++) {
              treeData.move(keyArray[i]!, e.target.key, targetIndex + i);
            }
          } else {
            console.error("Target node not found for drop on:", e.target.key);
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
  });

  return (
    <Tree
      dragAndDropHooks={dragAndDropHooks}
      className={clsx(styles.tree, className)}
      aria-label="Chat explorer tree view with folders"
      items={treeData.items}
      expandedKeys={expanded}
      onExpandedChange={(newExpanded) => {
        onExpandedChange?.(Array.from(newExpanded));
      }}
      children={(item) => (
        <DynamicTreeItem
          treeData={treeData}
          id={item.key}
          childItems={item.children ?? []}
          textValue={getItemText(item)}
          getItemText={getItemText}
          supportsDragging
        >
          {getItemText(item)}
        </DynamicTreeItem>
      )}
    />
  );
}

interface DynamicTreeItemProps extends TreeItemProps<object> {
  children: React.ReactNode;
  treeData: TreeData;
  getItemText: (item: TreeData["items"][number]) => string;
  childItems?: Iterable<TreeData["items"][number]>;
  isLoading?: boolean;
  renderLoader?: (id: React.Key | undefined) => boolean;
  supportsDragging?: boolean;
}

function DynamicTreeItem(props: DynamicTreeItemProps) {
  const { childItems, getItemText, renderLoader, supportsDragging, treeData } =
    props;
  const pathname = usePathname();
  const router = useRouter();
  const z = useZero();
  const { openAlert } = useAlertDialog();
  const { rename } = useRename();

  const item = treeData.getItem(props.id ?? "");
  if (!item) return null;

  return (
    <TreeItem
      {...props}
      onAction={() => {
        // TODO: improve accessibility, we can't make everything a Link because we have buttons
        if (item.value.kind === "chat") {
          router.push(`/chat/${item.value.chatId}`);
        }
      }}
      className={({
        isFocused,
        isSelected,
        isHovered,
        isFocusVisible,
        isDropTarget,
      }) =>
        // TODO: handle these styles
        clsx("group", {
          focused: isFocused,
          "focus-visible": isFocusVisible,
          selected: isSelected,
          hovered: isHovered,
          "drop-target": isDropTarget,
        })
      }
    >
      <TreeItemContent>
        {({ isExpanded, hasChildItems, level, id, state }) => {
          const isSelected =
            item.value.kind === "chat" &&
            pathname.startsWith(`/chat/${item.value.chatId}`);
          return (
            <ContextMenu>
              <ContextMenuTrigger
                className={cn(
                  "hover:bg-primary/10 flex items-center gap-2.5 rounded-sm px-2 py-2.5 text-sm",
                  isSelected && "text-primary bg-white hover:bg-white",
                )}
                style={{
                  marginInlineStart: `${(level - 1) * 15}px`,
                }}
              >
                {item.value.kind === "group" && (
                  <Button slot="chevron">
                    {hasChildItems ? (
                      isExpanded ? (
                        <FolderOpenIcon className="text-muted-foreground size-4" />
                      ) : (
                        <FolderIcon className="text-muted-foreground size-4" />
                      )
                    ) : (
                      // Empty folder
                      <FolderOpenDotIcon className="text-muted-foreground size-4" />
                    )}
                  </Button>
                )}
                {supportsDragging && item.value.kind !== "group" && (
                  <Button slot="drag">
                    <MenuIcon
                      className={cn(
                        "text-muted-foreground size-4",
                        isSelected && "text-primary",
                      )}
                    />
                  </Button>
                )}
                {/* TODO: disable "truncate" when hovering to support long titles */}
                <span
                  className="truncate"
                  title={String(props.children as string)}
                >
                  {props.children}
                  {item.value.kind === "group" && !hasChildItems && (
                    <span className="text-muted-foreground pl-0.5 text-[0.6rem]">
                      {" (empty)"}
                    </span>
                  )}
                </span>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  onClick={() => {
                    if (item.value.kind === "chat") {
                      router.push(`/chat/${item.value.chatId}`);
                    } else {
                      state.toggleKey(id);
                    }
                  }}
                >
                  {item.value.kind === "chat" ? (
                    <CornerDownRightIcon />
                  ) : isExpanded ? (
                    <FolderMinusIcon />
                  ) : (
                    <FolderOpenIcon />
                  )}
                  {item.value.kind === "chat"
                    ? "Open"
                    : isExpanded
                      ? "Close folder"
                      : "Open folder"}
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    treeData.update(id, {
                      id: crypto.randomUUID(),
                      name: "New folder",
                      kind: "group",
                      childItems: deepRegenerateIds([item.value]),
                    });
                  }}
                >
                  <FolderPlusIcon />
                  Move to new folder
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={() => {
                    treeData.insertBefore(id, {
                      ...item.value,
                      id: crypto.randomUUID(),
                      childItems: item.value.childItems
                        ? deepRegenerateIds(item.value.childItems)
                        : undefined,
                    });
                  }}
                >
                  {item.value.kind === "group" ? (
                    <>
                      <FoldersIcon />
                      Duplicate folder
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      Duplicate
                    </>
                  )}
                </ContextMenuItem>
                {/* <ContextMenuSeparator />
                <ContextMenuItem>
                  <ShareIcon />
                  Share
                </ContextMenuItem> */}
                <ContextMenuSeparator />
                <ContextMenuItem
                  onClick={() => {
                    rename({
                      initialValue: getItemText(item),
                      title:
                        item.value.kind === "chat"
                          ? "Rename chat"
                          : "Rename folder",
                      description:
                        item.value.kind === "chat"
                          ? "Rename the chat to a new name."
                          : "Rename the folder to a new name.",
                      onSubmit: (value) => {
                        if (item.value.kind === "chat") {
                          void z.mutate.chats.update({
                            id: item.value.chatId,
                            title: value,
                          });
                          treeData.update(id, {
                            ...item.value,
                            // We need to change "something" in the tree data to trigger a re-render
                            // The tree view probably implements a lot of logic with global state and structural sharing to optimize re-renders
                            // The `key` prop on the DynamicTreeItem or Tree component is not enough because we need to sync the change across all clients
                            // Regenerating the id is not very elegant, but it works and have zero impact on the user
                            id: crypto.randomUUID(),
                          });
                        } else {
                          treeData.update(id, {
                            ...item.value,
                            name: value,
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
                        item.value.kind === "chat"
                          ? "This action cannot be undone. This will permanently delete this chat."
                          : "This action cannot be undone. This will permanently delete this folder and all its content.",
                      confirmLabel: "Delete",
                      onConfirm: () => {
                        treeData.remove(id);
                      },
                    });
                  }}
                >
                  <TrashIcon />
                  Delete
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        }}
      </TreeItemContent>
      <Collection
        items={childItems}
        children={(item) => (
          <DynamicTreeItem
            treeData={treeData}
            supportsDragging={supportsDragging}
            renderLoader={renderLoader}
            isLoading={props.isLoading}
            id={item.key}
            childItems={item.children ?? []}
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

function useTreeData(options: { chatTreeId: string }) {
  const z = useZero();
  const [chatTree, { type }] = useQuery(
    z.query.chatTrees.where("id", "=", options.chatTreeId).one(),
  );
  const treeData = __useTreeData({
    initialItems: chatTree?.data ?? [],
    getKey: (item) => item.id,
    getChildren: (item) => item.childItems ?? [],
  });
  return [treeData, type !== "complete"] as const;
}

type TreeData = ReturnType<typeof useTreeData>[0];

function toNodeItems(items: TreeData["items"]): ChatTreeNode[] {
  return items.map((item): ChatTreeNode => {
    const childItems = item.children ? toNodeItems(item.children) : undefined;
    if (item.value.kind === "group") {
      return {
        id: item.value.id,
        name: item.value.name,
        kind: "group",
        childItems,
      };
    } else {
      return {
        id: item.value.id,
        kind: "chat",
        chatId: item.value.chatId,
        childItems,
      };
    }
  });
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
