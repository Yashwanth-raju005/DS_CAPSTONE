const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

const PORT = 5000;

/* ---------------- MIDDLEWARE ---------------- */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(bodyParser.json());

app.use(
  session({
    secret: "hostel-system-secret-key-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

/* ---------------- DATA STORES ---------------- */
const complaints = [];
const messFeedbackCounts = { Good: 0, Average: 0, Poor: 0 };
const messFeedbackEntries = [];
const dailyFeedbackMap = new Map();

/* ---------------- USERS ---------------- */
const users = {
  student1: {
    username: "student1",
    password: "student123",
    role: "student",
    name: "Student One",
  },
  admin: {
    username: "admin",
    password: "admin123",
    role: "admin",
    name: "Admin",
  },
};

/* ---------------- AUTH ---------------- */
app.post("/api/login", (req, res) => {
  const { username, password, role } = req.body;
  const user = users[username];

  if (!user || user.password !== password || user.role !== role) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  req.session.userId = username;
  req.session.role = role;
  req.session.name = user.name;

  res.json({
    success: true,
    user: {
      username,
      role,
      name: user.name,
    },
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

/* 🔑 SESSION RESTORE (FIX REFRESH ISSUE) */
app.get("/api/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false });
  }

  res.json({
    success: true,
    user: {
      username: req.session.userId,
      role: req.session.role,
      name: req.session.name,
    },
  });
});

/* ---------------- SOCKET: COMPLAINTS ---------------- */
io.on("connection", (socket) => {
  socket.on("submitComplaint", (data) => {
    const complaint = {
      id: complaints.length + 1,
      userId: data.userId,
      roomNumber: data.roomNumber,
      category: data.category,
      description: data.description,
      status: "Pending",
      date: new Date().toISOString(),
    };

    complaints.push(complaint);

    socket.emit("complaintAcknowledgment", {
      success: true,
      message: "Complaint submitted successfully",
    });

    io.emit("newComplaint", complaint);
  });

  socket.on("getComplaints", () => {
    socket.emit("complaintsList", complaints);
  });
});

/* ---------------- COMPLAINT APIs ---------------- */
app.get("/api/complaints", (req, res) => {
  res.json({ success: true, complaints });
});

app.get("/api/complaints/stats", (req, res) => {
  res.json({
    success: true,
    stats: {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === "Pending").length,
      resolved: complaints.filter((c) => c.status === "Resolved").length,
    },
  });
});

app.put("/api/complaints/:id", (req, res) => {
  const complaint = complaints.find(
    (c) => Number(c.id) === Number(req.params.id)
  );

  if (!complaint) {
    return res.status(404).json({ success: false });
  }

  complaint.status = req.body.status;
  complaint.updatedAt = new Date().toISOString();

  io.emit("complaintUpdated", complaint);
  res.json({ success: true, complaint });
});

/* ---------------- MESS FEEDBACK (FIXED) ---------------- */
app.post("/api/mess-feedback", (req, res) => {
  const { feedback } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ success: false });
  }

  const today = new Date().toISOString().split("T")[0];
  const key = `${userId}_${today}`;
  const count = dailyFeedbackMap.get(key) || 0;

  if (count >= 3) {
    return res.status(429).json({
      success: false,
      message: "You can submit only 3 feedbacks per day",
    });
  }

  dailyFeedbackMap.set(key, count + 1);

  messFeedbackEntries.push({
    userId,
    type: feedback,
    date: new Date().toISOString(),
  });

  messFeedbackCounts[feedback]++;

  io.emit("feedbackUpdate", { counts: messFeedbackCounts });

  res.json({
    success: true,
    counts: messFeedbackCounts,
    remaining: 3 - (count + 1),
  });
});

app.get("/api/mess-feedback/stats", (req, res) => {
  const counts = { Good: 0, Average: 0, Poor: 0 };

  messFeedbackEntries.forEach((e) => {
    counts[e.type]++;
  });

  res.json({
    success: true,
    stats: {
      good: counts.Good,
      average: counts.Average,
      poor: counts.Poor,
      total: counts.Good + counts.Average + counts.Poor,
    },
  });
});

/* ---------------- START ---------------- */
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
