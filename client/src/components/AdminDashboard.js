import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import "./Dashboard.css";

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [complaintStats, setComplaintStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
  });
  const [complaints, setComplaints] = useState([]);
  const [messStats, setMessStats] = useState({
    good: 0,
    average: 0,
    poor: 0,
    total: 0,
  });
  const [healthStatus, setHealthStatus] = useState({
    modules: {
      socket: { status: "offline", connections: 0 },
      rest: { status: "offline" },
      sharedMemory: { status: "offline", totalFeedback: 0 },
      rmi: { status: "offline", roomsCount: 0 },
      p2p: { status: "offline" },
      session: { status: "offline", activeSessions: 0 },
    },
  });
  const [noticeForm, setNoticeForm] = useState({ title: "", message: "" });
  const [notices, setNotices] = useState([]);
  const [socket, setSocket] = useState(null);

  // Define loadData outside useEffect so it can be called from multiple places
  const loadData = async () => {
    try {
      console.log("Loading admin dashboard data...");
      const [
        complaintsRes,
        complaintsDetailRes,
        messRes,
        healthRes,
        noticesRes,
      ] = await Promise.all([
        axios.get("http://localhost:5000/api/complaints/stats", {
          withCredentials: true,
        }),
        axios.get("http://localhost:5000/api/complaints", {
          withCredentials: true,
        }),
        axios.get("http://localhost:5000/api/mess-feedback/stats", {
          withCredentials: true,
        }),
        axios.get("http://localhost:5000/api/health", {
          withCredentials: true,
        }),
        axios.get("http://localhost:5000/api/notices", {
          withCredentials: true,
        }),
      ]);

      console.log("API Responses:", {
        stats: complaintsRes.data,
        complaints: complaintsDetailRes.data,
        feedback: messRes.data,
        health: healthRes.data,
        notices: noticesRes.data,
      });

      // Set complaint stats and details
      if (complaintsRes.data && complaintsRes.data.success) {
        console.log("Setting complaint stats:", complaintsRes.data.stats);
        setComplaintStats(complaintsRes.data.stats);
      }
      if (complaintsDetailRes.data && complaintsDetailRes.data.success) {
        console.log("Setting complaints:", complaintsDetailRes.data.complaints);
        setComplaints(complaintsDetailRes.data.complaints);
      } else if (Array.isArray(complaintsDetailRes.data)) {
        console.log("Setting complaints from array:", complaintsDetailRes.data);
        setComplaints(complaintsDetailRes.data);
      }

      // Set feedback stats
      if (messRes.data && messRes.data.success) {
        console.log("Setting mess stats:", messRes.data.stats);
        setMessStats(messRes.data.stats);
      }

      // Set health status
      if (healthRes.data && healthRes.data.modules) {
        console.log("Setting health status:", healthRes.data);
        setHealthStatus({
          modules: healthRes.data.modules,
          timestamp: healthRes.data.timestamp,
        });
      }

      // Set notices
      if (Array.isArray(noticesRes.data)) {
        console.log("Setting notices:", noticesRes.data);
        setNotices(noticesRes.data);
      }
    } catch (err) {
      console.error("Error loading data:", err.message);
      console.error("Full error:", err);
      // Set empty defaults to show UI
      setComplaintStats({ total: 0, pending: 0, resolved: 0 });
      setMessStats({ good: 0, average: 0, poor: 0, total: 0 });
      setHealthStatus({
        modules: {
          socket: { status: "offline", connections: 0 },
          rest: { status: "offline" },
          sharedMemory: { status: "offline", totalFeedback: 0 },
          rmi: { status: "offline", roomsCount: 0 },
          p2p: { status: "offline" },
          session: { status: "offline", activeSessions: 0 },
        },
      });
      setNotices([]);
    }
  };

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Admin socket connected:", newSocket.id);
      // Request current complaints list from server via socket as a fallback
      newSocket.emit("getComplaints");
    });

    // Receive initial complaints list via socket
    newSocket.on("complaintsList", (list) => {
      console.log("Received complaintsList via socket:", list);
      if (Array.isArray(list)) {
        setComplaints(list);
        setComplaintStats({
          total: list.length,
          pending: list.filter((c) => c.status === "Pending").length,
          resolved: list.filter((c) => c.status === "Resolved").length,
        });
      }
    });

    // Listen for real-time complaint updates
    newSocket.on("newComplaint", (complaint) => {
      setComplaints((prev) => [complaint, ...prev]);
      // Update stats as well
      setComplaintStats((prev) => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
      }));
    });

    newSocket.on("complaintUpdated", (complaint) => {
  setComplaints((prev) =>
    prev.map((c) =>
      Number(c.id) === Number(complaint.id) ? complaint : c
    )
  );
});

    // Listen for real-time feedback updates
    newSocket.on("feedbackUpdate", (data) => {
      if (data.counts) {
        setMessStats((prev) => ({
          ...prev,
          good: data.counts.Good || 0,
          average: data.counts.Average || 0,
          poor: data.counts.Poor || 0,
          total:
            (data.counts.Good || 0) +
            (data.counts.Average || 0) +
            (data.counts.Poor || 0),
        }));
      }
    });

    loadData();
    const interval = setInterval(loadData, 5000);

    return () => {
      clearInterval(interval);
      newSocket.disconnect();
    };
  }, []);

  const handleAddNotice = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/notices", noticeForm, {
        withCredentials: true,
      });
      setNoticeForm({ title: "", message: "" });
      loadData();
    } catch (err) {
      console.error("Error adding notice:", err);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId, newStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/complaints/${complaintId}`,
        { status: newStatus },
        { withCredentials: true }
      );
      loadData();
    } catch (err) {
      console.error("Error updating complaint:", err);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🧑‍💼 Admin Dashboard</h1>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <div className="dashboard-nav">
        <button onClick={() => setActiveTab("overview")}>Overview</button>
        <button onClick={() => setActiveTab("complaints")}>Complaints</button>
        <button onClick={() => setActiveTab("notices")}>Notices</button>
        <button onClick={() => setActiveTab("feedback")}>Mess Feedback</button>
        <button onClick={() => setActiveTab("health")}>System Health</button>
      </div>

      <div className="dashboard-content">
        {activeTab === "overview" && (
          <div>
            <h2>📊 System Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{complaintStats?.total ?? 0}</h3>
                <p>Total Complaints</p>
              </div>

              <div className="stat-card">
                <h3>{messStats?.total ?? 0}</h3>
                <p>Total Feedback</p>
              </div>

              <div className="stat-card">
                <h3>{healthStatus?.modules?.socket?.connections ?? 0}</h3>
                <p>Socket Connections</p>
              </div>

              <div className="stat-card">
                <h3>{healthStatus?.modules?.session?.activeSessions ?? 0}</h3>
                <p>Active Sessions</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "complaints" && (
          <div>
            <h2>🔧 Complaint Management</h2>
            {complaintStats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>{complaintStats.total || 0}</h3>
                    <p>Total Complaints</p>
                  </div>
                  <div className="stat-card">
                    <h3>{complaintStats.pending ?? 0}</h3>
                    <p>Pending</p>
                  </div>
                  <div className="stat-card">
                    <h3>{complaintStats.resolved ?? 0}</h3>
                    <p>Resolved</p>
                  </div>
                </div>

                <h3>📋 All Complaints</h3>
                {complaints.length === 0 ? (
                  <p className="empty-message">No complaints yet</p>
                ) : (
                  <div className="complaints-list">
                    {complaints.map((complaint) => (
                      <div key={complaint.id} className="complaint-card">
                        <div className="complaint-header">
                          <h4>Room {complaint.roomNumber}</h4>
                          <span
                            className={`status-badge ${complaint.status.toLowerCase()}`}
                          >
                            {complaint.status}
                          </span>
                        </div>
                        <p>
                          <strong>Category:</strong> {complaint.category}
                        </p>
                        <p>
                          <strong>Description:</strong> {complaint.description}
                        </p>
                        <p>
                          <strong>From:</strong> {complaint.userId}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {new Date(complaint.date).toLocaleDateString()}
                        </p>
                        {complaint.status === "Pending" && (
                          <button
                            onClick={() =>
                              handleUpdateComplaintStatus(
                                complaint.id,
                                "Resolved"
                              )
                            }
                            className="action-btn"
                          >
                            Mark as Resolved
                          </button>
                        )}
                        {complaint.status === "Resolved" && (
                          <button
                            onClick={() =>
                              handleUpdateComplaintStatus(
                                complaint.id,
                                "Pending"
                              )
                            }
                            className="action-btn secondary"
                          >
                            Mark as Pending
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="empty-message">Loading complaints...</p>
            )}
          </div>
        )}

        {activeTab === "notices" && (
          <div>
            <h2>📢 Create & Manage Notices</h2>
            <form onSubmit={handleAddNotice} className="form-card">
              <div className="form-group">
                <label>Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g., Water Supply Maintenance"
                  value={noticeForm.title}
                  onChange={(e) =>
                    setNoticeForm({ ...noticeForm, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  placeholder="Enter the notice content..."
                  value={noticeForm.message}
                  onChange={(e) =>
                    setNoticeForm({ ...noticeForm, message: e.target.value })
                  }
                  rows="6"
                  required
                />
              </div>

              <button type="submit" className="submit-btn">
                Post Notice
              </button>
            </form>

            <h3>📋 Recent Notices</h3>
            {notices.length === 0 ? (
              <p className="empty-message">No notices posted yet</p>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="card">
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "feedback" && (
          <div>
            <h2>⭐ Mess Feedback Analysis</h2>
            {messStats ? (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>{messStats.good ?? 0}</h3>
                    <p>👍 Good Feedback</p>
                    {messStats.total > 0 && (
                      <p className="stat-percentage">
                        {((messStats.good / messStats.total) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <h3>{messStats.average ?? 0}</h3>
                    <p>👌 Average Feedback</p>
                    {messStats.total > 0 && (
                      <p className="stat-percentage">
                        {((messStats.average / messStats.total) * 100).toFixed(
                          1
                        )}
                        %
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <h3>{messStats.poor ?? 0}</h3>
                    <p>👎 Poor Feedback</p>
                    {messStats.total > 0 && (
                      <p className="stat-percentage">
                        {((messStats.poor / messStats.total) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                  <div className="stat-card">
                    <h3>{messStats.total ?? 0}</h3>
                    <p>Total Feedback</p>
                  </div>
                </div>

                <div className="feedback-chart">
                  <h3>Feedback Distribution</h3>
                  <div className="chart-bar">
                    <div
                      className="bar-segment good"
                      style={{
                        width: messStats.total
                          ? `${(messStats.good / messStats.total) * 100}%`
                          : "0%",
                      }}
                      title={`Good: ${messStats.good}`}
                    >
                      {messStats.total > 0 && (
                        <span className="bar-label">
                          {((messStats.good / messStats.total) * 100).toFixed(
                            0
                          )}
                          %
                        </span>
                      )}
                    </div>
                    <div
                      className="bar-segment average"
                      style={{
                        width: messStats.total
                          ? `${(messStats.average / messStats.total) * 100}%`
                          : "0%",
                      }}
                      title={`Average: ${messStats.average}`}
                    >
                      {messStats.total > 0 && (
                        <span className="bar-label">
                          {(
                            (messStats.average / messStats.total) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      )}
                    </div>
                    <div
                      className="bar-segment poor"
                      style={{
                        width: messStats.total
                          ? `${(messStats.poor / messStats.total) * 100}%`
                          : "0%",
                      }}
                      title={`Poor: ${messStats.poor}`}
                    >
                      {messStats.total > 0 && (
                        <span className="bar-label">
                          {((messStats.poor / messStats.total) * 100).toFixed(
                            0
                          )}
                          %
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <p className="info-text">
                    This data helps in monitoring mess quality and making
                    improvements based on student feedback.
                  </p>
                </div>
              </>
            ) : (
              <p className="empty-message">Loading feedback data...</p>
            )}
          </div>
        )}

        {activeTab === "health" && (
          <div>
            <h2>🏥 System Health Status</h2>
            {healthStatus?.modules ? (
              <div className="stats-grid">
                {Object.entries(healthStatus.modules).map(([key, val]) => (
                  <div key={key} className="stat-card">
                    <h3>{key.toUpperCase()}</h3>
                    <p>
                      Status: <strong>{val.status}</strong>
                    </p>
                    {val.connections !== undefined && (
                      <p>Connections: {val.connections}</p>
                    )}
                    {val.totalFeedback !== undefined && (
                      <p>Total Feedback: {val.totalFeedback}</p>
                    )}
                    {val.roomsCount !== undefined && (
                      <p>Rooms: {val.roomsCount}</p>
                    )}
                    {val.activeSessions !== undefined && (
                      <p>Sessions: {val.activeSessions}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">Loading system health...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
