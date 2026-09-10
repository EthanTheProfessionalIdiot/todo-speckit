# API Reference

**Status:** Feature 1 — User Authentication & Session Management

API mount path: `/todo` (see `backend/server.js`). Authenticated routes require `Authorization: Bearer <token>`.

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/todo/health` | No | Process health check |
| `POST` | `/todo/register` | No | Create a user and session |
| `POST` | `/todo/login` | No | Authenticate and return (or reuse) a session |
| `POST` | `/todo/logout` | Yes | Invalidate the current session token |
| `GET` | `/todo/lists` | Yes | Auth probe: returns `[]` until Feature 2 list CRUD |

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

## Errors

`{ "message": "Human-readable explanation." }`

| Status | When |
|--------|------|
| `400` | Missing/invalid registration or login fields; duplicate username (`Username is already taken.`); duplicate email (`Email is already registered.`) |
| `401` | Invalid username or password; missing, expired, or revoked session token (`Unauthorized! …`) |

## Conventions

- Flat JSON responses (no `{ success, data }` envelope).
- Errors: `{ "message": "..." }`.
- Authenticated routes: `Authorization: Bearer <token>`.

## Feature provenance

| Area | Introduced |
|-------|------------|
| Auth register / login / logout | Feature 1 |
| `GET /todo/lists` empty auth probe | Feature 1 |
