import Hero from "../components/Hero";
import DestinationCard from "../components/DestinationCard";
import "../styles/home.css";

const popularDestinations = [
  {
    id: 1,
    image: "/images/paris.jpg",
    title: "Paris, France",
    description:
      "A city of art, fashion, and charm. From the Eiffel Tower to cozy cafés, Paris inspires with every corner.",
  },
  {
    id: 2,
    image: "/images/brazzz.jpg",
    title: "Rio de Janeiro, Brazil",
    description:
      "Golden beaches, lively rhythms, and breathtaking mountain views create the perfect blend of adventure and culture.",
  },
  {
    id: 3,
    image: "/images/venice.jpg",
    title: "Venice, Italy",
    description:
      "Glide through winding canals, discover hidden piazzas, and experience the timeless romance of this floating city.",
  },
  {
    id: 4,
    image: "/images/sant.webp",
    title: "Santorini, Greece",
    description:
      "Whitewashed cliffs, crystal-blue waters, and magical sunsets define the dreamy beauty of the Greek islands.",
  },
  {
    id: 5,
    image: "/images/newy.jpg",
    title: "New York City, USA",
    description:
      "The city that never sleeps—full of energy, iconic skylines, world-class food, and unforgettable cultural moments.",
  },
  {
    id: 6,
    image: "/images/seych.avif",
    title: "Seychelles",
    description:
      "Pristine beaches, turquoise seas, and lush tropical landscapes make Seychelles a true paradise escape.",
  },
];

const testimonials = [
  {
    id: 1,
    quote:
      "The itinerary was flawless, and the local guides were incredibly knowledgeable. TravelMate turned my dream vacation into reality. Five stars all the way!",
    name: "Saron Sisay",
  },
  {
    id: 2,
    quote:
      "Booking was simple and transparent. Their support team was responsive when I had a last-minute change. Highly recommend this service for hassle-free travel.",
    name: "Abel Teshome",
  },
  {
    id: 3,
    quote:
      "I was initially nervous about traveling abroad, but TravelMate provided such detailed pre-trip information and constant communication. I felt safe and prepared.",
    name: "Yodit Meresa",
  },
];

const Home = () => {
  return (
    <>
      <Hero
        title="Your best travel companion"
        subtitle="Find your next destination"
        buttonText="Explore Destinations"
        buttonTo="/destinations"
        backgroundImage="/images/hero3.jpg"
        variant="tall"
        className="hero--home"
      />

      <section className="des" aria-labelledby="popular-destinations">
        <div className="container">
          <h2 id="popular-destinations">Popular Destinations</h2>
          <div className="des-grid">
            {popularDestinations.map((item) => (
              <DestinationCard
                key={item.id}
                image={item.image}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials" aria-labelledby="traveler-stories">
        <div className="container">
          <h2 id="traveler-stories">What our travelers say</h2>
          <div className="testimonials-grid">
            {testimonials.map((item) => (
              <div className="card2" key={item.id}>
                <p>"{item.quote}"</p>
                <h3>{item.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
