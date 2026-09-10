<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import AuthServices from "../services/authServices.js";

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const errorMessage = ref("");
const username = ref("");
const password = ref("");

const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [(value) => !!value?.trim() || "Password is required."];

async function signIn() {
  errorMessage.value = "";
  const { valid } = await form.value.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const res = await AuthServices.loginUser({
      username: username.value,
      password: password.value,
    });
    Utils.setStore("user", res.data);
    router.push({ name: "home" });
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || "Invalid username or password.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5 px-0 pt-0">Sign in</v-card-title>
          <v-alert v-if="errorMessage" type="error" class="mb-4">
            {{ errorMessage }}
          </v-alert>
          <v-form ref="form" @submit.prevent="signIn">
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
              autocomplete="current-password"
              class="mb-4"
              :rules="passwordRules"
            />
            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              class="oc-cta"
              block
              :loading="loading"
            >
              Sign in
            </v-btn>
          </v-form>
          <p class="text-body-2 mt-4 mb-0">
            Need an account?
            <router-link :to="{ name: 'register' }">Create account</router-link>
          </p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
