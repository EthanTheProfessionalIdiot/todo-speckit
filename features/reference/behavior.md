# Behavior & Rules Reference

**Living snapshot** of product rules currently in force.

These files answer: *"What rules does the app enforce right now?"*  
They do **not** authorize new scope — implement only from `features/feature-*.md`.

## Auth and sessions

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Sign in with **username + password** (not email) | `POST /todo/login`; username `trim().toLowerCase()` | Feature 1; ADR-0002 |
| Password hashed with bcrypt (`SALT_ROUNDS = 10`); hashes never returned | `User.create` + `defaultScope` exclude `password` | Feature 1 |
| Session is **JWT + Session table**; client sends `Authorization: Bearer <token>` | `authenticate` middleware | Feature 1; ADR-0002 |
| Session lifetime **24 hours** | JWT `expiresIn: 86400` and `sessions.expirationDate` | Feature 1 |
| Login **reuses** a non-expired session for the same user | `issueSession` | Feature 1 |
| Logout **revokes** the server token (row token cleared) | `POST /todo/logout` | Feature 1 |
| Missing / expired / revoked token → **`401`** | `authenticate` | Feature 1 |
| Default role for new users is **`worker`** | `User.create` | Feature 1 |
| Authenticated requests resolve `req.user.id` from the session | `authenticate` sets `req.user` | Feature 1 |

## Validation

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Registration fields: first name, last name, email, username, password | Vue form rules + `auth.controller` | Feature 1 |
| Email required + format `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; messages **"Email is required."** / **"Enter a valid email address."** | `emailRules` + controller | Feature 1 FR-009 |
| Password at least 8 characters | Vue rules + controller | Feature 1 |
| Confirm password must match | Vue `Register.vue` | Feature 1 |
| Duplicate username → `400` **"Username is already taken."** | Controller | Feature 1 |
| Duplicate email → `400` **"Email is already registered."** | Controller | Feature 1 |
| Invalid login credentials → `401` **"Invalid username or password."** (same message for unknown user or bad password) | `auth.controller` login | Feature 1 |
| Whitespace-only required fields rejected | `trim()` checks client and server | Feature 1 |

## UI

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| Login and register are full-screen (no `MenuBar`) | `App.vue` hides `MenuBar` on those routes | Feature 1; Feature 2 |
| Dashboard heading **My Lists**; **+ New List** opens a create dialog | `Dashboard.vue` | Feature 2 |
| Empty lists copy: **"No lists yet. Create your first list."** | `Dashboard.vue` | Feature 2 |
| List rows have **Edit list** and **Delete list** icon actions (`size="small"`) | `Dashboard.vue` | Feature 2 |
| `MenuBar` shows signed-in name and **Sign out** | `MenuBar.vue` | Feature 2 |
| Session stored in `localStorage` key `user` | `Utils.setStore("user", …)` | Feature 1 |
| Unauthenticated visit to a protected route → login | `router.beforeEach` | Feature 1 |
| Signed-in visit to login/register → home | `router.beforeEach` | Feature 1 |
| API `401` clears `user` and redirects to login | axios interceptor in `services.js` | Feature 1 |

## Ownership

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| `GET /todo/lists` returns only rows with `userId = req.user.id` | `list.controller` `findAll` | Feature 2 |
| Create `userId` from `req.user.id` only; ignore body `userId` | `list.controller` `create` | Feature 2 |
| Update/delete only when `id` and `userId` match | `getAccessibleListOrNull` | Feature 2 |
| Cross-user list access → **`404`**, never `403` | `getAccessibleListOrNull` | ADR-0002; Feature 2 |
| Lists returned **alphabetically by name** | `findAll` `order: [["name", "ASC"]]` | Feature 2 |

## List validation

| Rule | Enforcement | Introduced |
|------|-------------|------------|
| List name trimmed; empty/whitespace → **"List name is required."** | Vue rules + controller | Feature 2 |
| List name longer than 100 characters → `400` **"List name must be 100 characters or fewer."** | Controller | Feature 2 |
