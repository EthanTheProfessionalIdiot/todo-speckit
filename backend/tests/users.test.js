/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import request from "supertest";
import {
  app,
  authHeader,
  db,
  defaultUser,
  registerUser,
  syncTestDatabase,
} from "./helpers.js";

const otherUser = {
  username: "bsmith",
  email: "bsmith@example.com",
  fName: "Bob",
  lName: "Smith",
};

function profileBody(overrides = {}) {
  return {
    fName: defaultUser.fName,
    lName: defaultUser.lName,
    email: defaultUser.email,
    username: defaultUser.username,
    ...overrides,
  };
}

describe("Feature 4 — User Profile Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const { res: user } = await registerUser();

      const res = await request(app)
        .put(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token))
        .send(
          profileBody({
            fName: "Janet",
            lName: "Doe-Smith",
            email: "jane@example.com",
            username: "janet",
          }),
        );

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.body.userId,
        fName: "Janet",
        lName: "Doe-Smith",
        email: "jane@example.com",
        username: "janet",
        role: "worker",
      });
      expect(res.body.password).toBeUndefined();
    });

    it("User fetches their own profile", async () => {
      const { res: user } = await registerUser();

      const res = await request(app)
        .get(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.body.userId,
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
        role: "worker",
      });
      expect(res.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser(otherUser);

      const res = await request(app)
        .get(`/todo/users/${userB.body.userId}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `User with id=${userB.body.userId} not found.`,
      });
    });

    it("User attempts to update another user's profile", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser(otherUser);

      const res = await request(app)
        .put(`/todo/users/${userB.body.userId}`)
        .set(authHeader(userA.body.token))
        .send(profileBody({ fName: "Hijacked" }));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `User with id=${userB.body.userId} not found.`,
      });

      const stored = await db.user.findByPk(userB.body.userId);
      expect(stored.fName).toBe("Bob");
    });

    it("Unauthenticated profile API request", async () => {
      const res = await request(app).get("/todo/users/1");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });

    it("Profile update rejects a password that is too short", async () => {
      const { res: user } = await registerUser();

      const res = await request(app)
        .put(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token))
        .send({ password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password must be at least 8 characters." });
    });

    it("Profile update rejects missing required fields", async () => {
      const { res: user } = await registerUser();

      const res = await request(app)
        .put(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token))
        .send({
          lName: defaultUser.lName,
          email: defaultUser.email,
          username: defaultUser.username,
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "First name is required." });

      const stored = await db.user.findByPk(user.body.userId);
      expect(stored.fName).toBe("Jane");
    });

    it("Profile update rejects a duplicate username", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        ...otherUser,
        username: "userb",
      });

      const res = await request(app)
        .put(`/todo/users/${userA.body.userId}`)
        .set(authHeader(userA.body.token))
        .send(profileBody({ username: "userb" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });

      const stored = await db.user.findByPk(userB.body.userId);
      expect(stored.username).toBe("userb");
    });

    it("Profile update rejects a duplicate email", async () => {
      const { res: userA } = await registerUser();
      const { res: userB } = await registerUser({
        ...otherUser,
        email: "b@example.com",
      });

      const res = await request(app)
        .put(`/todo/users/${userA.body.userId}`)
        .set(authHeader(userA.body.token))
        .send(profileBody({ email: "b@example.com" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });

      const stored = await db.user.findByPk(userB.body.userId);
      expect(stored.email).toBe("b@example.com");
    });

    it("Unauthenticated profile update API request", async () => {
      const res = await request(app)
        .put("/todo/users/1")
        .send(profileBody());

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
