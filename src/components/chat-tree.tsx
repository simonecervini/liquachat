import * as React from "react";

import {
  Button,
  Collection,
  useDragAndDrop,
  type TreeItemProps,
  TreeItemContent,
  Tree,
  TreeItem,
} from "react-aria-components";
import { useTreeData as __useTreeData } from "~/lib/use-tree-data";

import clsx from "clsx";
import {
  ChevronDownIcon,
  CopyIcon,
  CornerDownRightIcon,
  FolderIcon,
  FolderPlusIcon,
  MenuIcon,
  ShareIcon,
  TextCursorIcon,
  TrashIcon,
} from "lucide-react";
import styles from "./chat-tree.module.css";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./context-menu";
import { useZero } from "~/zero/react";
import { useQuery } from "@rocicorp/zero/react";
import { cn } from "~/lib/cn";
import type { ChatTreeNode } from "~/lib/types";

export const ChatTree = () => {
  const z = useZero();
  const [treeData, isPending] = useTreeData();

  React.useEffect(() => {
    if (isPending) return;
    const toNodeItems = (items: TreeData["items"]): ChatTreeNode[] => {
      return items.map((item) => {
        return {
          id: item.value.id,
          name: item.value.name,
          kind: item.value.kind,
          childItems: item.children ? toNodeItems(item.children) : undefined,
        };
      });
    };
    void z.mutate.users.update({
      id: z.userID,
      chatTree: toNodeItems(treeData.items),
    });
  }, [isPending, treeData.items, z.mutate.users, z.userID]);

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => {
      return [...keys].map((key) => {
        const item = treeData.getItem(key)!;
        return {
          "text/plain": item.value.name,
        };
      });
    },
    getAllowedDropOperations: () => ["move"],
    renderDragPreview(items) {
      return (
        <div className="bg-primary/100 rounded-sm text-sm text-white px-2 py-0.5">
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
      className={styles.tree}
      aria-label="Tree with drag and drop"
      items={treeData.items}
      children={(item) => (
        <DynamicTreeItem
          id={item.key}
          childItems={item.children ?? []}
          textValue={item.value.name}
          supportsDragging
        >
          {item.value.name}
        </DynamicTreeItem>
      )}
    />
  );
};

interface DynamicTreeItemProps extends TreeItemProps<object> {
  children: React.ReactNode;
  childItems?: Iterable<TreeData["items"][number]>;
  isLoading?: boolean;
  renderLoader?: (id: React.Key | undefined) => boolean;
  supportsDragging?: boolean;
}

function DynamicTreeItem(props: DynamicTreeItemProps) {
  const { childItems, renderLoader, supportsDragging } = props;

  return (
    <TreeItem
      {...props}
      className={({
        isFocused,
        isSelected,
        isHovered,
        isFocusVisible,
        isDropTarget,
      }) =>
        // TODO: handle this styles
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
        {({ isExpanded, hasChildItems, level }) => (
          <ContextMenu>
            <ContextMenuTrigger
              className={cn(
                "flex items-center gap-2 text-sm py-2.5 px-2 hover:bg-primary/10 rounded-sm",
              )}
              style={{
                marginInlineStart: `${(!hasChildItems ? 20 : 0) + (level - 1) * 15}px`,
              }}
            >
              {hasChildItems && (
                <Button slot="chevron">
                  <ChevronDownIcon
                    className="size-4 text-slate-500"
                    style={{
                      transform: `rotate(${isExpanded ? 0 : -90}deg)`,
                    }}
                  />
                </Button>
              )}
              {supportsDragging && (
                <Button slot="drag">
                  {hasChildItems ? (
                    <FolderIcon className="size-4 text-slate-500" />
                  ) : (
                    <MenuIcon className="size-4 text-slate-500" />
                  )}
                </Button>
              )}
              {props.children}
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>
                <CornerDownRightIcon />
                Open
              </ContextMenuItem>
              <ContextMenuItem>
                <FolderPlusIcon />
                Move to new folder
              </ContextMenuItem>
              <ContextMenuItem>
                <CopyIcon />
                Duplicate
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>
                <ShareIcon />
                Share
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>
                <TextCursorIcon />
                Rename
              </ContextMenuItem>
              <ContextMenuItem>
                <TrashIcon />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}
      </TreeItemContent>
      <Collection
        items={childItems}
        children={(item) => (
          <DynamicTreeItem
            supportsDragging={supportsDragging}
            renderLoader={renderLoader}
            isLoading={props.isLoading}
            id={item.key}
            childItems={item.children ?? []}
            textValue={item.value.name}
            href={props.href}
          >
            {item.value.name}
          </DynamicTreeItem>
        )}
      />
    </TreeItem>
  );
}

function useTreeData() {
  const z = useZero();
  const [user, { type }] = useQuery(
    z.query.users.where("id", "=", z.userID).one(),
  );
  const treeData = __useTreeData({
    initialItems: user?.chatTree ?? [],
    getKey: (item) => item.id,
    getChildren: (item) => item.childItems ?? [],
  });
  return [treeData, type !== "complete"] as const;
}

type TreeData = ReturnType<typeof useTreeData>[0];
