import apiClient from "./services.js";

export default {
  getUser(userId) {
    return apiClient.get(`users/${userId}`);
  },

  updateUser(userId, user) {
    const payload = {
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      username: user.username,
    };

    if (user.password) {
      payload.password = user.password;
    }

    return apiClient.put(`users/${userId}`, payload);
  },
};
