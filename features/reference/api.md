# API Reference

**Status:** Feature 1–5 — Auth + Lists + Todo items + Profile + Due dates

API mount path: `/todo` (see `backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Process health check |
| `POST` | `/todo/register` | No | Create a user and session |
| `POST` | `/todo/login` | No | Authenticate and return (or reuse) a session |
| `POST` | `/todo/logout` | Yes | Invalidate the current session token |
| `GET` | `/todo/lists` | Yes | Fetch all lists owned by the authenticated user, A–Z by name |
| `POST` | `/todo/lists` | Yes | Create a list owned by the authenticated user |
| `PUT` | `/todo/lists/:listId` | Yes | Rename an owned list |
| `DELETE` | `/todo/lists/:listId` | Yes | Delete an owned list |
| `GET` | `/todo/lists/:listId/todos` | Yes | Fetch todos in an owned list (incomplete first, then `createdAt`) |
| `POST` | `/todo/lists/:listId/todos` | Yes | Add a todo to an owned list (optional `dueDate`) |
| `PUT` | `/todo/todos/:id` | Yes | Update a todo title, `completed`, and/or `dueDate` |
| `DELETE` | `/todo/todos/:id` | Yes | Delete an owned todo |
| `GET` | `/todo/users/:id` | Yes | Fetch the authenticated user's profile |
| `PUT` | `/todo/users/:id` | Yes | Update the authenticated user's profile |

## Register / login success (flat JSON)

`POST /todo/register` → `201`  
`POST /todo/login` → `200`

```json
{
  "userId": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "fName": "Jane",
  "lName": "Doe",
  "role": "worker",
  "token": "<jwt>"
}
```

Password hashes are never returned.

## Register request

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jdoe@example.com",
  "username": "jdoe",
  "password": "password123"
}
```

Username is stored lowercase. Default role is `worker`. Password minimum length is 8.

## Login request

```json
{
  "username": "jdoe",
  "password": "password123"
}
```

## List create request

```json
{ "name": "Groceries" }
```

`userId` in the body is ignored. Ownership is always `req.user.id`.

## List success (`200` / `201`)

```json
{
  "id": 1,
  "name": "Groceries",
  "userId": 42,
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:00:00.000Z"
}
```

`GET /todo/lists` returns an array of these objects, sorted alphabetically by `name`.

## Todo create request

```json
{ "title": "Buy milk", "dueDate": "2026-07-15" }
```

`userId` and `listId` in the body are ignored. Ownership is `req.user.id`; `listId` comes from the path after the parent list is verified. `dueDate` is optional (`YYYY-MM-DD` or omit/`null`).

## Todo success (`200` / `201`)

```json
{
  "id": 10,
  "listId": 1,
  "title": "Buy milk",
  "completed": false,
  "dueDate": "2026-07-15",
  "userId": 42,
  "createdAt": "2026-07-02T12:05:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

New todos default to `completed: false`. `dueDate` is `null` when not set. `GET /todo/lists/:listId/todos` returns an array ordered incomplete first, then by `createdAt` ascending. `PUT` may send `dueDate: null` to clear; omitting `dueDate` leaves the stored value unchanged.

## Profile update request

```json
{
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "password": "newpassword123"
}
```

`password` is optional. Omit it to leave the current password unchanged. `role` is ignored.

## Profile success (`200`)

```json
{
  "id": 42,
  "fName": "Jane",
  "lName": "Doe",
  "email": "jane@example.com",
  "username": "jdoe",
  "role": "worker",
  "createdAt": "2026-07-02T12:00:00.000Z",
  "updatedAt": "2026-07-02T12:05:00.000Z"
}
```

Password hashes are never returned. `GET` and `PUT` succeed only when `:id` is the authenticated user.

## Errors

`{ "message": "Human-readable explanation." }`

| Status | When |
|--------|------|
| `400` | Missing/invalid registration or login fields; duplicate username (`Username is already taken.`); duplicate email (`Email is already registered.`); empty list name; list name longer than 100 characters; invalid `listId`; empty todo title; todo title longer than 255 characters; invalid todo due date (`Due date must be a valid date in YYYY-MM-DD format.`); missing profile fields (`First name is required.`); short profile password (`Password must be at least 8 characters.`) |
| `401` | Invalid username or password; missing, expired, or revoked session token (`Unauthorized! …`) |
| `404` | List, todo, or user not found or not owned (`List with id=<id> not found.` / `Todo with id=<id> not found.` / `User with id=<id> not found.`) |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.

## Feature provenance

| Area | Introduced |
|-------|------------|
| Auth register / login / logout | Feature 1 |
| Lists CRUD | Feature 2 |
| Todo items CRUD | Feature 3 |
| User profile GET / PUT | Feature 4 |
| Todo due dates | Feature 5 |
