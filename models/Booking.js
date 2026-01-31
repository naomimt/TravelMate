import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    arrivalDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "arrival_date",
    },
    arrivalTime: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "arrival_time",
    },
    departureDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "departure_date",
    },
    guests: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    contact: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    preferences: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    pricing: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    destination: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "confirmed", "cancelled"]],
      },
    },
  },
  {
    tableName: "bookings",
    timestamps: true,
    underscored: true,
  },
);

export default Booking;
