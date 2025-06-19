import { expect, test } from "vitest";

import { Tree, type TreeNode } from "~/lib/tree";

type TestNode = { id: string; name: string };

function createSampleTree(): Tree<TestNode> {
  return new Tree<TestNode>([
    {
      id: "1",
      name: "Node 1",
      childItems: [
        { id: "1.1", name: "Node 1.1" },
        { id: "1.2", name: "Node 1.2" },
      ],
    },
    { id: "2", name: "Node 2" },
    {
      id: "3",
      name: "Node 3",
      childItems: [
        {
          id: "3.1",
          name: "Node 3.1",
          childItems: [{ id: "3.1.1", name: "Node 3.1.1" }],
        },
      ],
    },
  ]);
}

test("findNode() should find nodes at any level", () => {
  const tree = createSampleTree();

  expect(tree.findNodeById("1")).toEqual({
    id: "1",
    name: "Node 1",
    childItems: [
      { id: "1.1", name: "Node 1.1" },
      { id: "1.2", name: "Node 1.2" },
    ],
  });
  expect(tree.findNodeById("1.2")).toEqual({ id: "1.2", name: "Node 1.2" });
  expect(tree.findNodeById("3.1.1")).toEqual({
    id: "3.1.1",
    name: "Node 3.1.1",
  });
  expect(tree.findNodeById("nonexistent")).toBeNull();
});

test("filterNodes() should return all nodes matching the predicate", () => {
  const tree = createSampleTree();

  // Filter nodes that contain "Node 1" in their name
  const nodesWithNode1 = tree.filterNodes((node) =>
    node.name.includes("Node 1"),
  );
  expect(nodesWithNode1).toHaveLength(3);
  expect(nodesWithNode1.map((node) => node.id)).toEqual(["1", "1.1", "1.2"]);
});

test("filterNodes() should return all leaf nodes", () => {
  const tree = createSampleTree();

  // Filter all leaf nodes (nodes without children)
  const leafNodes = tree.filterNodes(
    (node) => !node.childItems || node.childItems.length === 0,
  );
  expect(leafNodes).toHaveLength(4);
  expect(leafNodes.map((node) => node.id).sort()).toEqual([
    "1.1",
    "1.2",
    "2",
    "3.1.1",
  ]);
});

test("filterNodes() should return all nodes with children", () => {
  const tree = createSampleTree();

  // Filter all nodes that have children
  const parentNodes = tree.filterNodes((node) =>
    Boolean(node.childItems && node.childItems.length > 0),
  );
  expect(parentNodes).toHaveLength(3);
  expect(parentNodes.map((node) => node.id).sort()).toEqual(["1", "3", "3.1"]);
});

test("filterNodes() should return empty array when no nodes match", () => {
  const tree = createSampleTree();

  // Filter nodes with a name that doesn't exist
  const nonExistentNodes = tree.filterNodes((node) =>
    node.name.includes("Nonexistent"),
  );
  expect(nonExistentNodes).toEqual([]);
});

test("filterNodes() should return all nodes when predicate always returns true", () => {
  const tree = createSampleTree();

  // Filter all nodes
  const allNodes = tree.filterNodes(() => true);
  expect(allNodes).toHaveLength(7);
  expect(allNodes.map((node) => node.id)).toEqual([
    "1",
    "1.1",
    "1.2",
    "2",
    "3",
    "3.1",
    "3.1.1",
  ]);
});

test("filterNodes() should find nodes at different levels", () => {
  const tree = createSampleTree();

  // Filter nodes that have "3" in their id
  const nodesWithThree = tree.filterNodes((node) => node.id.includes("3"));
  expect(nodesWithThree).toHaveLength(3);
  expect(nodesWithThree.map((node) => node.id)).toEqual(["3", "3.1", "3.1.1"]);
});

test("updateNode() should update node and return new tree", () => {
  const tree = createSampleTree();
  const originalTree = tree.toArray();

  const updatedTree = tree.updateNode("2", (node) => {
    node.name = "Updated Node 2";
  });

  // Original tree should be unchanged (immutability)
  expect(tree.findNodeById("2")?.name).toBe("Node 2");

  // New tree should have the update
  expect(updatedTree.findNodeById("2")?.name).toBe("Updated Node 2");

  // Trees should be different instances
  expect(updatedTree.toArray()).not.toBe(originalTree);
});

test("removeNode() should remove node and return new tree", () => {
  const tree = createSampleTree();
  const originalTreeLength = tree.toArray().length;

  const newTree = tree.removeNode("2");

  // Original tree should be unchanged
  expect(tree.toArray().length).toBe(originalTreeLength);
  expect(tree.findNodeById("2")).toBeTruthy();

  // New tree should not have the removed node
  expect(newTree.toArray().length).toBe(originalTreeLength - 1);
  expect(newTree.findNodeById("2")).toBeNull();
});

