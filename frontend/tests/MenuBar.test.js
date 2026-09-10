/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import AuthServices from "../src/services/authServices.js";
import UserServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    registerUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const sessionUser = {
  userId: 1,
  username: "jdoe",
  email: "jdoe@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "worker",
  token: "test-token",
};

const profile = {
  id: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  role: "worker",
};

let wrapper;
let router;

function buttonText(button) {
  return (button.textContent ?? button.text?.() ?? "").replace(/\s+/g, " ").trim();
}

function vButtons() {
  return wrapper.findAllComponents({ name: "VBtn" });
}

async function triggerButton(button) {
  await button.trigger("click");
  await flushPromises();
}

async function clickAriaLabel(label) {
  const match = vButtons().find((button) => button.attributes("aria-label") === label);
  expect(match).toBeTruthy();
  await triggerButton(match);
}

async function clickButtonWithText(text) {
  const overlays = Array.from(document.querySelectorAll(".v-overlay--active"));
  const search = overlays.length
    ? [...overlays].reverse().flatMap((overlay) => {
        return vButtons().filter((button) => overlay.contains(button.element));
      })
    : vButtons();

  const exact = search.find((button) => buttonText(button) === text);
  const match = exact ?? search.find((button) => buttonText(button).includes(text));
  expect(match).toBeTruthy();
  await triggerButton(match);
}

async function clickListItem(text) {
  const items = wrapper.findAllComponents({ name: "VListItem" });
  const match = items.find((item) => item.text().includes(text));
  expect(match).toBeTruthy();
  await match.trigger("click");
  await flushPromises();
}

async function setField(label, value) {
  const field = wrapper.findAllComponents({ name: "VTextField" }).find((component) => {
    return component.props("label") === label;
  });
  expect(field).toBeTruthy();
  await field.setValue(value);
  await flushPromises();
}

async function openProfile() {
  await clickAriaLabel("Open profile");
}

async function openEditProfile() {
  await openProfile();
  await clickButtonWithText("Edit Profile");
}

async function mountMenuBar() {
  const mounted = await mountWithPlugins(
    {
      components: { MenuBar },
      template: "<v-app><MenuBar /></v-app>",
    },
    {
      attachTo: document.body,
    },
  );
  wrapper = mounted.wrapper;
  router = mounted.router;
  await flushPromises();
  return mounted;
}

describe("Feature 4 — User Profile Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Utils.setStore("user", sessionUser);
    UserServices.getUser.mockResolvedValue({ data: profile });
    UserServices.updateUser.mockResolvedValue({
      data: {
        ...profile,
        fName: "Janet",
        email: "jane@example.com",
        username: "janet",
      },
    });
    AuthServices.logoutUser.mockResolvedValue({ data: { message: "Signed out." } });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      await mountMenuBar();
      await openProfile();

      expect(document.body.textContent).toContain("Jane Doe");
      expect(document.body.textContent).toContain("jdoe");
      expect(document.body.textContent).toContain("jdoe@example.com");
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      await mountMenuBar();
      await openEditProfile();

      expect(document.body.textContent).toContain("Edit Profile");
      expect(wrapper.findAllComponents({ name: "VTextField" }).find((field) => field.props("label") === "First name").props("modelValue")).toBe("Jane");
      expect(wrapper.findAllComponents({ name: "VTextField" }).find((field) => field.props("label") === "Last name").props("modelValue")).toBe("Doe");
      expect(wrapper.findAllComponents({ name: "VTextField" }).find((field) => field.props("label") === "Email").props("modelValue")).toBe("jdoe@example.com");
      expect(wrapper.findAllComponents({ name: "VTextField" }).find((field) => field.props("label") === "Username").props("modelValue")).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      await mountMenuBar();
      await openEditProfile();
      await setField("First name", "Janet");
      await clickButtonWithText("Cancel");

      expect(UserServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user")).toEqual(sessionUser);
    });

    it("User saves profile changes", async () => {
      await mountMenuBar();
      await openEditProfile();
      await setField("First name", "Janet");
      await setField("Email", "jane@example.com");
      await setField("Username", "janet");
      await clickButtonWithText("Save");

      expect(UserServices.updateUser).toHaveBeenCalledWith(1, {
        fName: "Janet",
        lName: "Doe",
        email: "jane@example.com",
        username: "janet",
      });
      expect(Utils.getStore("user")).toMatchObject({
        userId: 1,
        fName: "Janet",
        email: "jane@example.com",
        username: "janet",
        token: "test-token",
      });

      await openProfile();
      expect(document.body.textContent).toContain("Janet Doe");
      expect(document.body.textContent).toContain("janet");
      expect(document.body.textContent).toContain("jane@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      await mountMenuBar();
      await openEditProfile();
      await setField("Email", "notanemail");
      await clickButtonWithText("Save");

      expect(document.body.textContent).toContain("Enter a valid email address.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      await mountMenuBar();
      await openEditProfile();
      await setField("New password", "password123");
      await setField("Confirm password", "password456");
      await clickButtonWithText("Save");

      expect(document.body.textContent).toContain("Passwords do not match.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      await mountMenuBar();
      await openEditProfile();
      await setField("New password", "short");
      await setField("Confirm password", "short");
      await clickButtonWithText("Save");

      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      UserServices.updateUser.mockRejectedValue({
        response: {
          status: 400,
          data: { message: "Username is already taken." },
        },
      });

      await mountMenuBar();
      await openEditProfile();
      await clickButtonWithText("Save");
      await flushPromises();

      const alert = wrapper.findComponent({ name: "VAlert" });
      expect(alert.exists() || !!document.querySelector(".v-alert")).toBe(true);
      expect((alert.exists() ? alert.text() : document.querySelector(".v-alert")?.textContent)).toContain("Username is already taken.");
      expect(wrapper.findComponent({ name: "VDialog" }).props("modelValue")).toBe(true);
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      await mountMenuBar();
      const pushSpy = vi.spyOn(router, "push");
      await openProfile();
      await clickListItem("Log out");
      await flushPromises();

      expect(AuthServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(pushSpy).toHaveBeenCalledWith({ name: "login" });
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      await mountMenuBar();

      const appBar = wrapper.find(".v-app-bar");
      expect(appBar.exists()).toBe(true);
      expect(appBar.text()).not.toContain("Sign out");
      expect(
        vButtons().some((button) => buttonText(button) === "Sign out"),
      ).toBe(false);
    });
  });
});
