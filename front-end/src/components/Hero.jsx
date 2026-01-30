import React from "react";
import { Link } from "react-router-dom";

const Hero = ({
  title,
  subtitle,
  showButton = true,
  buttonText = "Explore Destinations",
  buttonTo = "/destinations",
  backgroundImage,
  variant = "tall",
  className = "",
}) => {
  const heroStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : undefined;

  return (
    <section
      className={`hero ${
        variant === "short" ? "hero--short" : "hero--tall"
      } ${className}`.trim()}
      style={heroStyle}
    >
      <div className="hero-inner">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {showButton && (
          <button className="btn-primary">
            <Link
              to={buttonTo}
              style={{ color: "inherit", textDecoration: "none" }}
            >
              {buttonText}
            </Link>
          </button>
        )}
      </div>
    </section>
  );
};

export default Hero;
