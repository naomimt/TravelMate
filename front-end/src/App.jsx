import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Destinations from "./pages/Destinations";
import Contact from "./pages/Contact";
import Booking from "./pages/Booking";
import BookingConfirmation from "./pages/BookingConfirmation";
import "./styles/layout.css";

function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/destination/:destinationTitle/booking"
            element={<Booking />}
          />
          <Route
            path="/destination/:destinationTitle/booking/confirmation"
            element={<BookingConfirmation />}
          />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
