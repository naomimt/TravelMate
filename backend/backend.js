import http from "node:http";
import { parse } from "node:url";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User, Booking, Contact, sequelize } from "../models/index.js";

dotenv.config();

const routes = [];

async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("Database connected");
    await initializeDatabase();
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

async function initializeDatabase() {
  try {
    await sequelize.sync({ alter: false });
    console.log("Database tables initialized");
  } catch (err) {
    console.error("Database initialization failed:", err.message);
  }
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      if (!body) return resolve(null);

      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });

    req.on("error", (err) => {
      reject(err);
    });
  });
}

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

// Verify JWT token and return user data
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret-key");
    return decoded;
  } catch (err) {
    return null;
  }
}

// Verify JWT token and check for admin role
function verifyAdminToken(req) {
  const user = verifyToken(req);
  return user && user.role === "admin";
}

// Generate JWT token
function generateToken(userId, email, role) {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || "secret-key",
    { expiresIn: "7d" },
  );
}

function endpoint(method, path, handler) {
  routes.push({ method, path, handler, regex: new RegExp(`^${path}$`) });
}

// POST /api/auth/register - Register a new user
endpoint("POST", "/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = await parseJsonBody(req);

    if (!name || !email || !password) {
      return sendResponse(res, 400, {
        success: false,
        error: "Missing required fields: name, email, password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return sendResponse(res, 400, {
        success: false,
        error: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    const token = generateToken(user.id, user.email, user.role);

    sendResponse(res, 201, {
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to register user",
    });
  }
});

// POST /api/auth/login - Login user
endpoint("POST", "/api/auth/login", async (req, res) => {
  try {
    const { email, password } = await parseJsonBody(req);

    if (!email || !password) {
      return sendResponse(res, 400, {
        success: false,
        error: "Missing required fields: email, password",
      });
    }
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return sendResponse(res, 401, {
        success: false,
        error: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return sendResponse(res, 401, {
        success: false,
        error: "Invalid email or password",
      });
    }

    const token = generateToken(user.id, user.email, user.role);

    sendResponse(res, 200, {
      success: true,
      message: "Login successful",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to login",
    });
  }
});

// POST /api/bookings - Create a new booking
endpoint("POST", "/api/bookings", async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - login required",
      });
    }

    const {
      arrivalDate,
      arrivalTime,
      departureDate,
      guests,
      contact,
      preferences,
      pricing,
      destination,
    } = await parseJsonBody(req);

    if (!destination || !contact) {
      return sendResponse(res, 400, {
        success: false,
        error: "Missing required fields: destination, contact",
      });
    }

    const booking = await Booking.create({
      userId: user.userId,
      arrivalDate,
      arrivalTime,
      departureDate,
      guests,
      contact,
      preferences,
      pricing,
      destination,
      status: "pending",
    });

    sendResponse(res, 201, {
      success: true,
      message: "Booking created successfully",
      data: {
        id: booking.id,
        user_id: booking.userId,
        arrivalDate: booking.arrivalDate,
        arrivalTime: booking.arrivalTime,
        departureDate: booking.departureDate,
        guests: booking.guests,
        contact: booking.contact,
        preferences: booking.preferences,
        pricing: booking.pricing,
        destination: booking.destination,
        createdAt: booking.createdAt,
        status: booking.status,
      },
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to create booking",
    });
  }
});

// GET /api/bookings - Get user's bookings
endpoint("GET", "/api/bookings", async (req, res) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - login required",
      });
    }

    const bookings = await Booking.findAll({
      where: { userId: user.userId },
      order: [["createdAt", "DESC"]],
    });

    const formattedBookings = bookings.map((b) => ({
      id: b.id,
      user_id: b.userId,
      arrivalDate: b.arrivalDate,
      arrivalTime: b.arrivalTime,
      departureDate: b.departureDate,
      guests: b.guests,
      contact: b.contact,
      preferences: b.preferences,
      pricing: b.pricing,
      destination: b.destination,
      createdAt: b.createdAt,
      status: b.status,
    }));

    sendResponse(res, 200, {
      success: true,
      data: formattedBookings,
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to retrieve bookings",
    });
  }
});

