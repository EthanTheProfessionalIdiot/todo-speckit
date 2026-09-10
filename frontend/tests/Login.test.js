/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
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

async function submit(wrapper) {
  await wrapper.get("form").trigger("submit.prevent");
  await flushPromises();
}

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      AuthServices.loginUser.mockRejectedValue({
        response: {
          status: 401,
          data: { message: "Invalid username or password." },
        },
      });

      const { wrapper } = await mountWithPlugins(Login);
      await setField(wrapper, "Username", "jdoe");
      await setField(wrapper, "Password", "wrong-password");
      await submit(wrapper);

      expect(AuthServices.loginUser).toHaveBeenCalled();
      expect(wrapper.text()).toContain("Invalid username or password.");
      expect(wrapper.find(".v-alert").exists()).toBe(true);
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      await setField(wrapper, "Username", "");
      await setField(wrapper, "Password", "password123");
      await submit(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      await setField(wrapper, "Username", "jdoe");
      await setField(wrapper, "Password", "");
      await submit(wrapper);

      expect(wrapper.text()).toContain("Password is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });
  });
});
