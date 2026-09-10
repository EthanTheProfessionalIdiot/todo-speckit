/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import AuthServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    registerUser: vi.fn(),
  },
}));

async function setField(wrapper, label, value) {
  const field = wrapper.findAllComponents({ name: "VTextField" }).find((component) => {
    return component.props("label") === label;
  });
  expect(field).toBeTruthy();
  await field.setValue(value);
}

async function fillValidRegistration(wrapper, overrides = {}) {
  const values = {
    "First name": "Jane",
    "Last name": "Doe",
    Email: "jdoe@example.com",
    Username: "jdoe",
    Password: "password123",
    "Confirm password": "password123",
    ...overrides,
  };

  for (const [label, value] of Object.entries(values)) {
    await setField(wrapper, label, value);
  }
}

async function submit(wrapper) {
  await wrapper.get("form").trigger("submit.prevent");
  await flushPromises();
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillValidRegistration(wrapper, { Email: "notanemail" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillValidRegistration(wrapper, { Username: "" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillValidRegistration(wrapper, {
        Password: "short",
        "Confirm password": "short",
      });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fillValidRegistration(wrapper, { "Confirm password": "password456" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });
  });
});
