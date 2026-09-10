/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */
import request from "supertest";
import {
  app,
  authHeader,
  createList,
  createTodo,
  db,
  registerUser,
  syncTestDatabase,
} from "./helpers.js";

const otherUser = {
  username: "bsmith",
  email: "bsmith@example.com",
  fName: "Bob",
  lName: "Smith",
};

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const { res: user } = await registerUser();
      const list = await createList(user.body.token, "Groceries");

      const res = await createTodo(user.body.token, list.body.id, "Buy milk");

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        title: "Buy milk",
        completed: false,
        userId: user.body.userId,
        listId: list.body.id,
      });
    });

    it("User adds a todo with an empty title", async () => {
      const { res: user } = await registerUser();
      const list = await createList(user.body.token, "Groceries");

      const empty = await createTodo(user.body.token, list.body.id, "");
      expect(empty.status).toBe(400);
      expect(empty.body).toEqual({ message: "Todo title is required." });

      const whitespace = await createTodo(user.body.token, list.body.id, "   ");
      expect(whitespace.status).toBe(400);
      expect(whitespace.body).toEqual({ message: "Todo title is required." });
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser(otherUser);
      const listA = await createList(userA.body.token, "Work");
      const listB = await createList(userB.body.token, "Work");
      await createTodo(userA.body.token, listA.body.id, "My task");
      await createTodo(userB.body.token, listB.body.id, "Their task");

      const res = await request(app)
        .get(`/todo/lists/${listA.body.id}/todos`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((todo) => todo.title)).toEqual(["My task"]);
      expect(res.body.some((todo) => todo.title === "Their task")).toBe(false);
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const { res: user } = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const todo = await createTodo(user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token))
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const { res: user } = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const todo = await createTodo(user.body.token, list.body.id, "Buy milk");
      await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token))
        .send({ completed: true });

      const res = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token))
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const { res: user } = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const todo = await createTodo(user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .put(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy oat milk" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      const { res: user } = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const todo = await createTodo(user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .delete(`/todo/todos/${todo.body.id}`)
        .set(authHeader(user.body.token));

      expect([200, 204]).toContain(res.status);

      const remaining = await db.todo.findByPk(todo.body.id);
      expect(remaining).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser(otherUser);
      const secret = await createList(userB.body.token, "Secret");
      await createTodo(userB.body.token, secret.body.id, "Hidden task");

      const res = await request(app)
        .get(`/todo/lists/${secret.body.id}/todos`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${secret.body.id} not found.`,
      });
      expect(JSON.stringify(res.body)).not.toContain("Hidden task");
    });

    it("User attempts to add a todo to another user's list", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser(otherUser);
      const listB = await createList(userB.body.token, "Secret");

      const res = await createTodo(userA.body.token, listB.body.id, "Intruder task");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${listB.body.id} not found.`,
      });

      const count = await db.todo.count({ where: { listId: listB.body.id } });
      expect(count).toBe(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser(otherUser);
      const listB = await createList(userB.body.token, "Secret");
      const todoB = await createTodo(userB.body.token, listB.body.id, "Hidden task");

      const res = await request(app)
        .put(`/todo/todos/${todoB.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ title: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Todo with id=${todoB.body.id} not found.`,
      });

      const stored = await db.todo.findByPk(todoB.body.id);
      expect(stored.title).toBe("Hidden task");
    });

    it("User attempts to delete another user's todo", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser(otherUser);
      const listB = await createList(userB.body.token, "Secret");
      const todoB = await createTodo(userB.body.token, listB.body.id, "Hidden task");

      const res = await request(app)
        .delete(`/todo/todos/${todoB.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `Todo with id=${todoB.body.id} not found.`,
      });

      const stored = await db.todo.findByPk(todoB.body.id);
      expect(stored).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser(otherUser);
      const list = await createList(userA.body.token, "Groceries");

      const res = await createTodo(userA.body.token, list.body.id, "Buy milk", {
        userId: userB.body.userId,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(userB.body.userId);
    });

    it("Unauthenticated API request for todos", async () => {
      const res = await request(app).get("/todo/lists/1/todos");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const { res: user } = await registerUser();
      const list = await createList(user.body.token, "Groceries");
      const milk = await createTodo(user.body.token, list.body.id, "Buy milk");
      const eggs = await createTodo(user.body.token, list.body.id, "Buy eggs");

      const res = await request(app)
        .delete(`/todo/lists/${list.body.id}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);

      expect(await db.todo.findByPk(milk.body.id)).toBeNull();
      expect(await db.todo.findByPk(eggs.body.id)).toBeNull();
    });
  });
});
