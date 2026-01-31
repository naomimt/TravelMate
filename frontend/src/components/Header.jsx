import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/header.css";

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path) =>
    location.pathname === path ? { color: "lightcoral" } : {};

  const handleLogout = () => {
    logout();
  };

  return (
    <header>
      <div id="logo">TravelMate</div>
      <nav>
        <ul>
          <li>
            <Link to="/" style={isActive("/")}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/destinations" style={isActive("/destinations")}>
              Destinations
            </Link>
          </li>
          <li>
            <Link to="/contact" style={isActive("/contact")}>
              Contact
            </Link>
          </li>
          {user && (
            <li>
              <Link to="/my-bookings" style={isActive("/my-bookings")}>
                My Bookings
              </Link>
            </li>
          )}
          {user?.role === "admin" && (
            <li>
              <Link to="/admin" style={isActive("/admin")}>
                Admin Panel
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <div className="auth-buttons">
        {user ? (
          <div className="user-menu">
            <span className="user-greeting">Welcome, {user.name}!</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="btn-login">
              Log In
            </Link>
            <Link to="/register" className="btn-register">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
