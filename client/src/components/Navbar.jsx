import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiUserPlus, FiLogIn, FiMail, FiMenu, FiX } from 'react-icons/fi';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768); // Adjust breakpoint as needed

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768); // Adjust breakpoint as needed
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false); // Close menu on desktop resize
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const navLinks = [
    { path: "/", title: "Home", icon: <FiHome />, tooltip: "Return to homepage" },
    { path: "/signup", title: "Signup", icon: <FiUserPlus />, tooltip: "Create new account" },
    { path: "/login", title: "Login", icon: <FiLogIn />, tooltip: "Access your account" },
    { path: "/contactus", title: "Contact", icon: <FiMail />, tooltip: "Get in touch with support" }
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">
          <span> Student Facility Complaint managment</span>
        </Link>

        <div className="desktop-nav">
          {navLinks.map((link, index) => (
            <Tippy key={index} content={link.tooltip}>
              <Link
                to={link.path}
                className="nav-link"
                style={{ margin: '0 15px', padding: '8px 12px', borderRadius: '5px', transition: 'background-color 0.3s, color 0.3s' }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'lightblue';
                  e.target.style.color = 'darkblue';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '';
                  e.target.style.color = '';
                }}
              >
                {link.icon}
                <span>{link.title}</span>
              </Link>
            </Tippy>
          ))}
        </div>

        {isMobileView && (
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        )}
      </div>

      <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        {navLinks.map((link, index) => (
          <Link
            key={index}
            to={link.path}
            className="mobile-nav-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            {link.icon}
            <span>{link.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;