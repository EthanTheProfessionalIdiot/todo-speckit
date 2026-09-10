<script setup>
import { onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";
import TodoServices from "../services/todoServices.js";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const renameDialog = ref(false);
const deleteDialog = ref(false);

const addForm = ref(null);
const renameForm = ref(null);
const newListName = ref("");
const renameListName = ref("");
const selectedList = ref(null);
const saving = ref(false);

const itemsDialog = ref(false);
const addItemDialog = ref(false);
const editItemDialog = ref(false);
const deleteTodoDialog = ref(false);
const todos = ref([]);
const todosLoading = ref(false);
const itemsError = ref("");
const addItemForm = ref(null);
const editItemForm = ref(null);
const newTodoTitle = ref("");
const editTodoTitle = ref("");
const selectedTodo = ref(null);
const savingTodo = ref(false);

const nameRules = [(value) => !!value?.trim() || "List name is required."];
const titleRules = [(value) => !!value?.trim() || "Todo title is required."];

async function loadLists() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await ListServices.getLists();
    lists.value = res.data;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Unable to load lists.";
  } finally {
    loading.value = false;
  }
}

function openAddDialog() {
  errorMessage.value = "";
  newListName.value = "";
  addDialog.value = true;
}

function openRenameDialog(list) {
  errorMessage.value = "";
  selectedList.value = list;
  renameListName.value = list.name;
  renameDialog.value = true;
}

function openDeleteDialog(list) {
  errorMessage.value = "";
  selectedList.value = list;
  deleteDialog.value = true;
}

async function createList() {
  const { valid } = await addForm.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  try {
    await ListServices.createList({ name: newListName.value.trim() });
    addDialog.value = false;
    await loadLists();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Unable to create list.";
  } finally {
    saving.value = false;
  }
}

