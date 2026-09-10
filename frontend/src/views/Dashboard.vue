<script setup>
import { onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";

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

const nameRules = [(value) => !!value?.trim() || "List name is required."];

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
  </v-container>
</template>
