# icagria Frontend Design System

> JavaScript-only, React + Vite + Tailwind CSS v4. No TypeScript.

---

## Code Rules

- **JavaScript only.** All source files use `.js` or `.jsx`. No `.ts`, `.tsx`, `tsconfig*.json`, `typescript` package, or `@types/*` packages.
- **Semantic HTML.** Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<form>`, `<label>`, `<button>`, `<table>`, `<thead>`, `<tbody>`, and correct heading levels (`<h1>`–`<h6>`). Avoid generic `<div>` nesting where a semantic element fits.
- **Interface language:** English only.
- **Target device:** Laptop and desktop (minimum 1024 px, content `max-w-7xl`).

---

## Palette

| Token | Value | Usage |
|---|---|---|
| `green-900` | `#14532d` | Headings, primary buttons, accents |
| `green-800` | `#166534` | Secondary headings, hover on primary |
| `green-700` | `#15803d` | Text links |
| `green-100` | `#dcfce7` | Tints, card image backgrounds |
| `green-50`  | `#f0fdf4` | Page tint backgrounds, hover |
| `red-700`   | `#b91c1c` | Error messages, destructive actions only |
| Neutral grays | Tailwind defaults | Body text, borders, metadata |

**Rule:** Never rely on color alone — always pair status with an icon **and** a text label.

---

## Typography

- **UI text / body:** Inter (sans-serif)
- **Large headings / wordmark / card headlines:** Source Serif 4 (serif)

---

## Layout

- **Max content width:** `max-w-7xl mx-auto px-6`
- Inspired by editorial magazine structure: generous white space, thin 1 px rules, no heavy shadows.

### Top Bar (sticky header + nav)

```
[ icagria (serif wordmark) ]  [ nav links ]          [ 🔔 unread ]  [ Name ]  [ Logout ]
───────────────────────────────────────────────────────────────────────────────────────── ← 1px rule
```

- Wordmark on the left (serif), role-aware nav links next to it.
- Right side: alerts bell slot (farmer only, added later), user name, Logout text button.
- Thin `border-b` bottom rule.
- Height: `h-14` (56 px).

### Page Header Component

```
EYEBROW LABEL (uppercase, small, gray)
Large Serif H1 Title
One-line description (optional)
─────────────────────────────────────── ← thin rule
```

### Section Header

```
Serif H2 ────────────────── View all →
```

### Cards

- 3:2 image area (aspect-[3/2]): soft `green-100` block with large serif initial.
- Eyebrow label (uppercase, small).
- Bold serif headline — underlines on hover.
- Short description (gray-600, small).
- Flat, `border border-gray-200`, no heavy box-shadow.

### Footer

Multi-column layout: wordmark column + 2–3 link columns.

---

## Components (src/components/ui)

| Component | Purpose |
|---|---|
| `Button` | primary (solid green-900), secondary (outline), text-link (with → arrow) |
| `Input` | visible label above, helper text, inline field error |
| `Select` | same pattern as Input |
| `Textarea` | same pattern as Input |
| `FormField` | wrapper: label + input slot + helper + error |
| `Badge` | small pill label |
| `StatusBadge` | icon + text label, never color-only |
| `Card` | 3:2 image + eyebrow + headline + description |
| `StatCard` | single metric block |
| `PageHeader` | eyebrow + h1 + description + rule |
| `SectionHeader` | h2 + rule + optional "View all →" |
| `Table` helpers | `Th`, `Td`, `TableContainer` |
| `Modal` | focus trap, Escape to close |
| `ConfirmDialog` | Modal + confirm / cancel buttons |
| `Spinner` | animated loading indicator |
| `Skeleton` | grey placeholder block |
| `EmptyState` | helpful sentence + call to action |
| `ErrorBlock` | inline red error block showing API message |
| `Toast` | custom, no library; `aria-live` |
| `useToast` | hook to push toasts |
| `LoadMore` | text link to load next page |

---

## API Layer Rules

- Axios instance in `src/api/client.js` with `baseURL = import.meta.env.VITE_API_URL`.
- Request interceptor: attach `Authorization: Bearer <token>`.
- Response interceptor: 401 on non-auth routes → clear auth, redirect `/login`, toast "Your session has expired. Please log in again."
- `getErrorMessage(err)`: prefers `err.response.data.message`, falls back to network error or generic message.
- All API functions return the unwrapped `data` field from `{ success, data }`.

---

## Auth Rules

- Token stored in `localStorage` under key `"icagria_token"` only.
- On app start: if token exists, call `GET /auth/me`; if it fails, clear token.

---

## Routing Rules

- Role homes: farmer → `/app/dashboard`, buyer → `/app/marketplace`, admin → `/admin`.
- `ProtectedRoute`: requires login, else → `/login`.
- `RoleRoute`: requires matching role, else → role home + toast "You do not have access to that page."
- Logged-in users visiting `/login` or `/register` → redirected to role home.
