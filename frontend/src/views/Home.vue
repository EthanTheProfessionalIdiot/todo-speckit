<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Utils from "../config/utils.js";
import AuthServices from "../services/authServices.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user"));

async function signOut() {
  try {
    await AuthServices.logoutUser();
  } catch {
    // Clear the local session even if the API call fails.
  }
  Utils.removeItem("user");
  router.push({ name: "login" });
}
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-4">Welcome{{ user?.fName ? `, ${user.fName}` : "" }}</h1>
    <v-btn color="primary" variant="elevated" class="oc-cta" @click="signOut">
      Sign out
    </v-btn>
  </v-container>
</template>
