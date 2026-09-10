/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 * Feature 5 — Todo Due Date
 * Spec: features/feature-5-todo-due-date.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import TodoServices from "../src/services/todoServices.js";
import { formatDueDate } from "../src/config/validation.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 1 };
const work = { id: 2, name: "Work", userId: 1 };
const personal = { id: 3, name: "Personal", userId: 1 };
const buyMilk = { id: 10, listId: 1, title: "Buy milk", completed: false, userId: 1 };

let wrapper;

async function mountDashboard() {
  const mounted = await mountWithPlugins(Dashboard, {
    attachTo: document.body,
  });
  wrapper = mounted.wrapper;
  await flushPromises();
  return mounted;
}

function buttonText(button) {
  return (button.textContent ?? button.text?.() ?? "").replace(/\s+/g, " ").trim();
}

function activeOverlays() {
  return Array.from(document.querySelectorAll(".v-overlay--active"));
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
  if (match) {
    await triggerButton(match);
    return;
  }

  const element = document.querySelector(`[aria-label="${label}"]`);
  expect(element).toBeTruthy();
  const nested = vButtons().find((button) => button.element.contains(element));
  if (nested) {
    await triggerButton(nested);
    return;
  }

  element.click();
  await flushPromises();
}

async function clickButtonWithText(text) {
  const overlays = activeOverlays();
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

async function setVisibleListName(value) {
  const overlays = activeOverlays();
  const fields = wrapper.findAllComponents({ name: "VTextField" });
  let field;

  for (let i = overlays.length - 1; i >= 0; i -= 1) {
    field = fields.find((component) => overlays[i].contains(component.element));
    if (field) {
      break;
    }
  }

  expect(field).toBeTruthy();
  await field.setValue(value);
  await flushPromises();
}

async function setFieldByLabel(label, value) {
  const overlays = activeOverlays();
  const fields = wrapper.findAllComponents({ name: "VTextField" }).filter((component) => {
    return component.props("label") === label;
  });

  let field;
  for (let i = overlays.length - 1; i >= 0; i -= 1) {
    field = fields.find((component) => overlays[i].contains(component.element));
    if (field) {
      break;
    }
  }

  expect(field).toBeTruthy();
  await field.setValue(value);
  await flushPromises();
}

function yesterdayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    TodoServices.getTodos.mockResolvedValue({ data: [] });
    TodoServices.createTodo.mockResolvedValue({ data: buyMilk });
    TodoServices.updateTodo.mockResolvedValue({ data: { ...buyMilk, completed: true } });
    TodoServices.deleteTodo.mockResolvedValue({ data: { message: "deleted" } });
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

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [groceries] });
    ListServices.createList.mockResolvedValue({ data: groceries });
    ListServices.updateList.mockResolvedValue({ data: groceries });
    ListServices.deleteList.mockResolvedValue({ data: { message: "deleted" } });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
    TodoServices.createTodo.mockResolvedValue({ data: buyMilk });
    TodoServices.updateTodo.mockResolvedValue({ data: { ...buyMilk, title: "Buy oat milk" } });
    TodoServices.deleteTodo.mockResolvedValue({ data: { message: "deleted" } });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [buyMilk] });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");
      await clickButtonWithText("+ Add Item");
      await setVisibleListName("Buy milk");
      await clickButtonWithText("Add");

      expect(TodoServices.createTodo).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(document.body.textContent).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      await mountDashboard();
      await clickAriaLabel("View items for Groceries");
      await clickButtonWithText("+ Add Item");
      await clickButtonWithText("Add");

      expect(document.body.textContent).toContain("Todo title is required.");
      expect(TodoServices.createTodo).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      await mountDashboard();

      const listsCard = wrapper.find(".v-card");
      expect(listsCard.text()).toContain("My Lists");
      expect(listsCard.text()).not.toContain("+ Add Item");
      expect(activeOverlays()).toHaveLength(0);
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      ListServices.getLists.mockResolvedValue({ data: [personal] });
      TodoServices.getTodos.mockResolvedValue({ data: [] });

      await mountDashboard();
      await clickAriaLabel("View items for Personal");

      expect(document.body.textContent).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      ListServices.getLists.mockResolvedValue({ data: [work, personal] });
      TodoServices.getTodos.mockImplementation((listId) => {
        if (listId === personal.id) {
          return Promise.resolve({
            data: [{ id: 21, listId: 3, title: "Call mom", completed: false, userId: 1 }],
          });
        }
        return Promise.resolve({
          data: [
            { id: 22, listId: 2, title: "Email client", completed: false, userId: 1 },
            { id: 23, listId: 2, title: "Write report", completed: false, userId: 1 },
          ],
        });
      });

      await mountDashboard();
      await clickAriaLabel("View items for Personal");
      expect(document.body.textContent).toContain("Call mom");
      expect(document.body.textContent).not.toContain("Email client");

      await clickButtonWithText("Close");
      await clickAriaLabel("View items for Work");

      expect(document.body.textContent).toContain("Email client");
      expect(document.body.textContent).toContain("Write report");
      expect(document.body.textContent).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [{ ...buyMilk, completed: true }] });
      TodoServices.updateTodo.mockResolvedValue({ data: { ...buyMilk, completed: true } });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");

      const checkbox = document.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      await wrapper.findComponent({ name: "VCheckbox" }).vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: true });
      expect(document.body.querySelector(".text-decoration-line-through")).toBeTruthy();
    });

    it("User marks a completed todo as incomplete", async () => {
      const completedMilk = { ...buyMilk, completed: true };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [completedMilk] })
        .mockResolvedValueOnce({ data: [buyMilk] });
      TodoServices.updateTodo.mockResolvedValue({ data: buyMilk });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");

      await wrapper.findComponent({ name: "VCheckbox" }).vm.$emit("update:modelValue", false);
      await flushPromises();

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, { completed: false });
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [{ ...buyMilk, title: "Buy oat milk" }] });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");
      await clickAriaLabel("Edit todo");
      await setVisibleListName("Buy oat milk");
      await clickButtonWithText("Save");

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(document.body.textContent).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [] });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");
      await clickAriaLabel("Delete todo");
      await clickButtonWithText("Delete");

      expect(TodoServices.deleteTodo).toHaveBeenCalledWith(10);
      const itemsDialog = activeOverlays().find((overlay) => {
        return overlay.textContent.includes("Groceries — Items");
      });
      expect(itemsDialog).toBeTruthy();
      expect(itemsDialog.textContent).toContain("No todos in this list yet.");
      expect(itemsDialog.textContent).not.toContain("Buy milk");
    });
  });
});