// GET /api/bookings/:id - Get single booking details
endpoint("GET", "/api/bookings/([0-9]+)", async (req, res, params) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - login required",
      });
    }

    const booking = await Booking.findOne({
      where: { id: params[0], userId: user.userId },
    });

    if (!booking) {
      return sendResponse(res, 404, {
        success: false,
        error: "Booking not found",
      });
    }

    sendResponse(res, 200, {
      success: true,
      data: {
        id: booking.id,
        user_id: booking.userId,
        arrivalDate: booking.arrivalDate,
        arrivalTime: booking.arrivalTime,
        departureDate: booking.departureDate,
        guests: booking.guests,
        contact: booking.contact,
        preferences: booking.preferences,
        pricing: booking.pricing,
        destination: booking.destination,
        createdAt: booking.createdAt,
        status: booking.status,
      },
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to retrieve booking",
    });
  }
});

// GET /api/admin/bookings - [ADMIN] Get all bookings
endpoint("GET", "/api/admin/bookings", async (req, res) => {
  try {
    if (!verifyAdminToken(req)) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - admin access required",
      });
    }

    const bookings = await Booking.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
          required: true,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const formattedBookings = bookings.map((b) => ({
      id: b.id,
      user_id: b.userId,
      arrivalDate: b.arrivalDate,
      arrivalTime: b.arrivalTime,
      departureDate: b.departureDate,
      guests: b.guests,
      contact: b.contact,
      preferences: b.preferences,
      pricing: b.pricing,
      destination: b.destination,
      createdAt: b.createdAt,
      status: b.status,

      user_name: b.User?.name ?? "Deleted user",
      user_email: b.User?.email ?? "N/A",
    }));

    sendResponse(res, 200, {
      success: true,
      data: formattedBookings,
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to retrieve bookings",
    });
  }
});

// PATCH /api/bookings/:id/status - [ADMIN] Update booking status
endpoint("PATCH", "/api/bookings/([0-9]+)/status", async (req, res, params) => {
  try {
    if (!verifyAdminToken(req)) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - admin access required",
      });
    }

    const { status } = await parseJsonBody(req);
    const validStatuses = ["pending", "confirmed", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return sendResponse(res, 400, {
        success: false,
        error: "Invalid status. Must be one of: pending, confirmed, cancelled",
      });
    }

    const booking = await Booking.findByPk(params[0]);

    if (!booking) {
      return sendResponse(res, 404, {
        success: false,
        error: "Booking not found",
      });
    }

    booking.status = status;
    await booking.save();

    sendResponse(res, 200, {
      success: true,
      message: "Booking status updated successfully",
      data: {
        id: booking.id,
        user_id: booking.userId,
        arrivalDate: booking.arrivalDate,
        arrivalTime: booking.arrivalTime,
        departureDate: booking.departureDate,
        guests: booking.guests,
        contact: booking.contact,
        preferences: booking.preferences,
        pricing: booking.pricing,
        destination: booking.destination,
        createdAt: booking.createdAt,
        status: booking.status,
      },
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to update booking status",
    });
  }
});

// DELETE /api/bookings/:id - Delete booking
endpoint("DELETE", "/api/bookings/([0-9]+)", async (req, res, params) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - login required",
      });
    }

    const booking = await Booking.findByPk(params[0]);

    if (!booking) {
      return sendResponse(res, 404, {
        success: false,
        error: "Booking not found",
      });
    }

    if (booking.userId !== user.userId) {
      return sendResponse(res, 403, {
        success: false,
        error: "Forbidden - you can only delete your own bookings",
      });
    }

    await booking.destroy();

    sendResponse(res, 204, {});
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to delete booking",
    });
  }
});

