import { useEffect, useState } from "react";
// import { useAuth } from "../contexts/AuthContext";
import Hero from "../components/Hero";
import "../styles/mybookings.css";

const MyBookings = () => {
  //   const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:3000/api/bookings", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch bookings");
        }

        setBookings(data.data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching bookings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

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

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateNights = (arrivalDate, departureDate) => {
    const start = new Date(arrivalDate);
    const end = new Date(departureDate);
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    return Number.isFinite(diff) && diff > 0 ? Math.round(diff) : 0;
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:3000/api/bookings/${bookingId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete booking");
      }

      // Remove booking from list
      setBookings(bookings.filter((b) => b.id !== bookingId));
    } catch (err) {
      alert(`Error deleting booking: ${err.message}`);
      console.error("Error deleting booking:", err);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this booking? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:3000/api/bookings/${bookingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: "cancelled" }),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel booking");
      }

      // Update booking status in list
      setBookings(
        bookings.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" } : b,
        ),
      );
    } catch (err) {
      alert(`Error cancelling booking: ${err.message}`);
      console.error("Error cancelling booking:", err);
    }
  };

  return (
    <>
      <Hero
        title="My Bookings"
        subtitle="View and manage your travel bookings"
        showButton={false}
        backgroundImage="/images/hero3.jpg"
        variant="short"
      />
      <section className="mybookings-section">
        <div className="container">
          {loading ? (
            <div className="loading">Loading your bookings...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <h3>No bookings yet</h3>
              <p>
                Start planning your next adventure by booking a destination!
              </p>
            </div>
          ) : (
            <div className="bookings-grid">
              {bookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-card-header">
                    <h3>{booking.destination.name}</h3>
                    <span
                      className={`booking-status ${getStatusColor(booking.status)}`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="booking-dates">
                    <div className="date-item">
                      <span className="date-label">Check-in</span>
                      <span className="date-value">
                        {formatDate(booking.arrivalDate)}
                      </span>
                      {booking.arrivalTime && (
                        <span className="time-value">
                          {booking.arrivalTime}
                        </span>
                      )}
                    </div>
                    <div className="date-item">
                      <span className="date-label">Check-out</span>
                      <span className="date-value">
                        {formatDate(booking.departureDate)}
                      </span>
                    </div>
                  </div>

                  <div className="booking-details">
                    <div className="detail-row">
                      <span className="detail-label">Guests:</span>
                      <span className="detail-value">
                        {booking.guests.total}{" "}
                        {booking.guests.total === 1 ? "guest" : "guests"}
                        {booking.guests.childrenUnder5 > 0 &&
                          ` (${booking.guests.childrenUnder5} children)`}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Room type:</span>
                      <span className="detail-value">
                        {booking.preferences.roomType.charAt(0).toUpperCase() +
                          booking.preferences.roomType.slice(1)}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Nights:</span>
                      <span className="detail-value">
                        {calculateNights(
                          booking.arrivalDate,
                          booking.departureDate,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="booking-pricing">
                    <div className="price-label">Total Price</div>
                    <div className="price-amount">
                      {booking.pricing.currency} $
                      {booking.pricing.total.toLocaleString()}
                    </div>
                  </div>

                  <div className="booking-contact">
                    <p>
                      <strong>Primary Guest:</strong>{" "}
                      {booking.guests.primaryGuest}
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${booking.contact.email}`}>
                        {booking.contact.email}
                      </a>
                    </p>
                    {booking.contact.phone && (
                      <p>
                        <strong>Phone:</strong>{" "}
                        <a href={`tel:${booking.contact.phone}`}>
                          {booking.contact.phone}
                        </a>
                      </p>
                    )}
                  </div>

                  {booking.preferences.specialRequests && (
                    <div className="booking-notes">
                      <strong>Special Requests:</strong>
                      <p>{booking.preferences.specialRequests}</p>
                    </div>
                  )}

                  <div className="booking-meta">
                    <small>Booking ID: {booking.id}</small>
                    <small>Booked on: {formatDate(booking.createdAt)}</small>
                  </div>

                  {booking.status !== "cancelled" && (
                    <div className="booking-actions">
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="btn-cancel"
                      >
                        Cancel Booking
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(booking.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default MyBookings;
