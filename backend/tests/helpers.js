import request from "supertest";
import app from "../server.js";
import db from "../app/models/index.js";

/** Sync schema for tests. */
export const syncTestDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

export const defaultUser = {
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  password: "password123",
};

export const registerUser = async (overrides = {}) => {
  const payload = { ...defaultUser, ...overrides };
  const res = await request(app).post("/todo/register").send(payload);
  return { res, payload };
};

export { app, db };
