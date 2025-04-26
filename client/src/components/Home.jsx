import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import Navbar from './Navbar';
import Image1 from '../assets/wolkite.jpg';
import Image2 from '../assets/wolkite3.jpg';
import Image3 from '../assets/wolkite4.jpg';
import Image4 from '../assets/comp.jpg';
import Image5 from '../assets/comp1.jpg';
import Image6 from '../assets/comp2.jpg';
import { FiArrowRight, FiCheckCircle, FiUsers, FiShield, FiTrendingUp, FiClock, FiMoon, FiSun } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const Home = () => {
  const { darkMode } = useTheme();
  /*
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }); */

  const [currentImage, setCurrentImage] = useState(0);
  const images = [Image1, Image2, Image3, Image4, Image5, Image6];

  useEffect(() => {
    const imageInterval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(imageInterval); // Cleanup on unmount
  }, [images.length]); // Add images.length as dependency

  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const features = [
    {
      icon: <FiCheckCircle />,
      title: "Quick Reporting",
      description: "Submit facility issues in just a few clicks with our intuitive interface."
    },
    {
      icon: <FiClock />,
      title: "Real-time Tracking",
      description: "Monitor the status of your complaints in real-time from submission to resolution."
    },
    {
      icon: <FiTrendingUp />,
      title: "Efficient Resolution",
      description: "Our streamlined process ensures faster response times and problem resolution."
    },
    {
      icon: <FiShield />,
      title: "Secure Platform",
      description: "Your data is protected with our robust security measures and privacy protocols."
    }
  ];

  const userTypes = [
    {
      role: "Students",
      description: "Report facility issues, track progress, and receive notifications when resolved."
    },
    {
      role: "Proctors",
      description: "Review student complaints, assign to appropriate staff, and monitor resolution."
    },
    {
      role: "Supervisors",
      description: "Manage work orders, assign technicians, and ensure timely problem resolution."
    },
    {
      role: "Student Dean",
      description: "Oversee system operations, generate reports, and fix complex issue."
    },

  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setShowAbout(sectionId === 'about');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className={`home-containers ${darkMode ? 'dark-mode' : ''}`}>
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} /> {/* Make sure Navbar is properly implemented */}

      <section className="home-hero-sections">
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentImage}
            className="home-hero-backgrounds"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <img
              src={images[currentImage]}
              alt="Wolkite University"
              className="home-hero-image"
            />
          </motion.div>
        </AnimatePresence>

        <div className="home-hero-overlays">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="home-hero-titles">Wolkite University Facility Management</h1>
            <p className="home-hero-subtitles">
              Your voice matters! Report, track, and help us maintain campus facilities efficiently.
            </p>
            <div className="home-hero-button">
              <Link to="/login" className="home-primary-buttons">
                Report an Issue <FiArrowRight />
              </Link>
              <Link to="/contactus" className="home-secondary-buttons">
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="home-features-sections">
        <div className="home-section-headers">
          <h2>Why Use Our System?</h2>
          <p>Experience the difference with our comprehensive facility management solution</p>
        </div>

        <div className="home-features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={`home-feature-card ${index === activeFeature ? 'active' : ''}`}
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="home-feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="home-steps-section">
        <div className="home-section-headers">
          <h2>How It Works</h2>
          <p>Simple steps to get your facility issues resolved</p>
        </div>

        <div className="home-steps-container">
          <div className="home-step">
            <div className="home-step-number">1</div>
            <h3>Report an Issue</h3>
            <p>Log in and submit a complaint with details and photos if needed</p>
          </div>

          <div className="home-step">
            <div className="home-step-number">2</div>
            <h3>Review Process</h3>
            <p>Our team verifies and categorizes your complaint</p>
          </div>

          <div className="home-step">
            <div className="home-step-number">3</div>
            <h3>Resolution</h3>
            <p>Assigned staff work on resolving your reported issue</p>
          </div>

          <div className="home-step">
            <div className="home-step-number">4</div>
            <h3>Feedback</h3>
            <p>You receive updates and can confirm when resolved</p>
          </div>
        </div>
      </section>

      <section className="home-roles-section">
        <div className="home-section-headers">
          <h2>Who Uses This System?</h2>
          <p>Different roles, one unified platform for campus facility management</p>
        </div>

        <div className="home-roles-grid">
          {userTypes.map((user, index) => (
            <motion.div
              key={index}
              className="home-role-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <FiUsers className="home-role-icon" />
              <h3>{user.role}</h3>
              <p>{user.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Us Section */}
      <section className="home-about-section">
        <div className="home-about-content">
          <div className="home-about-text">
            <h2>About Our Facility Management System</h2>
            <p>
              The Wolkite University Facility Complaint Management System was developed to bridge the communication gap
              between students and administration regarding campus facility issues. Our mission is to create a transparent,
              efficient, and user-friendly platform that ensures all facility concerns are addressed promptly.
            </p>
            <p>
              Since our launch, we've successfully resolved thousands of complaints, improving campus life for everyone.
              We continuously evolve based on user feedback to provide the best possible service.
            </p>
            <Link to="/contactus" className="home-primary-button">
              Contact Us <FiArrowRight />
            </Link>
          </div>
          <div className="home-about-image">
            <img src={Image4} alt="Team working on facility management" />
          </div>
        </div>
      </section>

      <section className="home-testimonials-section">
        <div className="home-section-header">
          <h2>What Our Users Say</h2>
          <p>Hear from students and staff who use our system</p>
        </div>

        <div className="home-testimonials-container">
          <motion.div
            className="home-testimonial-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="home-testimonial-text">
              "The system made it so easy to report a socket,water,toilet issue in our dorm. It was fixed within few days!"
            </div>
            <div className="home-testimonial-author">
              <strong>- University Students </strong>
            </div>
          </motion.div>

          <motion.div
            className="home-testimonial-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="home-testimonial-text">
              "As a proctor, I can now efficiently track all facility issues in my dormitory and ensure they're resolved."
            </div>
            <div className="home-testimonial-author">
              <strong>- Dorm Proctor</strong>
            </div>
          </motion.div>

          <motion.div
            className="home-testimonial-card"
            whileHover={{ scale: 1.02 }}
          >
            <div className="home-testimonial-text">
              "The reporting system has significantly reduced the time it takes to address maintenance requests."
            </div>
            <div className="home-testimonial-author">
              <strong>- Facility Supervisor</strong>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="home-cta-section">
        <div className="home-cta-content">
          <h2>Ready to Improve Campus Facilities?</h2>
          <p>Join hundreds of students and staff who are making Wolkite University a better place</p>
          <div className="home-cta-buttons">
            <Link to="/login" className="home-primary-button">
              Report an Issue Now
            </Link>
            <Link to="/contactus" className="home-secondary-button">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="home-contact-section" id="contact">
        <div className="home-contact-card">
          <h3>Contact Support</h3>
          <div className="home-contact-info">
            <p><Tippy content="Call us during working hours"><span>📞 +251 912 345 678</span></Tippy></p>
            <p><Tippy content="We respond within 24 hours"><span>📧 support@wku.edu.et</span></Tippy></p>
            <p><Tippy content="Visit us Monday-Friday, 8:30AM-5:30PM"><span>📍 Main Campus, Administration Building</span></Tippy></p>
          </div>
        </div>
      </section>

      {isVisible && (
        <motion.button
          className="home-scroll-to-top"
          onClick={scrollToTop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
        >
          ↑
        </motion.button>
      )}
    </div>
  );
};

export default Home;