async function renameList() {
  const { valid } = await renameForm.value.validate();
  if (!valid) {
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  try {
    await ListServices.updateList(selectedList.value.id, {
      name: renameListName.value.trim(),
    });
    renameDialog.value = false;
    await loadLists();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Unable to rename list.";
  } finally {
    saving.value = false;
  }
}

async function deleteList() {
  saving.value = true;
  errorMessage.value = "";
  try {
    await ListServices.deleteList(selectedList.value.id);
    deleteDialog.value = false;
    await loadLists();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Unable to delete list.";
  } finally {
    saving.value = false;
  }
}

async function loadTodos() {
  if (!selectedList.value) {
    return;
  }

  todosLoading.value = true;
  itemsError.value = "";
  try {
    const res = await TodoServices.getTodos(selectedList.value.id);
    todos.value = res.data;
  } catch (error) {
    itemsError.value = error.response?.data?.message || "Unable to load todos.";
  } finally {
    todosLoading.value = false;
  }
}

function openItemsDialog(list) {
  selectedList.value = list;
  itemsError.value = "";
  todos.value = [];
  itemsDialog.value = true;
  loadTodos();
}

function closeItemsDialog() {
  itemsDialog.value = false;
  addItemDialog.value = false;
  editItemDialog.value = false;
  deleteTodoDialog.value = false;
}

function openAddItemDialog() {
  itemsError.value = "";
  newTodoTitle.value = "";
  addItemDialog.value = true;
}

function openEditTodoDialog(todo) {
  itemsError.value = "";
  selectedTodo.value = todo;
  editTodoTitle.value = todo.title;
  editItemDialog.value = true;
}

function openDeleteTodoDialog(todo) {
  itemsError.value = "";
  selectedTodo.value = todo;
  deleteTodoDialog.value = true;
}

async function createTodo() {
  const { valid } = await addItemForm.value.validate();
  if (!valid) {
    return;
  }

  savingTodo.value = true;
  itemsError.value = "";
  try {
    await TodoServices.createTodo(selectedList.value.id, {
      title: newTodoTitle.value.trim(),
    });
    addItemDialog.value = false;
    await loadTodos();
  } catch (error) {
    itemsError.value = error.response?.data?.message || "Unable to create todo.";
  } finally {
    savingTodo.value = false;
  }
}

async function saveTodoTitle() {
  const { valid } = await editItemForm.value.validate();
  if (!valid) {
    return;
  }

  savingTodo.value = true;
  itemsError.value = "";
  try {
    await TodoServices.updateTodo(selectedTodo.value.id, {
      title: editTodoTitle.value.trim(),
    });
    editItemDialog.value = false;
    await loadTodos();
  } catch (error) {
    itemsError.value = error.response?.data?.message || "Unable to update todo.";
  } finally {
    savingTodo.value = false;
  }
}

async function toggleTodo(todo, completed) {
  itemsError.value = "";
  try {
    await TodoServices.updateTodo(todo.id, { completed });
    await loadTodos();
  } catch (error) {
    itemsError.value = error.response?.data?.message || "Unable to update todo.";
  }
}

async function deleteTodo() {
  savingTodo.value = true;
  itemsError.value = "";
  try {
    await TodoServices.deleteTodo(selectedTodo.value.id);
    deleteTodoDialog.value = false;
    await loadTodos();
  } catch (error) {
    itemsError.value = error.response?.data?.message || "Unable to delete todo.";
  } finally {
    savingTodo.value = false;
  }
}

onMounted(loadLists);
</script>

<template>
  <v-container class="py-8">
    <v-card>
      <v-card-item>
        <template #title>My Lists</template>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New List
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <p v-if="!loading && lists.length === 0" class="text-body-1">
          No lists yet. Create your first list.
        </p>
        <v-list v-else-if="!loading">
          <v-list-item v-for="list in lists" :key="list.id" :title="list.name">
            <template #append>
              <v-btn
                icon
                size="small"
                :aria-label="`View items for ${list.name}`"
                @click="openItemsDialog(list)"
              >
                <v-icon>mdi-format-list-bulleted</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                aria-label="Edit list"
                @click="openRenameDialog(list)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                aria-label="Delete list"
                @click="openDeleteDialog(list)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-model="addDialog" max-width="480" eager>
      <v-card>
        <v-card-item>
          <template #title>New List</template>
        </v-card-item>
        <v-card-text>
          <v-form ref="addForm" @submit.prevent="createList">
            <v-text-field
              v-model="newListName"
              label="List name"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="createList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameDialog" max-width="480" eager>
      <v-card>
        <v-card-item>
          <template #title>Rename List</template>
        </v-card-item>
        <v-card-text>
          <v-form ref="renameForm" @submit.prevent="renameList">
            <v-text-field
              v-model="renameListName"
              label="List name"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="renameDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="renameList"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480" eager>
      <v-card>
        <v-card-item>
          <template #title>Delete List</template>
        </v-card-item>
        <v-card-text>
          Delete {{ selectedList?.name }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="saving"
            @click="deleteList"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="itemsDialog" max-width="640" eager>
      <v-card>
        <v-card-item>
          <template #title>{{ selectedList?.name }} — Items</template>
          <template #append>
            <v-btn
              color="primary"
              variant="elevated"
              class="oc-cta"
              @click="openAddItemDialog"
            >
              + Add Item
            </v-btn>
          </template>
        </v-card-item>
        <v-card-text>
          <v-progress-linear v-if="todosLoading" indeterminate class="mb-4" />
          <v-alert v-if="itemsError" type="error" class="mb-4">
            {{ itemsError }}
          </v-alert>
          <p v-if="!todosLoading && todos.length === 0" class="text-body-1">
            No todos in this list yet.
          </p>
          <v-list v-else-if="!todosLoading">
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox
                  hide-details
                  :model-value="todo.completed"
                  :aria-label="`Toggle ${todo.title}`"
                  @update:model-value="toggleTodo(todo, $event)"
                />
              </template>
              <v-list-item-title :class="{ 'text-decoration-line-through text-medium-emphasis': todo.completed }">
                {{ todo.title }}
              </v-list-item-title>
              <template #append>
                <v-btn
                  icon
                  size="small"
                  aria-label="Edit todo"
                  @click="openEditTodoDialog(todo)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  size="small"
                  aria-label="Delete todo"
                  @click="openDeleteTodoDialog(todo)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="closeItemsDialog">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addItemDialog" max-width="480" eager>
      <v-card>
        <v-card-item>
          <template #title>Add Item</template>
        </v-card-item>
        <v-card-text>
          <v-form ref="addItemForm" @submit.prevent="createTodo">
            <v-text-field
              v-model="newTodoTitle"
              label="Todo title"
              :rules="titleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addItemDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingTodo"
            @click="createTodo"
          >
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editItemDialog" max-width="480" eager>
      <v-card>
        <v-card-item>
          <template #title>Edit Item</template>
        </v-card-item>
        <v-card-text>
          <v-form ref="editItemForm" @submit.prevent="saveTodoTitle">
            <v-text-field
              v-model="editTodoTitle"
              label="Todo title"
              :rules="titleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editItemDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingTodo"
            @click="saveTodoTitle"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteTodoDialog" max-width="480" eager>
      <v-card>
        <v-card-item>
          <template #title>Delete Item</template>
        </v-card-item>
        <v-card-text>
          Delete {{ selectedTodo?.title }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteTodoDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            :loading="savingTodo"
            @click="deleteTodo"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
