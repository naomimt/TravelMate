import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
import Hero from "../components/Hero";
import "../styles/booking.css";

const defaultGroupNames = (count) =>
  Array.from({ length: Math.max(count, 0) }, () => "");

const Booking = () => {
  const navigate = useNavigate();
  const { destinationTitle } = useParams();
  // const { user } = useAuth();
  const destinationLabel = destinationTitle
    ? decodeURIComponent(destinationTitle)
    : "your destination";
  const destinationParam = destinationTitle || "custom";
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState({
    arrivalDate: "",
    arrivalTime: "",
    departureDate: "",
    numPeople: 1,
    numChildren: 0,
    leadName: "",
    companionNames: [],
    roomType: "standard",
    specialRequests: "",
    email: "",
    phone: "",
    acceptTerms: false,
  });

  const nights = useMemo(() => {
    if (!form.arrivalDate || !form.departureDate) return 0;
    const start = new Date(form.arrivalDate);
    const end = new Date(form.departureDate);
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    return Number.isFinite(diff) && diff > 0 ? Math.round(diff) : 0;
  }, [form.arrivalDate, form.departureDate]);

  const totalPrice = useMemo(() => {
    const baseAdult = 120;
    const childRate = 60;
    const adultCount = Math.max(form.numPeople - form.numChildren, 0);
    const perNight = adultCount * baseAdult + form.numChildren * childRate;
    return nights > 0 ? perNight * nights : 0;
  }, [form.numPeople, form.numChildren, nights]);

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => {
      if (field === "numPeople") {
        const nextPeople = Math.max(1, Number(value) || 1);
        const companionCount = Math.max(nextPeople - 1, 0);
        return {
          ...prev,
          numPeople: nextPeople,
          companionNames: defaultGroupNames(companionCount),
          numChildren: Math.min(prev.numChildren, nextPeople),
        };
      }
      if (field === "numChildren") {
        const nextChildren = Math.min(
          Math.max(Number(value) || 0, 0),
          prev.numPeople
        );
        return { ...prev, numChildren: nextChildren };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleCompanionChange = (index) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const updated = [...prev.companionNames];
      updated[index] = value;
      return { ...prev, companionNames: updated };
    });
  };

  const payload = useMemo(
    () => ({
      arrivalDate: form.arrivalDate,
      arrivalTime: form.arrivalTime,
      departureDate: form.departureDate,
      guests: {
        total: form.numPeople,
        childrenUnder5: form.numChildren,
        primaryGuest: form.leadName,
        companions: form.companionNames.filter(Boolean),
      },
      contact: {
        email: form.email,
        phone: form.phone,
      },
      preferences: {
        roomType: form.roomType,
        specialRequests: form.specialRequests,
      },
      pricing: {
        nights,
        currency: "USD",
        total: totalPrice,
      },
      destination: {
        name: destinationLabel,
        slug: destinationParam,
      },
      createdAt: new Date().toISOString(),
    }),
    [form, nights, totalPrice, destinationLabel, destinationParam]
  );

  const validate = () => {
    const nextErrors = {};

    if (!form.arrivalDate) nextErrors.arrivalDate = "Arrival date is required";
    if (!form.departureDate) nextErrors.departureDate = "Departure date is required";
    if (form.arrivalDate && form.departureDate && nights < 1) {
      nextErrors.departureDate = "Departure must be at least 1 day after arrival";
    }

    if (!form.leadName.trim()) nextErrors.leadName = "Primary guest name is required";

    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email";
    }

    if (form.phone && !/^[+\d\s().-]{7,}$/.test(form.phone.trim())) {
      nextErrors.phone = "Enter a valid phone number";
    }

    if (form.numPeople < 1) nextErrors.numPeople = "At least 1 guest required";
    if (form.numChildren > form.numPeople) {
      nextErrors.numChildren = "Children cannot exceed total guests";
    }

    if (!form.acceptTerms) nextErrors.acceptTerms = "Please accept the policies";

    return nextErrors;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:3000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setSuccessMessage("Booking submitted successfully!");
      
      // Navigate to confirmation page after a short delay
      setTimeout(() => {
        const encoded = encodeURIComponent(destinationParam);
        const targetPath = destinationTitle
          ? `/destination/${encoded}/booking/confirmation`
          : `/booking/confirmation`;

        navigate(targetPath, {
          state: {
            booking: payload,
            bookingId: data.data.id,
          },
        });
      }, 1500);
    } catch (err) {
      setErrors({ submit: err.message });
      console.error("Booking error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Hero
        title={`Booking for ${destinationLabel}`}
        subtitle="Reserve rooms, share traveler details, and lock in your rate."
        showButton={false}
        backgroundImage="/images/hero3.jpg"
        variant="short"
      />

      <section className="booking-section" aria-labelledby="booking-form-title">
        <div className="container">
          <div className="booking-grid">
            <div className="booking-card">
              <h2 id="booking-form-title">Book your hotel</h2>
              <p className="booking-subtitle">
                Share your trip window and guests. We&apos;ll forward the details to confirm your stay.
              </p>

              <form className="booking-form">
                {errors.submit && (
                  <div className="booking-error-message">{errors.submit}</div>
                )}
                {successMessage && (
                  <div className="booking-success-message">{successMessage}</div>
                )}

                <div className="field-pair">
                  <label htmlFor="arrivalDate">Arrival date</label>
                  <input
                    id="arrivalDate"
                    type="date"
                    value={form.arrivalDate}
                    onChange={handleChange("arrivalDate")}
                    required
                  />
                  {errors.arrivalDate && (
                    <span className="field-error">{errors.arrivalDate}</span>
                  )}
                </div>

                <div className="field-pair">
                  <label htmlFor="arrivalTime">Arrival time</label>
                  <input
                    id="arrivalTime"
                    type="time"
                    value={form.arrivalTime}
                    onChange={handleChange("arrivalTime")}
                  />
                </div>

                <div className="field-pair">
                  <label htmlFor="departureDate">Departure date</label>
                  <input
                    id="departureDate"
                    type="date"
                    value={form.departureDate}
                    onChange={handleChange("departureDate")}
                    required
                  />
                  {errors.departureDate && (
                    <span className="field-error">{errors.departureDate}</span>
                  )}
                </div>

                <div className="field-pair">
                  <label htmlFor="numPeople">Number of people</label>
                  <input
                    id="numPeople"
                    type="number"
                    min={1}
                    value={form.numPeople}
                    onChange={handleChange("numPeople")}
                    required
                  />
                  {errors.numPeople && (
                    <span className="field-error">{errors.numPeople}</span>
                  )}
                </div>

                {form.numPeople > 1 && (
                  <div className="field-pair">
                    <label htmlFor="numChildren">Children under 5</label>
                    <input
                      id="numChildren"
                      type="number"
                      min={0}
                      max={form.numPeople}
                      value={form.numChildren}
                      onChange={handleChange("numChildren")}
                    />
                    {errors.numChildren && (
                      <span className="field-error">{errors.numChildren}</span>
                    )}
                  </div>
                )}

                <div className="field-pair">
                  <label htmlFor="leadName">Full name (primary guest)</label>
                  <input
                    id="leadName"
                    type="text"
                    value={form.leadName}
                    onChange={handleChange("leadName")}
                    required
                  />
                  {errors.leadName && (
                    <span className="field-error">{errors.leadName}</span>
                  )}
                </div>

                {form.numPeople > 1 && (
                  <div className="companions">
                    <p className="section-label">
                      Full names of accompanying guests
                    </p>
                    {form.companionNames.map((name, index) => (
                      <input
                        key={index}
                        type="text"
                        placeholder={`Companion ${index + 1}`}
                        value={name}
                        onChange={handleCompanionChange(index)}
                      />
                    ))}
                  </div>
                )}

                <div className="field-pair">
                  <label htmlFor="roomType">Room preference</label>
                  <select
                    id="roomType"
                    value={form.roomType}
                    onChange={handleChange("roomType")}
                  >
                    <option value="standard">Standard</option>
                    <option value="deluxe">Deluxe</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>

                <div className="field-pair">
                  <label htmlFor="specialRequests">Special requests</label>
                  <textarea
                    id="specialRequests"
                    rows={3}
                    placeholder="Late check-in, accessibility needs, dietary notes..."
                    value={form.specialRequests}
                    onChange={handleChange("specialRequests")}
                  />
                </div>

                <div className="field-pair">
                  <label htmlFor="email">Contact email</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    required
                  />
                  {errors.email && (
                    <span className="field-error">{errors.email}</span>
                  )}
                </div>

                <div className="field-pair">
                  <label htmlFor="phone">Contact phone</label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <span className="field-error">{errors.phone}</span>
                  )}
                </div>

                <div className="summary">
                  {form.arrivalDate && form.departureDate ? (
                    <>
                      <div>
                        <p className="summary-label">Nights</p>
                        <strong>{nights}</strong>
                      </div>
                      <div>
                        <p className="summary-label">Total price (hotel)</p>
                        <strong>${totalPrice.toLocaleString()}</strong>
                      </div>
                    </>
                  ) : (
                    <p className="summary-placeholder">Select arrival and departure dates to calculate price</p>
                  )}
                </div>

                <label className="terms">
                  <input
                    type="checkbox"
                    checked={form.acceptTerms}
                    onChange={handleChange("acceptTerms")}
                  />
                  I confirm the details are correct and agree to the hotel
                  policies.
                  {errors.acceptTerms && (
                    <span className="field-error">{errors.acceptTerms}</span>
                  )}
                </label>

                <button
                  type="button"
                  className="btn-primary btn-extended"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Submitting booking..." : "Send booking"}
                </button>
              </form>
            </div>

            <div className="booking-card booking-card--info">
              <h3>What happens next?</h3>
              <p className="booking-subtitle">
                We’ll share these details with the hotel team so they can prepare your room and follow up if needed.
              </p>
              <ul className="info-list">
                <li>Keep your phone reachable for arrival coordination.</li>
                <li>Bring a valid ID matching the primary guest name.</li>
                <li>Special requests are subject to availability at check-in.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Booking;
