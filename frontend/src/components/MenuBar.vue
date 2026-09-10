<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import AuthServices from "../services/authServices.js";
import UserServices from "../services/userServices.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const user = ref(Utils.getStore("user"));
const profileMenu = ref(false);
const editDialog = ref(false);
const editForm = ref(null);
const saving = ref(false);
const errorMessage = ref("");

const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const firstNameRules = [(value) => !!value?.trim() || "First name is required."];
const lastNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === password.value || "Passwords do not match.",
];

const fullName = computed(() => {
  const current = user.value;
  if (!current) {
    return "";
  }

  return [current.fName, current.lName].filter(Boolean).join(" ");
});

function refreshUser() {
  user.value = Utils.getStore("user");
}

function persistUser(profile) {
  const current = Utils.getStore("user") || {};
  Utils.setStore("user", {
    ...current,
    userId: profile.id ?? current.userId,
    fName: profile.fName,
    lName: profile.lName,
    email: profile.email,
    username: profile.username,
    role: profile.role ?? current.role,
  });
  window.dispatchEvent(new CustomEvent("user-logged-in"));
  refreshUser();
}

async function openEditDialog() {
  profileMenu.value = false;
  errorMessage.value = "";
  password.value = "";
  confirmPassword.value = "";

  const current = Utils.getStore("user");
  fName.value = current?.fName || "";
  lName.value = current?.lName || "";
  email.value = current?.email || "";
  username.value = current?.username || "";
  editDialog.value = true;

  if (!current?.userId) {
    return;
  }

  try {
    const res = await UserServices.getUser(current.userId);
    fName.value = res.data.fName;
    lName.value = res.data.lName;
    email.value = res.data.email;
    username.value = res.data.username;
  } catch {
    // Prefill from the current session when the fetch fails.
  }
}

function closeEditDialog() {
  editDialog.value = false;
}

async function saveProfile() {
  errorMessage.value = "";
  const { valid } = await editForm.value.validate();
  if (!valid) {
    return;
  }

  const current = Utils.getStore("user");
  if (!current?.userId) {
    return;
  }

  saving.value = true;
  try {
    const payload = {
      fName: fName.value,
      lName: lName.value,
      email: email.value,
      username: username.value,
    };
    if (password.value) {
      payload.password = password.value;
    }

    const res = await UserServices.updateUser(current.userId, payload);
    persistUser(res.data);
    editDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Unable to update profile.";
  } finally {
    saving.value = false;
  }
}

async function logOut() {
  profileMenu.value = false;
  try {
    await AuthServices.logoutUser();
  } catch {
    // Clear the local session even if the API call fails.
  }
  Utils.removeItem("user");
  await router.push({ name: "login" });
}

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});
</script>

<template>
  <v-app-bar color="primary">
    <v-spacer />
    <v-menu v-model="profileMenu" location="bottom end">
      <template #activator="{ props }">
        <v-btn icon v-bind="props" aria-label="Open profile">
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </template>
      <v-card min-width="280">
        <v-list>
          <v-list-item :title="fullName">
            <template #subtitle>
              <div>{{ user?.username }}</div>
              <div>{{ user?.email }}</div>
            </template>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openEditDialog"
          >
            Edit Profile
          </v-btn>
        </v-card-actions>
        <v-list>
          <v-list-item title="Log out" @click="logOut" />
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editDialog" max-width="480" eager>
    <v-card>
      <v-card-item>
        <template #title>Edit Profile</template>
      </v-card-item>
      <v-card-text>
        <v-alert v-if="errorMessage" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-form ref="editForm" @submit.prevent="saveProfile">
          <v-text-field
            v-model="fName"
            label="First name"
            autocomplete="given-name"
            :rules="firstNameRules"
          />
          <v-text-field
            v-model="lName"
            label="Last name"
            autocomplete="family-name"
            :rules="lastNameRules"
          />
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            autocomplete="email"
            :rules="emailRules"
          />
          <v-text-field
            v-model="username"
            label="Username"
            autocomplete="username"
            :rules="usernameRules"
          />
          <v-text-field
            v-model="password"
            label="New password"
            type="password"
            autocomplete="new-password"
            :rules="passwordRules"
          />
          <v-text-field
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            autocomplete="new-password"
            :rules="confirmPasswordRules"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="closeEditDialog">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="saving"
          @click="saveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
