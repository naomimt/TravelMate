import { useLocation, Link, useParams } from "react-router-dom";
import Hero from "../components/Hero";
import "../styles/booking.css";

const BookingConfirmation = () => {
  const { state } = useLocation();
  const booking = state?.booking;
  const { destinationTitle } = useParams();
  const destinationLabel = destinationTitle
    ? decodeURIComponent(destinationTitle)
    : booking?.destination?.name || "your destination";

  return (
    <>
      <Hero
        title="Booking confirmed"
        subtitle={
          booking
            ? "We saved your request. You can now forward it to the hotel team."
            : "No booking data found."
        }
        showButton={false}
        backgroundImage="/images/hero1.jpg"
        variant="short"
      />

      <section className="booking-section" aria-labelledby="confirmation-title">
        <div className="container">
          <div className="booking-card booking-card--preview">
            <h2 id="confirmation-title">Confirmation</h2>
            {!booking && (
              <p>
                Missing booking details. Please start again from the booking
                form.
              </p>
            )}
            {booking && (
              <>
                <p className="booking-subtitle">
                  Destination: {destinationLabel}
                </p>
                <div className="summary-grid">
                  <div>
                    <p className="summary-label">Arrival</p>
                    <strong>
                      {booking.arrivalDate} {booking.arrivalTime || ""}
                    </strong>
                  </div>
                  <div>
                    <p className="summary-label">Departure</p>
                    <strong>{booking.departureDate}</strong>
                  </div>
                  <div>
                    <p className="summary-label">Guests</p>
                    <strong>
                      {booking.guests.total} total ·{" "}
                      {booking.guests.childrenUnder5} under 5
                    </strong>
                  </div>
                  <div>
                    <p className="summary-label">Total price</p>
                    <strong>${booking.pricing.total.toLocaleString()}</strong>
                  </div>
                </div>

                <h4>Primary guest</h4>
                <p>{booking.guests.primaryGuest}</p>

                {booking.guests.companions?.length > 0 && (
                  <div>
                    <h4>Accompanying guests</h4>
                    <ul className="list">
                      {booking.guests.companions.map((name, idx) => (
                        <li key={idx}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <h4>Preferences</h4>
                <p>Room: {booking.preferences.roomType}</p>
                {booking.preferences.specialRequests && (
                  <p>Notes: {booking.preferences.specialRequests}</p>
                )}

                <h4>Contact</h4>
                <p>Email: {booking.contact.email}</p>
                {booking.contact.phone && <p>Phone: {booking.contact.phone}</p>}
              </>
            )}

            <div className="confirmation-actions">
              <Link className="btn-primary" to="/destinations">
                Make another booking
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BookingConfirmation;
