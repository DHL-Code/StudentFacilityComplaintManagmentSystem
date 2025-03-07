import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import '../styles/ContactUs.css';
import Navbar from './Navbar';

const ContactUs = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        console.log('Form submitted:', { name, email, message });
        const response = await fetch('http://localhost:5000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, message }),
        });
        
        if (response.ok) {
            console.log('Form submitted successfully');
            // Optionally clear the form or show a success message
            navigate("/");
        } else {
            console.error('Error submitting form');
        }
    };

    return (
        <div>
            <Navbar />
            <div className="contact-us-container">
                <form onSubmit={handleSubmit} className="contact-form">
                    <h2>Contact Us</h2>
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <textarea
                        name="message"
                        placeholder="Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    ></textarea>
                    <button className="submit-button" type="submit">
                        Submit
                    </button>
                </form>

                <footer className="contact-footer">
                    <div className="contact-info">
                        <p>Contact Information</p>
                        <p>Email: support@studentfacilitycomplaintms.com</p>
                        <p>Phone: +1 (234) 567-890</p>
                    </div>

                    <div className="quick-links">
                        <p>Quick Links</p>
                        <p>Privacy Policy</p>
                        <p>Terms of Service</p>
                        <p>Help Center</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ContactUs;