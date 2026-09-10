/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 1 };
const work = { id: 2, name: "Work", userId: 1 };
const personal = { id: 3, name: "Personal", userId: 1 };

let wrapper;

async function mountDashboard() {
  const mounted = await mountWithPlugins(Dashboard, {
    attachTo: document.body,
  });
  wrapper = mounted.wrapper;
  await flushPromises();
  return mounted;
}

async function clickButtonWithText(text) {
  const activeOverlay = document.querySelector(".v-overlay--active");
  const overlayButton = activeOverlay
    ? Array.from(activeOverlay.querySelectorAll("button")).find((button) => {
        return button.textContent.includes(text);
      })
    : null;

  if (overlayButton) {
    overlayButton.click();
    await flushPromises();
    return;
  }

  const vueButton = wrapper.findAll("button").find((button) => {
    return button.text().includes(text);
  });
  if (vueButton) {
    await vueButton.trigger("click");
    await flushPromises();
    return;
  }

  const element = Array.from(document.querySelectorAll("button")).find((button) => {
    return button.textContent.includes(text);
  });
  expect(element).toBeTruthy();
  element.click();
  await flushPromises();
}

async function setVisibleListName(value) {
  const activeOverlay = document.querySelector(".v-overlay--active");
  const input = activeOverlay?.querySelector("input");
  expect(input).toBeTruthy();

  const field = wrapper.findAllComponents({ name: "VTextField" }).find((component) => {
    return component.element.contains(input);
  });
  if (field) {
    await field.setValue(value);
    await flushPromises();
    return;
  }

  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await flushPromises();
}

describe("Feature 2 — Todo List Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [] });
    ListServices.createList.mockResolvedValue({ data: groceries });
    ListServices.updateList.mockResolvedValue({
      data: { ...groceries, name: "Shopping" },
    });
    ListServices.deleteList.mockResolvedValue({ data: { message: "deleted" } });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [groceries] });

      await mountDashboard();
      await clickButtonWithText("+ New List");

      await setVisibleListName("Groceries");
      await clickButtonWithText("Create");

      expect(ListServices.createList).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
    });

    it("User creates a list with an empty name", async () => {
      await mountDashboard();
      await clickButtonWithText("+ New List");
      await clickButtonWithText("Create");

      expect(document.body.textContent).toContain("List name is required.");
      expect(ListServices.createList).not.toHaveBeenCalled();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      ListServices.getLists.mockResolvedValue({ data: [personal, work] });
      await mountDashboard();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.findAll('[aria-label="Edit list"]').length).toBe(2);
      expect(wrapper.findAll('[aria-label="Delete list"]').length).toBe(2);
    });

    it("User has no lists", async () => {
      ListServices.getLists.mockResolvedValue({ data: [] });
      await mountDashboard();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      ListServices.getLists.mockResolvedValue({ data: [groceries] });
      await mountDashboard();

      const row = wrapper.findAll(".v-list-item").find((item) => {
        return item.text().includes("Groceries");
      });
      expect(row.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(row.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [{ ...groceries, name: "Shopping" }] });

      await mountDashboard();
      await wrapper.get('[aria-label="Edit list"]').trigger("click");
      await flushPromises();

      await setVisibleListName("Shopping");
      await clickButtonWithText("Save");

      expect(ListServices.updateList).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      ListServices.getLists
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [] });

      await mountDashboard();
      await wrapper.get('[aria-label="Delete list"]').trigger("click");
      await flushPromises();

      await clickButtonWithText("Delete");

      expect(ListServices.deleteList).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Groceries");
    });
  });
});
