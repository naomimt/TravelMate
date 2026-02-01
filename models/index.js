import User from "./User.js";
import Booking from "./Booking.js";
import Contact from "./Contact.js";
import sequelize from "../config/database.js";

// Define associations
User.hasMany(Booking, { foreignKey: "user_id" });
Booking.belongsTo(User, { foreignKey: "user_id" });

export { User, Booking, Contact, sequelize };
