export type ChatDefinition = {
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
