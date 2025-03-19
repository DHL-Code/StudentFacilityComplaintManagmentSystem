import React, { useState, useEffect } from 'react';
import '../styles/Home.css';
import Navbar from './Navbar';
import Image1 from '../assets/wolkite.jpg'; // Correctly import images
import Image2 from '../assets/wolkite3.jpg';
import Image3 from '../assets/wolkite4.jpg';
import Image4 from '../assets/comp.jpg';
import Image5 from '../assets/comp1.jpg';
import Image6 from '../assets/comp2.jpg';

const Home = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = [Image1, Image2, Image3,Image4,Image5,Image6]; // Use imported images

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      <Navbar />

      {/* Hero Section with Image Slideshow */}
      <section className="hero-section" style={{ backgroundImage: `url(${images[currentImage]})` }}>
        <div className="hero-overlay">
          <h1 className="hero-title">Wolkite University Facility Management</h1>
          <p className="hero-subtitle">
            Report, Track, and Resolve Campus Issues Efficiently
          </p>
        </div>
      </section>

      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h2>Welcome To Facility Complaint Fix</h2>
          <p className="welcome-text">
            Your central platform for addressing campus facility concerns. 
            Together, we maintain a safe and comfortable learning environment.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact">
        <div className="contact-card">
          <h3>Contact Support</h3>
          <div className="contact-info">
            <p>📞 +251 912 345 678</p>
            <p>📧 support@wku.edu.et</p>
            <p>📍 Main Campus, Administration Building</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;