test("removeNode() should remove nested node", () => {
  const tree = createSampleTree();

  const newTree = tree.removeNode("1.2");

  // Original tree should still have the node
  expect(tree.findNodeById("1.2")).toBeTruthy();

  // New tree should not have the nested node
  expect(newTree.findNodeById("1.2")).toBeNull();
  expect(newTree.findNodeById("1.1")).toBeTruthy(); // Other children should remain
});

test("removeNode() should remove nested node with children", () => {
  const tree = createSampleTree();
  const newTree = tree.removeNode("1");

  // Original tree should still have the node and its children
  expect(tree.findNodeById("1")).toBeTruthy();
  expect(tree.findNodeById("1.1")).toBeTruthy();
  expect(tree.findNodeById("1.2")).toBeTruthy();

  // New tree should not have the nested node and its children
  expect(newTree.findNodeById("1")).toBeNull();
  expect(newTree.findNodeById("1.1")).toBeNull();
  expect(newTree.findNodeById("1.2")).toBeNull();
});

test("insertBefore() should insert node before target with no children", () => {
  const tree = createSampleTree();

  const newNode: TreeNode<TestNode> = { id: "new", name: "New Node" };
  const newTree = tree.insertBefore("2", newNode);
  const newTreeNodes = newTree.getNodes();

  expect(newTreeNodes).toEqual([
    newTreeNodes[0],
    { id: "new", name: "New Node" },
    { id: "2", name: "Node 2" },
    ...newTreeNodes.slice(3),
  ]);
});

test("insertBefore() should insert node before target with children (before last)", () => {
  const tree = createSampleTree();
  const newNode: TreeNode<TestNode> = { id: "new", name: "New Node" };
  const newTree = tree.insertBefore("1.2", newNode);
  const newTreeNodes = newTree.getNodes();
  expect(newTreeNodes).toEqual([
    {
      ...newTreeNodes[0],
      childItems: [
        { id: "1.1", name: "Node 1.1" },
        { id: "new", name: "New Node" },
        { id: "1.2", name: "Node 1.2" },
      ],
    },
    ...newTreeNodes.slice(1),
  ]);
});

test("insertBefore() should insert node before target with children (before first)", () => {
  const tree = createSampleTree();
  const newNode: TreeNode<TestNode> = { id: "new", name: "New Node" };
  const newTree = tree.insertBefore("1.1", newNode);
  const newTreeNodes = newTree.getNodes();
  expect(newTreeNodes).toEqual([
    {
      ...newTreeNodes[0],
      childItems: [
        { id: "new", name: "New Node" },
        { id: "1.1", name: "Node 1.1" },
        { id: "1.2", name: "Node 1.2" },
      ],
    },
    ...newTreeNodes.slice(1),
  ]);
});

// ---
test("insertAfter() should insert node after target with no children", () => {
  const tree = createSampleTree();

  const newNode: TreeNode<TestNode> = { id: "new", name: "New Node" };
  const newTree = tree.insertAfter("2", newNode);
  const newTreeNodes = newTree.getNodes();

  expect(newTreeNodes).toEqual([
    newTreeNodes[0],
    { id: "2", name: "Node 2" },
    { id: "new", name: "New Node" },
    ...newTreeNodes.slice(3),
  ]);
});

test("insertAfter() should insert node after target with children (after last)", () => {
  const tree = createSampleTree();
  const newNode: TreeNode<TestNode> = { id: "new", name: "New Node" };
  const newTree = tree.insertAfter("1.2", newNode);
  const newTreeNodes = newTree.getNodes();
  expect(newTreeNodes).toEqual([
    {
      ...newTreeNodes[0],
      childItems: [
        { id: "1.1", name: "Node 1.1" },
        { id: "1.2", name: "Node 1.2" },
        { id: "new", name: "New Node" },
      ],
    },
    ...newTreeNodes.slice(1),
  ]);
});

test("insertAfter() should insert node after target with children (after first)", () => {
  const tree = createSampleTree();
  const newNode: TreeNode<TestNode> = { id: "new", name: "New Node" };
  const newTree = tree.insertAfter("1.1", newNode);
  const newTreeNodes = newTree.getNodes();
  expect(newTreeNodes).toEqual([
    {
      ...newTreeNodes[0],
      childItems: [
        { id: "1.1", name: "Node 1.1" },
        { id: "new", name: "New Node" },
        { id: "1.2", name: "Node 1.2" },
      ],
    },
    ...newTreeNodes.slice(1),
  ]);
});

// -- To review yet --

