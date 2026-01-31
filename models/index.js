import User from "./User.js";
import Trip from "./Trip.js";
import Booking from "./Booking.js";
import Contact from "./Contact.js";
import sequelize from "../config/database.js";

// Define associations
User.hasMany(Booking, { foreignKey: "user_id" });
Booking.belongsTo(User, { foreignKey: "user_id" });

export { User, Trip, Booking, Contact, sequelize };
