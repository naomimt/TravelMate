import React from "react";

const Footer = () => {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-about">
          <h3>TravelMate</h3>
          <p>Your trusted partner for unforgettable trips.</p>
        </div>

        <div className="footer-contact">
          <h4>Contact Us</h4>
          <p>
            Email:{" "}
            <a href="mailto:TravelMate@example.com">TravelMate@example.com</a>
          </p>
          <p>
            Phone: <a href="tel:+251973787561">+251-973787561</a>
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} TravelMate. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
