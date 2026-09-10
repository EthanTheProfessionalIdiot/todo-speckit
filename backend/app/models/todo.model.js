export default (sequelize, Sequelize) => {
  const Todo = sequelize.define("todo", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    listId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    title: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    completed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      get() {
        const value = this.getDataValue("dueDate");
        return value ? String(value).slice(0, 10) : null;
      },
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
  });

  return Todo;
};
