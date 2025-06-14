### user

What is the difference between `useState` and `useEffect` in React?

---

### assistant

Great question! Here is a breakdown:

#### `useState`

- **Purpose:** To manage state within a functional component.
- **When to use:** When you have a value that can change over time and should cause the component to re-render when it does.

```tsx
const [count, setCount] = useState(0);
```

#### `useEffect`

- **Purpose:** To perform side effects in functional components. Side effects include data fetching, subscriptions, or manually changing the DOM.
- **When to use:** After the component renders, to synchronize it with an external system.

```tsx
useEffect(() => {
  document.title = `You clicked ${count} times`;
}, [count]); // Only re-run the effect if count changes
```

In short: `useState` holds the state, and `useEffect` reacts to state changes.

---

### user

That makes sense. So if I fetch data from an API, I should use `useEffect`?

---

### assistant

Exactly! You would typically use `useEffect` to fetch data when the component mounts. You can combine it with `useState` to store the fetched data.

Here's a quick example:

```tsx
import React, { useState, useEffect } from "react";

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`https://api.example.com/users/${userId}`)
      .then((response) => response.json())
      .then((data) => setUser(data));
  }, [userId]); // The effect depends on userId

  if (!user) {
    return <div>Loading...</div>;
  }

  return <div>{user.name}</div>;
}
```

This effect runs whenever the `userId` prop changes.