test("moveBefore - should move existing node before target", () => {
  const tree = createSampleTree();
  const nodeToMove = tree.findNodeById("3");

  if (!nodeToMove) {
    throw new Error("Node to move not found");
  }

  const newTree = tree.moveBefore("1", nodeToMove);
  const rootNodes = newTree.toArray();

  // Node should be moved before target
  const movedNodeIndex = rootNodes.findIndex((node) => node.id === "3");
  const targetIndex = rootNodes.findIndex((node) => node.id === "1");

  expect(movedNodeIndex).toBe(targetIndex - 1);
  expect(rootNodes.length).toBe(tree.toArray().length); // Same number of nodes
});

test("moveAfter - should move existing node after target", () => {
  const tree = createSampleTree();
  const nodeToMove = tree.findNodeById("1");

  if (!nodeToMove) {
    throw new Error("Node to move not found");
  }

  const newTree = tree.moveAfter("3", nodeToMove);
  const rootNodes = newTree.toArray();

  // Node should be moved after target
  const movedNodeIndex = rootNodes.findIndex((node) => node.id === "1");
  const targetIndex = rootNodes.findIndex((node) => node.id === "3");

  expect(movedNodeIndex).toBe(targetIndex + 1);
  expect(rootNodes.length).toBe(tree.toArray().length); // Same number of nodes
});

test("moveOn - should move node as child of target", () => {
  const tree = createSampleTree();

  const newTree = tree.moveOn("2", "1");

  // Node "2" should no longer be at root level
  const rootNodes = newTree.toArray();
  expect(rootNodes.find((node) => node.id === "2")).toBeUndefined();

  // Node "2" should be a child of node "1"
  const parentNode = newTree.findNodeById("1");
  expect(
    parentNode?.childItems?.find((child) => child.id === "2"),
  ).toBeTruthy();
});

test("moveOn - should handle moving deeply nested node", () => {
  const tree = createSampleTree();

  const newTree = tree.moveOn("3.1.1", "2");

  // Node should be removed from original location
  expect(
    newTree
      .findNodeById("3.1")
      ?.childItems?.find((child) => child.id === "3.1.1"),
  ).toBeUndefined();

  // Node should be child of new parent
  const newParent = newTree.findNodeById("2");
  expect(
    newParent?.childItems?.find((child) => child.id === "3.1.1"),
  ).toBeTruthy();
});

test("isLeafNode - should correctly identify leaf nodes", () => {
  const tree = createSampleTree();

  expect(tree.isLeafNode("1.1")).toBe(true);
  expect(tree.isLeafNode("1.2")).toBe(true);
  expect(tree.isLeafNode("2")).toBe(true);
  expect(tree.isLeafNode("3.1.1")).toBe(true);

  expect(tree.isLeafNode("1")).toBe(false);
  expect(tree.isLeafNode("3")).toBe(false);
  expect(tree.isLeafNode("3.1")).toBe(false);
});

test("flatten - should return all nodes without hierarchy", () => {
  const tree = createSampleTree();
  const flattened = tree.flatten();

  expect(flattened).toHaveLength(7);
  expect(flattened.map((node) => node.id)).toEqual([
    "1",
    "1.1",
    "1.2",
    "2",
    "3",
    "3.1",
    "3.1.1",
  ]);

  // Should not contain childItems property
  flattened.forEach((node) => {
    expect(node).not.toHaveProperty("childItems");
  });
});

test("immutability - operations should not mutate original tree", () => {
  const tree = createSampleTree();
  const originalArray = tree.toArray();
  const originalJson = JSON.stringify(originalArray);

  // Perform various operations
  tree.updateNode("1", (node) => {
    node.name = "Modified";
  });
  tree.removeNode("2");
  tree.insertBefore("1", { id: "new", name: "New" });
  tree.insertAfter("3", { id: "new2", name: "New2" });
  tree.moveOn("1.1", "2");

  // Original tree should remain unchanged
  expect(JSON.stringify(tree.toArray())).toBe(originalJson);
});

test("edge cases - operations on non-existent nodes", () => {
  const tree = createSampleTree();

  // These operations should return a tree without changes
  const newTree1 = tree.removeNode("nonexistent");
  const newTree2 = tree.insertBefore("nonexistent", {
    id: "new",
    name: "New",
  });
  const newTree3 = tree.moveOn("nonexistent", "1");
  const newTree4 = tree.moveOn("1", "nonexistent");

  expect(newTree1.toArray()).toEqual(tree.toArray());
  expect(newTree2.toArray()).toEqual(tree.toArray());
  expect(newTree3.toArray()).toEqual(tree.toArray());
  expect(newTree4.toArray()).toEqual(tree.toArray());
});
