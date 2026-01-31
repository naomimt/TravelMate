import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Hero from "../components/Hero";
import "../styles/admin.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        if (activeTab === "bookings") {
          const response = await fetch("http://localhost:3000/api/admin/bookings", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setBookings(data.data);
        } else if (activeTab === "contacts") {
          const response = await fetch("http://localhost:3000/api/admin/contacts", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setContacts(data.data);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, [activeTab]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "confirmed":
        return "status-confirmed";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:3000/api/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      // Update local state
      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } catch (err) {
      alert(`Error updating booking status: ${err.message}`);
      console.error("Error updating status:", err);
    }
  };

  const calculateNights = (arrivalDate, departureDate) => {
    const start = new Date(arrivalDate);
    const end = new Date(departureDate);
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    return Number.isFinite(diff) && diff > 0 ? Math.round(diff) : 0;
  };

  return (
    <>
      <Hero 
        title="Admin Dashboard" 
        subtitle="Manage bookings and messages" 
        showButton={false}
        backgroundImage="/images/hero3.jpg"
        variant="short"
      />
      <section className="admin-section">
        <div className="admin-container">
          <div className="admin-header">
            <h2>Welcome, Admin {user?.name}</h2>
            <p>Total Bookings: {bookings.length} | Total Contacts: {contacts.length}</p>
          </div>

          <div className="admin-tabs">
            <button
              className={`tab-button ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              All Bookings
            </button>
            <button
              className={`tab-button ${activeTab === "contacts" ? "active" : ""}`}
              onClick={() => setActiveTab("contacts")}
            >
              Contact Messages
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : activeTab === "bookings" ? (
            <div className="admin-content">
              <h3>All Bookings</h3>
              {bookings.length === 0 ? (
                <p className="empty-text">No bookings found</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Guest Name</th>
                        <th>Email</th>
                        <th>Destination</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Nights</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>#{booking.id}</td>
                          <td>{booking.guests.primaryGuest}</td>
                          <td>{booking.user_email}</td>
                          <td>{booking.destination.name}</td>
                          <td>{formatDate(booking.arrivalDate)}</td>
                          <td>{formatDate(booking.departureDate)}</td>
                          <td>{calculateNights(booking.arrivalDate, booking.departureDate)}</td>
                          <td>${booking.pricing.total.toLocaleString()}</td>
                          <td>
                            <select
                              value={booking.status}
                              onChange={(e) =>
                                handleStatusChange(booking.id, e.target.value)
                              }
                              className={`status-select ${getStatusColor(booking.status)}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="btn-view"
                              onClick={() =>
                                alert(
                                  `Special Requests: ${
                                    booking.preferences.specialRequests || "None"
                                  }\n\nRoom Type: ${booking.preferences.roomType}\n\nGuests: ${booking.guests.total}`
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="admin-content">
              <h3>Contact Messages</h3>
              {contacts.length === 0 ? (
                <p className="empty-text">No contact messages found</p>
              ) : (
                <div className="contacts-grid">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="contact-message">
                      <div className="message-header">
                        <h4>{contact.name}</h4>
                        <small>{formatDate(contact.createdAt)}</small>
                      </div>
                      <p className="message-email">
                        <strong>Email:</strong> {contact.email}
                      </p>
                      <p className="message-subject">
                        <strong>Subject:</strong> {contact.message.substring(0, 100)}...
                      </p>
                      <p className="message-body">{contact.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default AdminDashboard;
