### user

What are the most common state management patterns in React besides `useState`?

---

### assistant

Beyond `useState` for local state, React developers often use these patterns for more complex state needs:

1.  **Lifting State Up:** This is the most basic pattern. When multiple components need to share the same state, you lift the state up to their closest common ancestor. The ancestor then passes the state down via props.

2.  **`useReducer`:** For more complex state logic that involves multiple sub-values or when the next state depends on the previous one, `useReducer` is often preferable to `useState`. It's great for managing state for a single complex component.

3.  **Context API (`useContext`)**: This is React's built-in way to pass data through the component tree without having to pass props down manually at every level. It's perfect for "global" data like UI theme, user authentication status, etc.

4.  **External Libraries (Global State Management):** For large applications, managing state with just React's built-in tools can become cumbersome. This is where external libraries shine:
    - **Redux:** The oldest and most well-known. It uses a single global store and strict unidirectional data flow. It has a lot of boilerplate but is very predictable.
    - **Zustand:** A very popular, minimalistic library. It's easy to set up and uses hooks in a way that feels very "React-y".
    - **Jotai:** A primitive and flexible state management solution for React. It is based on an atomic model.

---

### user

Which one should I choose for a new project?

---

### assistant

It depends on the project's scale:

- **Small Projects:** Start with `useState` and "lifting state up". Introduce `useContext` for global data like themes.
- **Medium Projects:** `useReducer` and `useContext` can handle a lot. Zustand is a great lightweight option if you need a dedicated global store without the boilerplate of Redux.
- **Large-Scale Enterprise Projects:** Redux (with Redux Toolkit) is still a very solid and scalable choice due to its robust ecosystem and developer tools. Zustand is also proving to be very capable in large applications.

My advice: start simple and only add a more powerful tool when you feel the pain of your current solution.
