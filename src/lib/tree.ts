export type NodeData = { id: string } & Record<string, unknown>;

export type TreeNode<TData extends NodeData> = TData & {
  childItems?: TreeNode<TData>[];
};

export class Tree<TData extends NodeData> {
  private _tree: TreeNode<TData>[];

  constructor(nodes: TreeNode<TData>[]) {
    this._tree = nodes;
  }

  clone(): Tree<TData> {
    return new Tree(structuredClone(this.getNodes()));
  }

  updateNode(
    nodeId: string,
    update: (node: TreeNode<TData>) => void,
  ): Tree<TData> {
    const newTree = this.clone().getNodes();

    const updateNodeRecursive = (nodes: TreeNode<TData>[]): boolean => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          update(node);
          return true;
        }
        if (node.childItems && updateNodeRecursive(node.childItems)) {
          return true;
        }
      }
      return false;
    };

    updateNodeRecursive(newTree);
    return new Tree(newTree);
  }

  removeNode(nodeId: string): Tree<TData> {
    const newTree = this.clone().getNodes();

    const removeNodeRecursive = (nodes: TreeNode<TData>[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        const currentNode = nodes[i];
        if (!currentNode) continue;

        if (currentNode.id === nodeId) {
          nodes.splice(i, 1);
          return true;
        }
        if (
          currentNode.childItems &&
          removeNodeRecursive(currentNode.childItems)
        ) {
          return true;
        }
      }
      return false;
    };

    removeNodeRecursive(newTree);
    return new Tree(newTree);
  }

  insertBefore(nodeId: string, node: TreeNode<TData>): Tree<TData> {
    const newTree = this.clone().getNodes();

    const insertBeforeRecursive = (nodes: TreeNode<TData>[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        const currentNode = nodes[i];
        if (!currentNode) continue;

        if (currentNode.id === nodeId) {
          nodes.splice(i, 0, this.deepCloneNode(node));
          return true;
        }
        if (
          currentNode.childItems &&
          insertBeforeRecursive(currentNode.childItems)
        ) {
          return true;
        }
      }
      return false;
    };

    insertBeforeRecursive(newTree);
    return new Tree(newTree);
  }

  insertAfter(nodeId: string, node: TreeNode<TData>): Tree<TData> {
    const newTree = this.clone().getNodes();

    const insertAfterRecursive = (nodes: TreeNode<TData>[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        const currentNode = nodes[i];
        if (!currentNode) continue;

        if (currentNode.id === nodeId) {
          nodes.splice(i + 1, 0, this.deepCloneNode(node));
          return true;
        }
        if (
          currentNode.childItems &&
          insertAfterRecursive(currentNode.childItems)
        ) {
          return true;
        }
      }
      return false;
    };

    insertAfterRecursive(newTree);
    return new Tree(newTree);
  }

  moveBefore(
    anchorNodeId: string,
    nodesToMove: Iterable<TreeNode<TData> | string>,
  ): Tree<TData> {
    let draftTree = this.clone();
    for (const nodeOrNodeId of nodesToMove) {
      const node = this.resolveNode(nodeOrNodeId);
      draftTree = draftTree.removeNode(node.id);
      draftTree = draftTree.insertBefore(anchorNodeId, node);
    }
    return draftTree;
  }

  moveAfter(
    anchorNodeId: string,
    nodesToMove: Iterable<TreeNode<TData> | string>,
  ): Tree<TData> {
    let draftTree = this.clone();
    for (const nodeOrNodeId of nodesToMove) {
      const node = this.resolveNode(nodeOrNodeId);
      draftTree = draftTree.removeNode(node.id);
      draftTree = draftTree.insertAfter(anchorNodeId, node);
    }
    return draftTree;
  }

  moveOn(nodeId: string, targetId: string): Tree<TData> {
    const nodeToMove = this.findNodeById(nodeId);
    const targetNode = this.findNodeById(targetId);

    if (!nodeToMove || !targetNode) {
      return this.clone();
    }

    const newTree = this.clone().getNodes();

    const removeNodeRecursive = (nodes: TreeNode<TData>[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        const currentNode = nodes[i];
        if (!currentNode) continue;

        if (currentNode.id === nodeId) {
          nodes.splice(i, 1);
          return true;
        }
        if (
          currentNode.childItems &&
          removeNodeRecursive(currentNode.childItems)
        ) {
          return true;
        }
      }
      return false;
    };

    const addToTargetRecursive = (nodes: TreeNode<TData>[]): boolean => {
      for (const node of nodes) {
        if (node.id === targetId) {
          node.childItems ??= [];
          node.childItems.push(this.deepCloneNode(nodeToMove));
          return true;
        }
        if (node.childItems && addToTargetRecursive(node.childItems)) {
          return true;
        }
      }
      return false;
    };

    removeNodeRecursive(newTree);
    addToTargetRecursive(newTree);

    return new Tree(newTree);
  }

  findNode(
    predicate: (node: TreeNode<TData>) => boolean,
  ): TreeNode<TData> | null {
    const findNodeImpl = (nodes: TreeNode<TData>[]): TreeNode<TData> | null => {
      for (const node of nodes) {
        if (predicate(node)) {
          return node;
        }
        if (node.childItems) {
          const match = findNodeImpl(node.childItems);
          if (match) {
            return match;
          }
        }
      }
      return null;
    };
    return findNodeImpl(this._tree);
  }

  filterNodes(
    predicate: (node: TreeNode<TData>) => boolean,
  ): TreeNode<TData>[] {
    const filterNodesImpl = (nodes: TreeNode<TData>[]): TreeNode<TData>[] => {
      const result: TreeNode<TData>[] = [];
      for (const node of nodes) {
        if (predicate(node)) {
          result.push(node);
        }
        if (node.childItems) {
          result.push(...filterNodesImpl(node.childItems));
        }
      }
      return result;
    };
    return filterNodesImpl(this._tree);
  }

  findNodeById(id: string): TreeNode<TData> | null {
    return this.findNode((n) => n.id === id);
  }

  resolveNode(nodeOrNodeId: string | TreeNode<TData>) {
    if (typeof nodeOrNodeId === "string") {
      const node = this.findNodeById(nodeOrNodeId);
      if (!node) {
        throw new Error(`Node with id ${nodeOrNodeId} not found`);
      }
      return node;
    }
    return nodeOrNodeId;
  }

  isLeafNode(node: string | TreeNode<TData>): boolean {
    const _node = typeof node === "string" ? this.findNodeById(node) : node;
    return _node ? !_node.childItems || _node.childItems.length === 0 : false;
  }

  flatten(): Omit<TData, "childItems">[] {
    const flattenImpl = (
      nodes: TreeNode<TData>[],
    ): Omit<TData, "childItems">[] => {
      return nodes.flatMap((node) => {
        const { childItems, ...nodeWithoutChildren } = node;
        return [
          nodeWithoutChildren,
          ...(childItems ? flattenImpl(childItems) : []),
        ];
      });
    };
    return flattenImpl(this._tree);
  }

  getNodes(): TreeNode<TData>[] {
    return structuredClone(this._tree);
  }

  private deepCloneNode(node: TreeNode<TData>): TreeNode<TData> {
    return structuredClone(node);
  }
}
