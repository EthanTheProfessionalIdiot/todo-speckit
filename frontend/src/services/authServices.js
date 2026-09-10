import apiClient from "./services.js";

export default {
  loginUser(user) {
    return apiClient.post("login", {
      username: user.username,
      password: user.password,
    });
  },

  logoutUser() {
    return apiClient.post("logout");
  },

  registerUser(user) {
    return apiClient.post("register", {
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      username: user.username,
      password: user.password,
    });
  },
};
