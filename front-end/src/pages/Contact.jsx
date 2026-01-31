import "../styles/contact.css";

const Contact = () => {
  return (
    <section className="contact-section">
      <div className="contact-container">
        <h2>Get in Touch with TravelMate</h2>
        <p>
          We&apos;d love to hear from you! Whether you have questions about a trip,
          need support, or just want to say hello, use the form below or our direct
          contact details.
        </p>

        <div className="contact-info">
          <div className="info-item">
            <h3>Email Us</h3>
            <p>
              <a href="mailto:TravelMate@example.com">TravelMate@example.com</a>
            </p>
          </div>
          <div className="info-item">
            <h3>Call Us</h3>
            <p>
              <a href="tel:+251973787561">+251-973787561</a>
            </p>
          </div>
          <div className="info-item">
            <h3>Visit Our Office</h3>
            <p>Haile G/sellaise Ave, Addis Ababa, Ethiopia</p>
          </div>
        </div>

        <form className="contact-form">
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" name="name" required />

          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" required />

          <label htmlFor="subject">Subject:</label>
          <input type="text" id="subject" name="subject" required />

          <label htmlFor="message">Message:</label>
          <textarea id="message" name="message" required></textarea>

          <button type="submit" className="btn-submit">
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
