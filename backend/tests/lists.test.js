/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import request from "supertest";
import {
  app,
  authHeader,
  createList,
  db,
  registerUser,
  syncTestDatabase,
} from "./helpers.js";

describe("Feature 2 — Todo List Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const { res: user } = await registerUser();

      const res = await createList(user.body.token, "Groceries");

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        name: "Groceries",
        userId: user.body.userId,
      });
    });

    it("User creates a list with an empty name", async () => {
      const { res: user } = await registerUser();

      const empty = await createList(user.body.token, "");
      expect(empty.status).toBe(400);
      expect(empty.body).toEqual({ message: "List name is required." });

      const whitespace = await createList(user.body.token, "   ");
      expect(whitespace.status).toBe(400);
      expect(whitespace.body).toEqual({ message: "List name is required." });
    });

    it("User creates a list with a name that is too long", async () => {
      const { res: user } = await registerUser();
      const name = "a".repeat(101);

      const res = await createList(user.body.token, name);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "List name must be 100 characters or fewer.",
      });
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const { res: user } = await registerUser();
      await createList(user.body.token, "Work");
      await createList(user.body.token, "Personal");

      const res = await request(app)
        .get("/todo/lists")
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "bsmith",
        email: "bsmith@example.com",
        fName: "Bob",
        lName: "Smith",
      });
      await createList(userB.body.token, "Secret Project");
      await createList(userA.body.token, "Groceries");

      const res = await request(app)
        .get("/todo/lists")
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.every((list) => list.userId === userA.body.userId)).toBe(true);
      expect(res.body.some((list) => list.name === "Secret Project")).toBe(false);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const { res: user } = await registerUser();
      const created = await createList(user.body.token, "Groceries");

      const res = await request(app)
        .put(`/todo/lists/${created.body.id}`)
        .set(authHeader(user.body.token))
        .send({ name: "Shopping" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.body.id,
        name: "Shopping",
        userId: user.body.userId,
      });
    });

    it("User deletes a list", async () => {
      const { res: user } = await registerUser();
      const created = await createList(user.body.token, "Groceries");

      const res = await request(app)
        .delete(`/todo/lists/${created.body.id}`)
        .set(authHeader(user.body.token));

      expect([200, 204]).toContain(res.status);

      const remaining = await db.list.findByPk(created.body.id);
      expect(remaining).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "bsmith",
        email: "bsmith@example.com",
        fName: "Bob",
        lName: "Smith",
      });
      const ownedByB = await createList(userB.body.token, "Secret Project");

      const res = await request(app)
        .put(`/todo/lists/${ownedByB.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${ownedByB.body.id} not found.`,
      });

      const stored = await db.list.findByPk(ownedByB.body.id);
      expect(stored.name).toBe("Secret Project");
    });

    it("User attempts to delete another user's list", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "bsmith",
        email: "bsmith@example.com",
        fName: "Bob",
        lName: "Smith",
      });
      const ownedByB = await createList(userB.body.token, "Secret Project");

      const res = await request(app)
        .delete(`/todo/lists/${ownedByB.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `List with id=${ownedByB.body.id} not found.`,
      });

      const stored = await db.list.findByPk(ownedByB.body.id);
      expect(stored).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        username: "bsmith",
        email: "bsmith@example.com",
        fName: "Bob",
        lName: "Smith",
      });

      const res = await createList(userA.body.token, "Groceries", {
        userId: userB.body.userId,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(userB.body.userId);

      const stored = await db.list.findByPk(res.body.id);
      expect(stored.userId).toBe(userA.body.userId);
    });

    it("Unauthenticated API request to lists", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
