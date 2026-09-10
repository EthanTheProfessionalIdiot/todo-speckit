# API Reference

**Status:** Feature 1–2 — Auth + Todo List Management

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

## Errors

`{ "message": "Human-readable explanation." }`

| Status | When |
|--------|------|
| `400` | Missing/invalid registration or login fields; duplicate username (`Username is already taken.`); duplicate email (`Email is already registered.`); empty list name; list name longer than 100 characters; invalid `listId` |
| `401` | Invalid username or password; missing, expired, or revoked session token (`Unauthorized! …`) |
| `404` | List not found or not owned (`List with id=<id> not found.`) |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.

## Feature provenance

| Area | Introduced |
|-------|------------|
| Auth register / login / logout | Feature 1 |
| Lists CRUD | Feature 2 |
