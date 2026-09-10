/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import bcrypt from "bcryptjs";
import request from "supertest";
import {
  app,
  db,
  defaultUser,
  registerUser,
  syncTestDatabase,
} from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const { res } = await registerUser();

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        email: "jdoe@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "worker",
      });
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.password).toBeUndefined();

      const stored = await db.user.unscoped().findOne({ where: { username: "jdoe" } });
      expect(stored).not.toBeNull();
      expect(stored.password).not.toBe(defaultUser.password);
      expect(await bcrypt.compare(defaultUser.password, stored.password)).toBe(true);
    });

    it("User submits registration with missing email", async () => {
      const { res } = await registerUser({ email: "" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is required." });
    });

    it("User submits registration with password too short", async () => {
      const { res } = await registerUser({ password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password must be at least 8 characters." });
    });

    it("User registers with a duplicate username", async () => {
      await registerUser();
      const { res } = await registerUser({
        email: "other@example.com",
        username: "jdoe",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });
    });

    it("User registers with a duplicate email", async () => {
      await registerUser({ email: "jane@example.com" });
      const { res } = await registerUser({
        email: "jane@example.com",
        username: "janedoe",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      await registerUser();

      const first = await request(app).post("/todo/login").send({
        username: "jdoe",
        password: defaultUser.password,
      });

      expect(first.status).toBe(200);
      expect(first.body).toMatchObject({
        userId: expect.any(Number),
        username: "jdoe",
        role: "worker",
      });
      expect(first.body.token).toEqual(expect.any(String));
      expect(first.body.password).toBeUndefined();

      const sessionCountAfterFirst = await db.session.count({
        where: { userId: first.body.userId },
      });
      expect(sessionCountAfterFirst).toBeGreaterThanOrEqual(1);

      const second = await request(app).post("/todo/login").send({
        username: "jdoe",
        password: defaultUser.password,
      });

      expect(second.status).toBe(200);
      expect(second.body.token).toBe(first.body.token);
    });

    it("User signs in with invalid password", async () => {
      await registerUser();

      const res = await request(app).post("/todo/login").send({
        username: "jdoe",
        password: "wrong-password",
      });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Invalid username or password." });
    });

    it("User signs in with missing username", async () => {
      const res = await request(app).post("/todo/login").send({
        username: "",
        password: defaultUser.password,
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is required." });
    });

    it("User signs in with missing password", async () => {
      const res = await request(app).post("/todo/login").send({
        username: "jdoe",
        password: "",
      });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password is required." });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const { res: registered } = await registerUser();
      const token = registered.body.token;

      const res = await request(app)
        .post("/todo/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const session = await db.session.findOne({ where: { userId: registered.body.userId } });
      expect(session.token).toBe("");

      const protectedRes = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${token}`);

      expect(protectedRes.status).toBe(401);
    });
  });
});
