import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiLogIn, FiMail, FiMenu, FiX, FiInfo, FiMoon, FiSun } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import '../styles/Navbar.css';

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pulse, setPulse] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    {
      path: "/",
      title: "Home",
      icon: <FiHome />,
      tooltip: "Return to homepage"
    },
    {
      path: "/login",
      title: "Login",
      icon: <FiLogIn />,
      tooltip: "Access your account"
    },
    {
      path: "/contactus",
      title: "Contact",
      icon: <FiMail />,
      tooltip: "Get in touch with support"
    }
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleNavClick = (path) => {
    if (path.startsWith('#')) {
      const element = document.getElementById(path.substring(1));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
    closeMobileMenu();
  };

  const handleDarkModeToggle = () => {
    setPulse(true);
    toggleDarkMode();
  };

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'scrolled' : ''} ${darkMode ? 'dark' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="nav-container">
        <Link to="/" className="logo" onClick={closeMobileMenu}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="logo-highlight">WKU</span> FacilityCare
          </motion.span>
        </Link>

        <div className="desktop-nav">
          {navLinks.map((link, index) => (
            <React.Fragment key={index}>
              {link.path.startsWith('#') ? (
                <a
                  href={link.path}
                  className={`nav-link ${location.pathname === '/' && window.location.hash === link.path ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.path);
                  }}
                >
                  <Tippy content={link.tooltip}>
                    <span>
                      <span className="nav-icon">{link.icon}</span>
                      {link.title}
                    </span>
                  </Tippy>
                </a>
              ) : (
                <Link
                  to={link.path}
                  className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Tippy content={link.tooltip}>
                    <span>
                      <span className="nav-icon">{link.icon}</span>
                      {link.title}
                    </span>
                  </Tippy>
                </Link>
              )}
            </React.Fragment>
          ))}

          <Tippy content={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <button
              className={`nav-dark-mode-toggle ${pulse ? 'dark-mode-change' : ''}`}
              onClick={handleDarkModeToggle}
              onAnimationEnd={() => setPulse(false)}
              aria-label={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </Tippy>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link, index) => (
              <div key={index} className="mobile-nav-item">
                {link.path.startsWith('#') ? (
                  <a
                    href={link.path}
                    className="mobile-nav-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.path);
                    }}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    {link.title}
                  </a>
                ) : (
                  <Link
                    to={link.path}
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <span className="nav-icon">{link.icon}</span>
                    {link.title}
                  </Link>
                )}
              </div>
            ))}
            <div className="mobile-nav-item">
              <button
                className="mobile-nav-link mobile-dark-mode-toggle"
                onClick={handleDarkModeToggle}
              >
                <span className="nav-icon">
                  {darkMode ? <FiSun /> : <FiMoon />}
                </span>
                {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;