import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from './Navbar';
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, User, Mail, IdCard, Phone, Lock, CheckCircle, Camera } from 'lucide-react';
import "../styles/Signup.css";

const colleges = [
    {
        name: "Computing and Informatics",
        departments: ["Computer Science", "Software Engineering", "Information Technology", "Information Systems"],
    },
    {
        name: "Engineering",
        departments: ["Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Chemical Engineering"],
    },
    {
        name: "Business",
        departments: ["Business Administration", "Accounting", "Marketing", "Finance"],
    },
];

const Signup = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [userId, setUserId] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [gender, setGender] = useState("");
    const [error, setError] = useState(null);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [college, setCollege] = useState("");
    const [department, setDepartment] = useState("");
    const [profilePreview, setProfilePreview] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();
    const [isCollegeOpen, setIsCollegeOpen] = useState(false);
    const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);
    const collegeRef = useRef(null);
    const departmentRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (collegeRef.current && !collegeRef.current.contains(event.target)) {
                setIsCollegeOpen(false);
            }
            if (departmentRef.current && !departmentRef.current.contains(event.target)) {
                setIsDepartmentOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const validateField = (name, value) => {
        let errorMessage = "";
        switch (name) {
            case "fullName":
                if (!value) {
                    errorMessage = "Full Name is required";
                } else if (!/^[A-Za-z\s]+$/.test(value)) {
                    errorMessage = "Full Name must contain only letters and spaces. Numbers and special characters are not allowed.";
                }
                break;
            case "email":
                if (!value) {
                    errorMessage = "Email is required";
                } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                    errorMessage = "Email address is invalid. Example: abcd@gmail.com";
                }
                break;
            case "userId":
                if (!value) {
                    errorMessage = "User ID is required";
                }
                break;
            case "department":
                if (!value) {
                    errorMessage = "Department is required";
                }
                break;
            case "college":
                if (!value) {
                    errorMessage = "College is required";
                }
                break;
            case "phoneNumber":
                if (!value) {
                    errorMessage = "Phone Number is required";
                } else if (!/^(?:\+251\d{9}|0\d{9})$/.test(value)) {
                    errorMessage = "Phone Number must start with +251 or 0 and contain only digits. E.g., +251994319895 or 0994319895.";
                }
                break;
            case "password":
                if (!value) {
                    errorMessage = "Password is required";
                } else if (value.length < 8) {
                    errorMessage = "Password should be at least 8 characters long.";
                } else if (!/[A-Z]/.test(value)) {
                    errorMessage = "Password should contain at least one uppercase letter.";
                } else if (!/[a-z]/.test(value)) {
                    errorMessage = "Password should contain at least one lowercase letter.";
                } else if (!/[0-9]/.test(value)) {
                    errorMessage = "Password should contain at least one number.";
                } else if (!/[!@#$%^&*]/.test(value)) {
                    errorMessage = "Password should contain at least one special character.";
                }
                break;
            case "confirmPassword":
                if (!value) {
                    errorMessage = "Confirm Password is required";
                } else if (value !== password) {
                    errorMessage = "Passwords do not match";
                }
                break;
            case "gender":
                if (!value) {
                    errorMessage = "Gender is required";
                }
                break;
            default:
                break;
        }

        // Update validation errors state
        setValidationErrors((prevErrors) => ({
            ...prevErrors,
            [name]: errorMessage,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate all fields
        validateField("fullName", fullName);
        validateField("email", email);
        validateField("userId", userId);
        validateField("department", department);
        validateField("phoneNumber", phoneNumber);
        validateField("password", password);
        validateField("confirmPassword", confirmPassword);
        validateField("gender", gender);

        // Check if there are any errors
        if (Object.values(validationErrors).some((error) => error)) {
            setError("Please fix the errors before submitting.");
            return; // Prevent submission if there are errors
        }

        // Proceed with form submission
        handleSignup();
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        validateField(name, value);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setError("Please upload an image file (JPEG, PNG, etc.).");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setError("File size must be less than 5 MB.");
                return;
            }
            setProfilePhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSignup = async () => {
        const formData = new FormData();
        formData.append("fullName", fullName);
        formData.append("email", email);
        formData.append("userId", userId);
        formData.append("college", college);
        formData.append("department", department);
        formData.append("phoneNumber", phoneNumber);
        formData.append("password", password);
        formData.append("gender", gender);
        if (profilePhoto) {
            formData.append("profilePhoto", profilePhoto);
        }

        try {
            const response = await fetch("http://localhost:5000/api/auth/signup", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                console.log("Signup successful:", data);
                navigate("/login");
            } else {
                setError(data.message || "Signup failed. Please try again.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        }
    };

    return (
        <div>
            <Navbar />
            <div className="signup-container">
                <div className="signup-form">
                    <h2 className="signup-title">
                        <Rocket className="mr-2" />
                        Create Your Account
                    </h2>

                    <form onSubmit={handleSubmit}> {/* Wrap input elements in a form */}
                        <div className="input-group photo-upload-group">
                            <div className="profile-photo-container">
                                <div className="profile-preview" onClick={() => document.getElementById("profilePhoto").click()}>
                                    {profilePreview ? (
                                        <img src={profilePreview} alt="Profile preview" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <Camera size={24} />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="profilePhoto"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: "none" }}
                                />
                                <div className="upload-instruction">Click to upload photo</div>
                            </div>
                        </div>

                        <div className="input-groups">
                            <label htmlFor="fullName">
                                <User className="mr-2" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onBlur={handleBlur}
                                className={validationErrors.fullName ? "error-input" : ""}
                            />
                            {validationErrors.fullName && <span className="error">{validationErrors.fullName}</span>}
                        </div>

                        <div className="input-groups">
                            <label htmlFor="email">
                                <Mail className="mr-2" />
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={(e) => validateField("email", e.target.value)}
                                className={validationErrors.email ? "error-input" : ""}
                            />
                            {validationErrors.email && <span className="error">{validationErrors.email}</span>}
                        </div>

                        <div className="input-groups">
                            <label htmlFor="userId">
                                <IdCard className="mr-2" />
                                User ID
                            </label>
                            <input
                                type="text"
                                id="userId"
                                name="userId"
                                placeholder="Enter your user ID"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                onBlur={handleBlur}
                                className={validationErrors.userId ? "error-input" : ""}
                            />
                            {validationErrors.userId && <span className="error">{validationErrors.userId}</span>}
                        </div>

                        <div className="input-groups gender-group">
                            <label>Gender</label>
                            <div className="radio-buttons">
                                <label>
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={gender === "male"}
                                        onChange={() => {
                                            setGender("male");
                                            validateField("gender", "male");
                                        }}
                                    />
                                    Male
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={gender === "female"}
                                        onChange={() => {
                                            setGender("female");
                                            validateField("gender", "female");
                                        }}
                                    />
                                    Female
                                </label>
                            </div>
                            {validationErrors.gender && <span className="error">{validationErrors.gender}</span>}
                        </div>

                        {/* College Dropdown */}
                        <div className="input-groups">
                            <label htmlFor="college">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-school mr-2">
                                    <path d="M3 12v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2"></path>
                                    <path d="M5 18v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"></path>
                                    <path d="M11 12v6"></path>
                                    <path d="M7 12v6"></path>
                                    <path d="M17 12v6"></path>
                                </svg>
                                College
                            </label>
                            <select id="college" value={college} onChange={(e) => {
                                setCollege(e.target.value);
                                setDepartment(''); // Reset department when college changes
                            }}>
                                <option value="">Select College</option>
                                {colleges.map((col) => (
                                    <option key={col.name} value={col.name}>
                                        {col.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Department Dropdown */}
                        {college && (
                            <div className="input-groups">
                                <label htmlFor="department">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-text mr-2">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                                        <path d="M12 13h6"></path>
                                        <path d="M12 17h6"></path>
                                    </svg>
                                    Department
                                </label>
                                <select
                                    id="department"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                >
                                    <option value="">Select Department</option>
                                    {colleges.find((col) => col.name === college)?.departments.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="input-groups">
                            <label htmlFor="phoneNumber">
                                <Phone className="mr-2" />
                                Phone Number
                            </label>
                            <input
                                type="text"
                                id="phoneNumber"
                                placeholder="Enter your phone number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                onBlur={(e) => validateField("phoneNumber", e.target.value)}
                                className={validationErrors.phoneNumber ? "error-input" : ""}
                            />
                            {validationErrors.phoneNumber && <span className="error">{validationErrors.phoneNumber}</span>}
                        </div>

                        <div className="input-groups">
                            <label htmlFor="password">
                                <Lock className="mr-2" />
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={(e) => validateField("password", e.target.value)}
                                className={validationErrors.password ? "error-input" : ""}
                            />
                            {validationErrors.password && <span className="error">{validationErrors.password}</span>}
                            <small className="password-suggestion">Create a strong password: at least 8 characters, and you should include uppercase, lowercase, numbers, and special characters.</small>
                        </div>

                        <div className="input-groups">
                            <label htmlFor="confirmPassword">
                                <CheckCircle className="mr-2" />
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={(e) => validateField("confirmPassword", e.target.value)}
                            />
                        </div>

                        <motion.button
                            type="submit" // Change to type="submit"
                            className="signup-button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            Create Account
                        </motion.button>
                    </form>
                    {error && <p className="error">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default Signup;