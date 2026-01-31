import http from "node:http";
import { parse } from "node:url";
import pg from "pg";
import dotenv from "dotenv";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config();

const { Client } = pg;
const routes = [];

const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function connectDB() {
  try {
    await dbClient.connect();
    console.log("Database connected");
    await initializeDatabase();
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
}

async function initializeDatabase() {
  const tables = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trips (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      duration VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      available_slots INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      trip_id INTEGER NOT NULL REFERENCES trips(id),
      booking_date DATE NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read BOOLEAN DEFAULT FALSE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
  `;

  try {
    await dbClient.query(tables);
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

// ============ AUTHENTICATION ENDPOINTS ============

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
    const existingUser = await dbClient.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return sendResponse(res, 400, {
        success: false,
        error: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await dbClient.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, "user"],
    );

    const user = result.rows[0];
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

    const result = await dbClient.query(
      "SELECT id, name, email, password, role FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      return sendResponse(res, 401, {
        success: false,
        error: "Invalid email or password",
      });
    }

    const user = result.rows[0];
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

// ============ TRIPS ENDPOINTS ============

// GET /api/trips - Get all trips
endpoint("GET", "/api/trips", async (req, res) => {
  try {
    const result = await dbClient.query(
      "SELECT id, title, price, duration, description, available_slots FROM trips ORDER BY created_at DESC",
    );

    sendResponse(res, 200, {
      success: true,
      data: result.rows,
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to retrieve trips",
    });
  }
});

// GET /api/trips/:id - Get single trip
endpoint("GET", "/api/trips/([0-9]+)", async (req, res, params) => {
  try {
    const result = await dbClient.query(
      "SELECT id, title, price, duration, description, available_slots FROM trips WHERE id = $1",
      [params[0]],
    );

    if (result.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: "Trip not found",
      });
    }

    sendResponse(res, 200, {
      success: true,
      data: result.rows[0],
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to retrieve trip",
    });
  }
});

// POST /api/trips - [ADMIN] Create a new trip
endpoint("POST", "/api/trips", async (req, res) => {
  try {
    if (!verifyAdminToken(req)) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - admin access required",
      });
    }

    const { title, price, duration, description, available_slots } =
      await parseJsonBody(req);

    if (
      !title ||
      !price ||
      !duration ||
      !description ||
      available_slots === undefined
    ) {
      return sendResponse(res, 400, {
        success: false,
        error:
          "Missing required fields: title, price, duration, description, available_slots",
      });
    }

    const result = await dbClient.query(
      "INSERT INTO trips (title, price, duration, description, available_slots) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, price, duration, description, available_slots",
      [title, price, duration, description, available_slots],
    );

    sendResponse(res, 201, {
      success: true,
      message: "Trip created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to create trip",
    });
  }
});

// PATCH /api/trips/:id - [ADMIN] Update trip
endpoint("PATCH", "/api/trips/([0-9]+)", async (req, res, params) => {
  try {
    if (!verifyAdminToken(req)) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - admin access required",
      });
    }

    const { title, price, duration, description, available_slots } =
      await parseJsonBody(req);

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramCount++}`);
      values.push(price);
    }
    if (duration !== undefined) {
      updates.push(`duration = $${paramCount++}`);
      values.push(duration);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (available_slots !== undefined) {
      updates.push(`available_slots = $${paramCount++}`);
      values.push(available_slots);
    }

    if (updates.length === 0) {
      return sendResponse(res, 400, {
        success: false,
        error: "No fields to update",
      });
    }

    values.push(params[0]);
    const query = `UPDATE trips SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING id, title, price, duration, description, available_slots`;

    const result = await dbClient.query(query, values);

    if (result.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: "Trip not found",
      });
    }

    sendResponse(res, 200, {
      success: true,
      message: "Trip updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to update trip",
    });
  }
});

// DELETE /api/trips/:id - [ADMIN] Delete trip
endpoint("DELETE", "/api/trips/([0-9]+)", async (req, res, params) => {
  try {
    if (!verifyAdminToken(req)) {
      return sendResponse(res, 401, {
        success: false,
        error: "Unauthorized - admin access required",
      });
    }

    const result = await dbClient.query(
      "DELETE FROM trips WHERE id = $1 RETURNING id",
      [params[0]],
    );

    if (result.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: "Trip not found",
      });
    }

    sendResponse(res, 204, {});
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to delete trip",
    });
  }
});

