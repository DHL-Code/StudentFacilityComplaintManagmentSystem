import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/ContactUs.css';
import Navbar from './Navbar';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const ContactUs = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            setShowSuccess(true);
            setName('');
            setEmail('');
            setMessage('');

            setTimeout(() => {
                setShowSuccess(false);
                navigate("/");
            }, 3000);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contact-us-page">
            <Navbar />
            <div className="contact-us-container">
                <form onSubmit={handleSubmit} className="contact-form">
                    <h2>Contact Our Team</h2>
                    <p className="form-description">
                        We're here to help! Send us your questions or feedback and
                        we'll respond as quickly as possible.
                    </p>

                    <input
                        type="text"
                        name="name"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <textarea
                        name="message"
                        placeholder="How can we help you?"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    ></textarea>

                    <button
                        className="submit-button"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="button-loading">
                                <span className="spinner"></span> Sending...
                            </span>
                        ) : (
                            'Send Message'
                        )}
                    </button>

                    {showSuccess && (
                        <div className="form-success">
                            Thank you! Your message has been sent successfully.
                        </div>
                    )}
                </form>

                <footer className="contact-footer">
                    <div className="contact-info">
                        <p>Reach Us Directly</p>
                        <p><FiMail /> support@studentfacilitycomplaintms.com</p>
                        <p><FiPhone /> +251 912 345 678</p>
                        <p><FiMapPin /> Wolkite University, Main Campus</p>
                    </div>

                    <div className="quick-links">
                        <p>Quick Links</p>
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/faq">FAQs</Link>
                        <Link to="/help">Help Center</Link>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ContactUs;