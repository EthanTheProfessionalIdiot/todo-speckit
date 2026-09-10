import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const SALT_ROUNDS = 10;
const SESSION_TTL_SECONDS = 86400;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { Op } = db.Sequelize;

const exports = {};

function requiredTrimmed(value, message) {
  if (!value || !String(value).trim()) {
    return message;
  }
  return null;
}

function validateRegisterBody(body) {
  const fNameError = requiredTrimmed(body.fName, "First name is required.");
  if (fNameError) return fNameError;

  const lNameError = requiredTrimmed(body.lName, "Last name is required.");
  if (lNameError) return lNameError;

  const emailError = requiredTrimmed(body.email, "Email is required.");
  if (emailError) return emailError;

  if (!EMAIL_REGEX.test(String(body.email).trim())) {
    return "Enter a valid email address.";
  }

  const usernameError = requiredTrimmed(body.username, "Username is required.");
  if (usernameError) return usernameError;

  const passwordError = requiredTrimmed(body.password, "Password is required.");
  if (passwordError) return passwordError;

  if (String(body.password).length < 8) {
    return "Password must be at least 8 characters.";
  }

  return null;
}

function toAuthPayload(user, token) {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    fName: user.fName,
    lName: user.lName,
    role: user.role,
    token,
  };
}

async function issueSession(user) {
  const existing = await db.session.findOne({
    where: {
      userId: user.id,
      token: { [Op.ne]: "" },
      expirationDate: { [Op.gte]: new Date() },
    },
  });

  if (existing?.token) {
    return existing.token;
  }

  const token = jwt.sign({ id: user.id }, authConfig.secret, {
    expiresIn: SESSION_TTL_SECONDS,
  });

  await db.session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    userId: user.id,
  });

  return token;
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

exports.register = async (req, res) => {
  const validationError = validateRegisterBody(req.body);
  if (validationError) {
    logger.warn(`register rejected: ${validationError}`);
    return res.status(400).send({ message: validationError });
  }

  const username = String(req.body.username).trim().toLowerCase();
  const email = String(req.body.email).trim();

  try {
    const existingUsername = await db.user.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const existingEmail = await db.user.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    const user = await db.user.create({
      fName: String(req.body.fName).trim(),
      lName: String(req.body.lName).trim(),
      email,
      username,
      password: hashedPassword,
      role: "worker",
    });

    const token = await issueSession(user);
    logger.debug(`Registered user ${user.id}`);
    return res.status(201).send(toAuthPayload(user, token));
  } catch (error) {
    const uniqueMessage = uniqueConstraintMessage(error);
    if (uniqueMessage) {
      return res.status(400).send({ message: uniqueMessage });
    }
    logger.error(`register failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to register." });
  }
};

exports.login = async (req, res) => {
  const usernameError = requiredTrimmed(req.body.username, "Username is required.");
  if (usernameError) {
    return res.status(400).send({ message: usernameError });
  }

  const passwordError = requiredTrimmed(req.body.password, "Password is required.");
  if (passwordError) {
    return res.status(400).send({ message: passwordError });
  }

  const username = String(req.body.username).trim().toLowerCase();

  try {
    const user = await db.user.unscoped().findOne({ where: { username } });
    if (!user) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const passwordMatches = await bcrypt.compare(req.body.password, user.password);
    if (!passwordMatches) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const token = await issueSession(user);
    logger.debug(`Login user ${user.id}`);
    return res.status(200).send(toAuthPayload(user, token));
  } catch (error) {
    logger.error(`login failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to sign in." });
  }
};

exports.logout = async (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  try {
    if (token) {
      await db.session.update({ token: "" }, { where: { token } });
    }
    return res.status(200).send({ message: "Signed out." });
  } catch (error) {
    logger.error(`logout failed: ${error.message}`);
    return res.status(500).send({ message: "Unable to sign out." });
  }
};

export default exports;
