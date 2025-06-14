### user

How do I center a div? I can never remember.

---

### assistant

You're not alone, it's a classic web development question! The best method depends on what exactly you mean by "center" (horizontally, vertically, or both).

Here are the most common ways, starting with the most modern and recommended.

#### 1. Flexbox (Center Horizontally & Vertically)

This is the go-to method today. Just make the parent container a flex container.

```css
.parent {
  display: flex;
  justify-content: center; /* Horizontal centering */
  align-items: center; /* Vertical centering */
  min-height: 100vh; /* Give parent height */
}
```

#### 2. Grid (Center Horizontally & Vertically)

Grid is another excellent modern option. This is even more concise.

```css
.parent {
  display: grid;
  place-items: center;
  min-height: 100vh;
}
```

#### 3. Margin Auto (Horizontal Centering Only)

This is an older technique that only works for horizontal centering. It requires the child element to have a defined width.

```css
.child {
  width: 50%;
  margin: 0 auto; /* top/bottom right/left */
}
```

My advice is to use Flexbox or Grid whenever possible. They are more powerful and predictable for layouts.

---

### user

Thanks! What if I want to center text inside the div?

---

### assistant

Great question. For centering text _inside_ a `div`, you don't need to change the parent. You can use the `text-align` property directly on the `div` itself.

```css
.my-div-with-centered-text {
  text-align: center;
}
```

This will center any inline content within that `div`, including text, links, and inline images. It only works for horizontal centering of the text. To vertically center the text, you would still need to use Flexbox or Grid on the container div, as shown in the first two examples.
