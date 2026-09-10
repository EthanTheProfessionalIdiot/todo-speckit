import apiClient from "./services.js";

export default {
  getTodos(listId) {
    return apiClient.get(`lists/${listId}/todos`);
  },

  createTodo(listId, todo) {
    const payload = { title: todo.title };
    if (todo.dueDate) {
      payload.dueDate = todo.dueDate;
    }
    return apiClient.post(`lists/${listId}/todos`, payload);
  },

  updateTodo(todoId, todo) {
    return apiClient.put(`todos/${todoId}`, todo);
  },

  deleteTodo(todoId) {
    return apiClient.delete(`todos/${todoId}`);
  },
};
