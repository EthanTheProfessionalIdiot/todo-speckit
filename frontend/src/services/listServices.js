import apiClient from "./services.js";

export default {
  getLists() {
    return apiClient.get("lists");
  },

  createList(list) {
    return apiClient.post("lists", {
      name: list.name,
    });
  },

  updateList(listId, list) {
    return apiClient.put(`lists/${listId}`, {
      name: list.name,
    });
  },

  deleteList(listId) {
    return apiClient.delete(`lists/${listId}`);
  },
};
