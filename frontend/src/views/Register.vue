<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import AuthServices from "../services/authServices.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
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
  (value) => !!value?.trim() || "Password is required.",
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === password.value || "Passwords do not match.",
];

async function createAccount() {
  errorMessage.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await AuthServices.registerUser({
      fName: fName.value,
      lName: lName.value,
      email: email.value,
      username: username.value,
      password: password.value,
    });
    Utils.setStore("user", res.data);
    router.push({ name: "home" });
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Unable to create account.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5 px-0 pt-0">Create account</v-card-title>
          <v-alert v-if="errorMessage" type="error" class="mb-4">
            {{ errorMessage }}
          </v-alert>
          <v-form ref="form" @submit.prevent="createAccount">
            <v-text-field
              v-model="fName"
              label="First name"
              autocomplete="given-name"
              class="mb-2"
              :rules="firstNameRules"
            />
            <v-text-field
              v-model="lName"
              label="Last name"
              autocomplete="family-name"
              class="mb-2"
              :rules="lastNameRules"
            />
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              autocomplete="email"
              class="mb-2"
              :rules="emailRules"
            />
            <v-text-field
              v-model="username"
              label="Username"
              autocomplete="username"
              class="mb-2"
              :rules="usernameRules"
            />
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              autocomplete="new-password"
              class="mb-2"
              :rules="passwordRules"
            />
            <v-text-field
              v-model="confirmPassword"
              label="Confirm password"
              type="password"
              autocomplete="new-password"
              class="mb-4"
              :rules="confirmPasswordRules"
            />
            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              class="oc-cta"
              block
              :loading="loading"
            >
              Create account
            </v-btn>
          </v-form>
          <p class="text-body-2 mt-4 mb-0">
            Already have an account?
            <router-link :to="{ name: 'login' }">Sign in</router-link>
          </p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
