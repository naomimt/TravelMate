import { useNavigate } from "react-router-dom";

function DestinationCard({ image, title, description }) {
  const navigate = useNavigate();

  const handleBook = () => {
    const encoded = encodeURIComponent(title);
    navigate(`/destination/${encoded}/booking`);
  };

  return (
    <div className="card">
      <img src={image} alt={`${title}`} />
      <h3>{title}</h3>
      <p>{description}</p>
      <button onClick={handleBook} className="btn-primary btn-extended">
        Book now
      </button>
    </div>
  );
}

export default DestinationCard;
