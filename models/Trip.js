import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Trip = sequelize.define(
  "Trip",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    availableSlots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "available_slots",
    },
  },
  {
    tableName: "trips",
    timestamps: true,
    underscored: true,
  },
);

export default Trip;
