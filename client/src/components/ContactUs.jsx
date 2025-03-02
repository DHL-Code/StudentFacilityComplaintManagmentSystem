import React, { useState } from 'react';
import '../styles/ContactUs.css'; // Make sure the path is correct
import Navbar from './Navbar'; // Assuming you have a Navbar component

const ContactUs = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log('Form submitted:', { name, email, message });
        // In a real scenario, you would send this data to your backend here
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
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <textarea
                        name="message"
                        placeholder="Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    ></textarea>
                    <button className="submit-button" type="submit">
                        Submit
                    </button>
                </form>

                <footer className="contact-footer"> {/* Add footer element */}
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