// ============ BOOKINGS ENDPOINTS ============

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

    const { trip_id, booking_date } = await parseJsonBody(req);

    if (!trip_id || !booking_date) {
      return sendResponse(res, 400, {
        success: false,
        error: "Missing required fields: trip_id, booking_date",
      });
    }

    // Check if trip exists and has available slots
    const tripResult = await dbClient.query(
      "SELECT available_slots FROM trips WHERE id = $1",
      [trip_id],
    );

    if (tripResult.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: "Trip not found",
      });
    }

    if (tripResult.rows[0].available_slots <= 0) {
      return sendResponse(res, 400, {
        success: false,
        error: "No available slots for this trip",
      });
    }

    // Create booking
    const bookingResult = await dbClient.query(
      "INSERT INTO bookings (user_id, trip_id, booking_date, status) VALUES ($1, $2, $3, $4) RETURNING id, user_id, trip_id, booking_date, status",
      [user.userId, trip_id, booking_date, "pending"],
    );

    // Decrease available slots
    await dbClient.query(
      "UPDATE trips SET available_slots = available_slots - 1 WHERE id = $1",
      [trip_id],
    );

    sendResponse(res, 201, {
      success: true,
      message: "Booking created successfully",
      data: bookingResult.rows[0],
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

    const result = await dbClient.query(
      `SELECT b.id, b.user_id, b.trip_id, b.booking_date, b.status, 
              t.title, t.price, t.duration, t.description
       FROM bookings b 
       JOIN trips t ON b.trip_id = t.id 
       WHERE b.user_id = $1 
       ORDER BY b.created_at DESC`,
      [user.userId],
    );

    sendResponse(res, 200, {
      success: true,
      data: result.rows,
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

    const result = await dbClient.query(
      `SELECT b.id, b.user_id, b.trip_id, b.booking_date, b.status, 
              t.title, t.price, t.duration, t.description
       FROM bookings b 
       JOIN trips t ON b.trip_id = t.id 
       WHERE b.id = $1 AND b.user_id = $2`,
      [params[0], user.userId],
    );

    if (result.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: "Booking not found",
      });
    }

    sendResponse(res, 200, {
      success: true,
      data: result.rows[0],
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

    const result = await dbClient.query(
      `SELECT b.id, b.user_id, b.trip_id, b.booking_date, b.status, 
              u.name, u.email, t.title, t.price
       FROM bookings b 
       JOIN users u ON b.user_id = u.id 
       JOIN trips t ON b.trip_id = t.id 
       ORDER BY b.created_at DESC`,
    );

    sendResponse(res, 200, {
      success: true,
      data: result.rows,
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

    // Get current booking to check if it needs slot adjustment
    const currentBooking = await dbClient.query(
      "SELECT trip_id, status FROM bookings WHERE id = $1",
      [params[0]],
    );

    if (currentBooking.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: "Booking not found",
      });
    }

    const oldStatus = currentBooking.rows[0].status;
    const tripId = currentBooking.rows[0].trip_id;

    // If changing from cancelled to another status, decrease slots
    if (oldStatus === "cancelled" && status !== "cancelled") {
      await dbClient.query(
        "UPDATE trips SET available_slots = available_slots - 1 WHERE id = $1",
        [tripId],
      );
    }
    // If changing to cancelled from another status, increase slots
    else if (oldStatus !== "cancelled" && status === "cancelled") {
      await dbClient.query(
        "UPDATE trips SET available_slots = available_slots + 1 WHERE id = $1",
        [tripId],
      );
    }

    const result = await dbClient.query(
      "UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, user_id, trip_id, booking_date, status",
      [status, params[0]],
    );

    sendResponse(res, 200, {
      success: true,
      message: "Booking status updated successfully",
      data: result.rows[0],
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

    // Get booking to verify ownership and get trip_id
    const booking = await dbClient.query(
      "SELECT user_id, trip_id, status FROM bookings WHERE id = $1",
      [params[0]],
    );

    if (booking.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: "Booking not found",
      });
    }

    if (booking.rows[0].user_id !== user.userId) {
      return sendResponse(res, 403, {
        success: false,
        error: "Forbidden - you can only delete your own bookings",
      });
    }

    // If booking is not cancelled, increase available slots
    if (booking.rows[0].status !== "cancelled") {
      await dbClient.query(
        "UPDATE trips SET available_slots = available_slots + 1 WHERE id = $1",
        [booking.rows[0].trip_id],
      );
    }

    await dbClient.query("DELETE FROM bookings WHERE id = $1", [params[0]]);

    sendResponse(res, 204, {});
  } catch (err) {
    sendResponse(res, 500, {
      success: false,
      error: "Failed to delete booking",
    });
  }
});

// ============ CONTACT FORM ENDPOINTS ============

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

    const result = await dbClient.query(
      "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING id, name, email, message, created_at",
      [name, email, message],
    );

    sendResponse(res, 201, {
      success: true,
      message: "Contact form submitted successfully",
      data: result.rows[0],
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

    const result = await dbClient.query(
      "SELECT id, name, email, message, created_at, read FROM contacts ORDER BY created_at DESC",
    );

    sendResponse(res, 200, {
      success: true,
      data: result.rows,
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

    const result = await dbClient.query(
      "SELECT id, name, email, message, created_at, read FROM contacts WHERE id = $1",
      [params[0]],
    );

    if (result.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: "Contact not found",
      });
    }

    sendResponse(res, 200, {
      success: true,
      data: result.rows[0],
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

      const result = await dbClient.query(
        "UPDATE contacts SET read = true WHERE id = $1 RETURNING id, name, email, message, created_at, read",
        [params[0]],
      );

      if (result.rows.length === 0) {
        return sendResponse(res, 404, {
          success: false,
          error: "Contact not found",
        });
      }

      sendResponse(res, 200, {
        success: true,
        data: result.rows[0],
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

    const result = await dbClient.query(
      "DELETE FROM contacts WHERE id = $1 RETURNING id",
      [params[0]],
    );

    if (result.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: "Contact not found",
      });
    }

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