// PUT /api/bookings/:id - Update booking status
endpoint("PUT", "/api/bookings/([0-9]+)", async (req, res, params) => {
  try {
    const user = verifyToken(req);
    if (!user) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - login required",
      });
    }

    const booking = await Booking.findByPk(params[0]);

    if (!booking) {
      return sendResponse(res, 404, {
        success: false,
        error: "Booking not found",
      });
    }

    if (booking.userId !== user.userId) {
      return sendResponse(res, 403, {
        success: false,
        error: "Forbidden - you can only update your own bookings",
      });
    }

    const { status } = await parseJsonBody(req);

    if (!status) {
      return sendResponse(res, 400, {
        success: false,
        error: "Missing required field: status",
      });
    }

    await booking.update({ status });

    sendResponse(res, 200, {
      success: true,
      message: "Booking updated successfully",
      data: {
        id: booking.id,
        user_id: booking.userId,
        status: booking.status,
      },
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to update booking",
    });
  }
});

// POST /api/contacts - Submit contact form
endpoint("POST", "/api/contacts", async (req, res) => {
  try {
    const { name, email, message } = await parseJsonBody(req);

    if (!name || !email || !message) {
      return sendResponse(res, 400, {
        success: false,
        error: "Missing required fields: name, email, message",
      });
    }

    const contact = await Contact.create({
      name,
      email,
      message,
    });

    sendResponse(res, 201, {
      success: true,
      message: "Contact form submitted successfully",
      data: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        message: contact.message,
        created_at: contact.createdAt,
      },
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to submit contact form",
    });
  }
});

// GET /api/admin/contacts - [ADMIN] Get all contact messages
endpoint("GET", "/api/admin/contacts", async (req, res) => {
  try {
    if (!verifyAdminToken(req)) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - admin access required",
      });
    }

    const contacts = await Contact.findAll({
      attributes: ["id", "name", "email", "message", "createdAt", "read"],
      order: [["createdAt", "DESC"]],
    });

    sendResponse(res, 200, {
      success: true,
      data: contacts,
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to retrieve contacts",
    });
  }
});

// GET /api/admin/contacts/:id - [ADMIN] Get single contact
endpoint("GET", "/api/admin/contacts/([0-9]+)", async (req, res, params) => {
  try {
    if (!verifyAdminToken(req)) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - admin access required",
      });
    }

    const contact = await Contact.findByPk(params[0], {
      attributes: ["id", "name", "email", "message", "createdAt", "read"],
    });

    if (!contact) {
      return sendResponse(res, 404, {
        success: false,
        error: "Contact not found",
      });
    }

    sendResponse(res, 200, {
      success: true,
      data: contact,
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to retrieve contact",
    });
  }
});

// PATCH /api/admin/contacts/:id/read - [ADMIN] Mark contact as read
endpoint(
  "PATCH",
  "/api/admin/contacts/([0-9]+)/read",
  async (req, res, params) => {
    try {
      if (!verifyAdminToken(req)) {
        return sendResponse(res, 401, {
          success: false,
          error: "Unauthorized - admin access required",
        });
      }

      const contact = await Contact.findByPk(params[0]);

      if (!contact) {
        return sendResponse(res, 404, {
          success: false,
          error: "Contact not found",
        });
      }

      contact.read = true;
      await contact.save();

      sendResponse(res, 200, {
        success: true,
        data: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          message: contact.message,
          createdAt: contact.createdAt,
          read: contact.read,
        },
      });
    } catch (err) {
      sendResponse(res, 500, {
        success: false,
        error: "Failed to update contact",
      });
    }
  },
);

// DELETE /api/admin/contacts/:id - [ADMIN] Delete contact
endpoint("DELETE", "/api/admin/contacts/([0-9]+)", async (req, res, params) => {
  try {
    if (!verifyAdminToken(req)) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - admin access required",
      });
    }

    const contact = await Contact.findByPk(params[0]);

    if (!contact) {
      return sendResponse(res, 404, {
        success: false,
        error: "Contact not found",
      });
    }

    await contact.destroy();

    sendResponse(res, 204, {});
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to delete contact",
    });
  }
});

const server = http.createServer(async (req, res) => {
  const url = parse(req.url, true);
  const pathname = url.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }

  for (const route of routes) {
    const match = pathname.match(route.regex);
    if (match && route.method === method) {
      const params = match.slice(1);
      try {
        return await route.handler(req, res, params);
      } catch (err) {
        sendResponse(res, 500, {
          success: false,
          error: err.message,
        });
        return;
      }
    }
  }

  sendResponse(res, 404, {
    success: false,
    error: "Endpoint not found",
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
