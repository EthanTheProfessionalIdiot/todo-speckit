import db from "../models/index.js";
import logger from "../config/logger.js";

/**
 * Look up Bearer token in Session table, check expiration, set req.user.
 */
export const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return res.status(401).send({ message: "Unauthorized! No token provided." });
  }

  try {
    const session = await db.session.findOne({
      where: { token },
      include: [{ model: db.user, as: "user" }],
    });

    if (!session || !session.user) {
      return res.status(401).send({ message: "Unauthorized! Invalid token." });
    }

    if (new Date(session.expirationDate) < new Date()) {
      return res.status(401).send({ message: "Unauthorized! Token has expired." });
    }

    req.user = { id: session.user.id, role: session.user.role };
    next();
  } catch (error) {
    logger.error(`authenticate failed: ${error.message}`);
    return res.status(401).send({ message: "Unauthorized! Invalid token." });
  }
};

export const getAccessibleListOrNull = async (req, listId) => {
  const row = await db.list.findOne({
    where: { id: listId, userId: req.user.id },
  });
  return row ?? null;
};

export const getAccessibleTodoOrNull = async (req, todoId) => {
  const row = await db.todo.findOne({
    where: { id: todoId, userId: req.user.id },
  });
  return row ?? null;
};
