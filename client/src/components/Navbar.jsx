// src/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const Navbar = () => {
  return (
    <nav style={styles.nav}>
      <ul style={styles.ul}>
        <li style={styles.li}>
          <Link to="/" style={styles.link}>Home</Link>
        </li>
        <li style={styles.li}>
          <Link to="/Signup" style={styles.link}>Signup</Link>
        </li>
        <li style={styles.li}>
          <Link to="/Login" style={styles.link}>Login</Link>
        </li>
        
      </ul>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: 'black',
    padding: '10px',
    borderRadius:'10px',
  },
  ul: {
    listStyle: 'none',
    display: 'flex',
    justifyContent: 'space-around',
    margin: 0,
    padding: 0,
  },
  li: {
    margin: 0,
    
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '18px',
  },
};

export default Navbar;