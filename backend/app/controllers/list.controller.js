import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const MAX_LIST_NAME_LENGTH = 100;
const exports = {};

function parseListId(rawId) {
  const listId = parseInt(rawId, 10);
  return Number.isNaN(listId) ? null : listId;
}

function validateListName(rawName) {
  if (!rawName || !String(rawName).trim()) {
    return "List name is required.";
  }

  const name = String(rawName).trim();
  if (name.length > MAX_LIST_NAME_LENGTH) {
    return "List name must be 100 characters or fewer.";
  }

  return null;
}

exports.findAll = async (req, res) => {
  try {
    const lists = await db.list.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    return res.send(lists);
  } catch (error) {
    logger.error(`lists.findAll failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to load lists." });
  }
};

exports.create = async (req, res) => {
  const nameError = validateListName(req.body?.name);
  if (nameError) {
    logger.warn(`lists.create rejected: ${nameError}`);
    return res.status(400).send({ message: nameError });
  }

  try {
    const list = await db.list.create({
      name: String(req.body.name).trim(),
      userId: req.user.id,
    });
    return res.status(201).send(list);
  } catch (error) {
    logger.error(`lists.create failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to create list." });
  }
};

exports.update = async (req, res) => {
  const listId = parseListId(req.params.listId);
  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  const nameError = validateListName(req.body?.name);
  if (nameError) {
    return res.status(400).send({ message: nameError });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.update({ name: String(req.body.name).trim() });
    return res.send(list);
  } catch (error) {
    logger.error(`lists.update failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to update list." });
  }
};

exports.delete = async (req, res) => {
  const listId = parseListId(req.params.listId);
  if (listId === null) {
    return res.status(400).send({ message: "Invalid list id." });
  }

  try {
    const list = await getAccessibleListOrNull(req, listId);
    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    await list.destroy();
    return res.status(200).send({ message: `List with id=${listId} deleted.` });
  } catch (error) {
    logger.error(`lists.delete failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to delete list." });
  }
};

export default exports;
