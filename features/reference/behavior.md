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
| Login and register are full-screen (no `MenuBar`) | `App.vue` + auth views | Feature 1 |
| Protected home placeholder welcomes the user by first name and has **Sign out** | `Home.vue` | Feature 1 |
| Session stored in `localStorage` key `user` | `Utils.setStore("user", …)` | Feature 1 |
| Unauthenticated visit to a protected route → login | `router.beforeEach` | Feature 1 |
| Signed-in visit to login/register → home | `router.beforeEach` | Feature 1 |
| API `401` clears `user` and redirects to login | axios interceptor in `services.js` | Feature 1 |

## Ownership

Identity only in Feature 1. List/todo row scoping is Feature 2–3. `GET /todo/lists` currently returns `[]` for any authenticated user.
