import bcrypt from "bcryptjs";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const exports = {};

function parseId(rawId) {
  const id = parseInt(rawId, 10);
  return Number.isNaN(id) ? null : id;
}

function requiredTrimmed(value, message) {
  if (!value || !String(value).trim()) {
    return message;
  }
  return null;
}

function passwordProvided(body) {
  return (
    Object.prototype.hasOwnProperty.call(body ?? {}, "password") &&
    body.password != null &&
    String(body.password).length > 0
  );
}

function validateUpdateBody(body) {
  if (passwordProvided(body) && String(body.password).length < 8) {
    return "Password must be at least 8 characters.";
  }

  const fNameError = requiredTrimmed(body?.fName, "First name is required.");
  if (fNameError) return fNameError;

  const lNameError = requiredTrimmed(body?.lName, "Last name is required.");
  if (lNameError) return lNameError;

  const emailError = requiredTrimmed(body?.email, "Email is required.");
  if (emailError) return emailError;

  if (!EMAIL_REGEX.test(String(body.email).trim())) {
    return "Enter a valid email address.";
  }

  const usernameError = requiredTrimmed(body?.username, "Username is required.");
  if (usernameError) return usernameError;

  return null;
}

function uniqueConstraintMessage(error) {
  const field = error.errors?.[0]?.path;
  if (field === "username") {
    return "Username is already taken.";
  }
  if (field === "email") {
    return "Email is already registered.";
  }
  return null;
}

exports.findOne = async (req, res) => {
  const userId = parseId(req.params.id);
  if (userId === null) {
    return res.status(400).send({ message: "Invalid user id." });
  }

  try {
    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    return res.send(user);
  } catch (error) {
    logger.error(`users.findOne failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to load profile." });
  }
};

exports.update = async (req, res) => {
  const userId = parseId(req.params.id);
  if (userId === null) {
    return res.status(400).send({ message: "Invalid user id." });
  }

  const validationError = validateUpdateBody(req.body);
  if (validationError) {
    logger.warn(`users.update rejected: ${validationError}`);
    return res.status(400).send({ message: validationError });
  }

  const username = String(req.body.username).trim().toLowerCase();
  const email = String(req.body.email).trim();

  try {
    const user = await getAccessibleUserOrNull(req, userId);
    if (!user) {
      return res.status(404).send({ message: `User with id=${userId} not found.` });
    }

    const existingUsername = await db.user.findOne({ where: { username } });
    if (existingUsername && existingUsername.id !== user.id) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await db.user.findOne({ where: { email } });
    if (existingEmail && existingEmail.id !== user.id) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const patch = {
      fName: String(req.body.fName).trim(),
      lName: String(req.body.lName).trim(),
      email,
      username,
    };

    if (passwordProvided(req.body)) {
      patch.password = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    }

    await user.update(patch);
    await user.reload();
    return res.send(user);
  } catch (error) {
    const uniqueMessage = uniqueConstraintMessage(error);
    if (uniqueMessage) {
      return res.status(400).send({ message: uniqueMessage });
    }
    logger.error(`users.update failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to update profile." });
  }
};

export default exports;
