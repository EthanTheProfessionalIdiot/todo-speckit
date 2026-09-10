import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const MAX_TODO_TITLE_LENGTH = 255;
const exports = {};

function parseId(rawId) {
  const id = parseInt(rawId, 10);
  return Number.isNaN(id) ? null : id;
}

function validateTitle(rawTitle) {
  if (!rawTitle || !String(rawTitle).trim()) {
    return "Todo title is required.";
  }

  if (String(rawTitle).trim().length > MAX_TODO_TITLE_LENGTH) {
    return "Todo title must be 255 characters or fewer.";
  }

  return null;
}

exports.findAll = async (req, res) => {
  const listId = parseId(req.params.listId);
  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todos = await db.todo.findAll({
      where: { listId, userId: req.user.id },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });
    return res.send(todos);
  } catch (error) {
    logger.error(`todos.findAll failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to load todos." });
  }
};

exports.create = async (req, res) => {
  const listId = parseId(req.params.listId);
  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  const titleError = validateTitle(req.body?.title);
  if (titleError) {
    logger.warn(`todos.create rejected: ${titleError}`);
    return res.status(400).send({ message: titleError });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todo = await db.todo.create({
      title: String(req.body.title).trim(),
      completed: false,
      listId: list.id,
      userId: req.user.id,
    });
    return res.status(201).send(todo);
  } catch (error) {
    logger.error(`todos.create failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to create todo." });
  }
};

exports.update = async (req, res) => {
  const todoId = parseId(req.params.id);
  if (todoId === null) {
    return res.status(400).send({ message: "Invalid todo id." });
  }

  const patch = {};
  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "title")) {
    const titleError = validateTitle(req.body.title);
    if (titleError) {
      return res.status(400).send({ message: titleError });
    }
    patch.title = String(req.body.title).trim();
  }

  if (Object.prototype.hasOwnProperty.call(req.body ?? {}, "completed")) {
    patch.completed = Boolean(req.body.completed);
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    await todo.update(patch);
    return res.send(todo);
  } catch (error) {
    logger.error(`todos.update failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to update todo." });
  }
};

exports.delete = async (req, res) => {
  const todoId = parseId(req.params.id);
  if (todoId === null) {
    return res.status(400).send({ message: "Invalid todo id." });
  }

  try {
    const todo = await getAccessibleTodoOrNull(req, todoId);
    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${todoId} not found.` });
    }

    await todo.destroy();
    return res.status(200).send({ message: `Todo with id=${todoId} deleted.` });
  } catch (error) {
    logger.error(`todos.delete failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to delete todo." });
  }
};

export default exports;