describe("Feature 5 — Todo Due Date", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ListServices.getLists.mockResolvedValue({ data: [groceries] });
    TodoServices.getTodos.mockResolvedValue({ data: [] });
    TodoServices.createTodo.mockResolvedValue({
      data: { ...buyMilk, dueDate: "2026-07-15" },
    });
    TodoServices.updateTodo.mockResolvedValue({
      data: { ...buyMilk, dueDate: "2026-07-20" },
    });
    TodoServices.deleteTodo.mockResolvedValue({ data: { message: "deleted" } });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const datedMilk = { ...buyMilk, dueDate: "2026-07-15" };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [datedMilk] });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");
      await clickButtonWithText("+ Add Item");
      await setVisibleListName("Buy milk");
      await setFieldByLabel("Due date", "2026-07-15");
      await clickButtonWithText("Add");

      expect(TodoServices.createTodo).toHaveBeenCalledWith(1, {
        title: "Buy milk",
        dueDate: "2026-07-15",
      });
      expect(document.body.textContent).toContain(formatDueDate("2026-07-15"));
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [{ ...buyMilk, dueDate: "2026-07-20" }] });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");
      await clickAriaLabel("Edit todo");
      await setFieldByLabel("Due date", "2026-07-20");
      await clickButtonWithText("Save");

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(document.body.textContent).toContain(formatDueDate("2026-07-20"));
    });

    it("User clears a due date when editing a todo", async () => {
      const datedMilk = { ...buyMilk, dueDate: "2026-07-20" };
      TodoServices.getTodos
        .mockResolvedValueOnce({ data: [datedMilk] })
        .mockResolvedValueOnce({ data: [{ ...buyMilk, dueDate: null }] });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");
      await clickAriaLabel("Edit todo");
      await setFieldByLabel("Due date", "");
      await clickButtonWithText("Save");

      expect(TodoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: null,
      });
      expect(document.body.querySelector(".todo-due-date")).toBeNull();
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      const yesterday = yesterdayIso();
      TodoServices.getTodos.mockResolvedValue({
        data: [{ ...buyMilk, dueDate: yesterday, completed: false }],
      });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");

      const dueDate = document.body.querySelector(".todo-due-date");
      expect(dueDate).toBeTruthy();
      expect(dueDate.classList.contains("todo-due-overdue")).toBe(true);
      expect(dueDate.classList.contains("text-error")).toBe(true);
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      const yesterday = yesterdayIso();
      TodoServices.getTodos.mockResolvedValue({
        data: [{ ...buyMilk, dueDate: yesterday, completed: true }],
      });

      await mountDashboard();
      await clickAriaLabel("View items for Groceries");

      const dueDate = document.body.querySelector(".todo-due-date");
      expect(dueDate).toBeTruthy();
      expect(dueDate.classList.contains("todo-due-overdue")).toBe(false);
    });
  });
});
