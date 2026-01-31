import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const isActive = (path) =>
    location.pathname === path ? { color: "lightcoral" } : {};

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
        </ul>
      </nav>
    </header>
  );
};

export default Header;
