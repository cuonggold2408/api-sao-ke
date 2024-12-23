"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Storage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Storage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      url_image: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: "Storage",
      tableName: "storages",
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
  return Storage;
};
