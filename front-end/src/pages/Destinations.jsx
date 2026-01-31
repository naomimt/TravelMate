import React from "react";
import Hero from "../components/Hero";
import DestinationCard from "../components/DestinationCard";
import "../styles/destinations.css";

const destinationData = [
  {
    id: 1,
    title: "Tokyo, Japan",
    image: "/images/tokyo.jpeg",
    desc: "Experience the dazzling contrast of neon-lit streets and ancient temples. Tokyo offers a glimpse into the future while honoring deep traditions.",
  },
  {
    id: 2,
    title: "Cape Town, South Africa",
    image: "/images/cape.jpeg",
    desc: "From the majestic Table Mountain to the stunning coastline and rich history, Cape Town is a vibrant blend of nature and culture.",
  },
  {
    id: 3,
    title: "Machu Picchu, Peru",
    image: "/images/peru.jpg",
    desc: "The lost city of the Incas, shrouded in mystery and history high in the Andes Mountains. A truly spiritual and unforgettable trek.",
  },
  {
    id: 4,
    title: "Amsterdam, Netherlands",
    image: "/images/ams.jpeg",
    desc: "Famed for its artistic heritage, elaborate canal system, and narrow houses with gabled façades. Explore museums and enjoy the unique, laid-back Dutch culture.",
  },
  {
    id: 5,
    title: "Banff National Park, Canada",
    image: "/images/canada.jpg",
    desc: "Turquoise glacial lakes, towering snow-capped peaks, and abundant wildlife make the Canadian Rockies a hiker's paradise.",
  },
  {
    id: 6,
    title: "Giza, Egypt",
    image: "/images/giza.jpeg",
    desc: "Witness the ancient wonders of the world, including the Great Pyramids and the Sphinx, testaments to human ingenuity.",
  },
];

const Destinations = () => {
  return (
    <>
      <Hero
        title="Discover Your Next Adventure"
        subtitle="A curated selection of the world's most breathtaking places."
        showButton={false}
        backgroundImage="/images/hero1.jpg"
        variant="short"
        className="hero--destinations"
      />
      <section className="des" aria-labelledby="unforgettable-journeys">
        <div className="container">
          <h2 id="unforgettable-journeys">Unforgettable Journeys</h2>
          <div className="des-grid">
            {destinationData.map((item) => (
              <DestinationCard
                key={item.id}
                image={item.image}
                title={item.title}
                description={item.desc}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Destinations;
