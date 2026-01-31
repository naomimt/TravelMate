import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function DestinationCard({ image, title, description }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBook = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const encoded = encodeURIComponent(title);
    navigate(`/destination/${encoded}/booking`);
  };

  return (
    <div className="card">
      <img src={image} alt={`${title}`} />
      <h3>{title}</h3>
      <p>{description}</p>
      <button onClick={handleBook} className="btn-primary btn-extended">
        {user ? "Book now" : "Book now"}
      </button>
    </div>
  );
}

export default DestinationCard;
