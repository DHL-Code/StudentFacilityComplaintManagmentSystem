import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from './Navbar';
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, User, Mail, IdCard, Phone, Lock, CheckCircle, ChevronDown, Camera, Home } from 'lucide-react';
import "../styles/Signup.css";
import { fetchCollegesData } from './apiUtils'; // Adjust the import path

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
    const [departments, setDepartments] = useState([]);
    const [profilePreview, setProfilePreview] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();
    const [loadingColleges, setLoadingColleges] = useState(true);
    const [loadingDepartments, setLoadingDepartments] = useState(false);
    const [colleges, setColleges] = useState([]);
    const collegeRef = useRef(null);
    const [blockNumber, setBlockNumber] = useState("");
    const [dormNumber, setDormNumber] = useState("");
    const departmentRef = useRef(null);

    // Add new state variables for blocks and dorms
    const [blocks, setBlocks] = useState([]);
    const [dorms, setDorms] = useState([]);
    const [loadingBlocks, setLoadingBlocks] = useState(true);
    const [loadingDorms, setLoadingDorms] = useState(false);
    const [blockError, setBlockError] = useState("");
    const [dormError, setDormError] = useState("");

    // Fetch colleges on component mount
    useEffect(() => {
        const fetchColleges = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/colleges');
                if (!response.ok) {
                    throw new Error('Failed to fetch colleges');
                }
                const data = await response.json();
                setColleges(data);
            } catch (err) {
                setError(err.message || "Error fetching colleges");
            } finally {
                setLoadingColleges(false);
            }
        };

        fetchColleges();
    }, []);

    // Fetch departments when college changes
    useEffect(() => {
        const fetchDepartments = async () => {
            if (college) {
                setLoadingDepartments(true);
                try {
                    const response = await fetch(`http://localhost:5000/api/colleges/${encodeURIComponent(college)}/departments`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch departments');
                    }
                    const data = await response.json();
                    setDepartments(data);
                } catch (err) {
                    console.error("Error fetching departments:", err);
                    setError(err.message || "Error fetching departments");
                } finally {
                    setLoadingDepartments(false);
                }
            } else {
                setDepartments([]);
            }
        };

        fetchDepartments();
    }, [college]);

    // Add useEffect to fetch blocks and dorms
    useEffect(() => {
        const fetchBlocksAndDorms = async () => {
            try {
                setLoadingBlocks(true);
                const blocksResponse = await fetch('http://localhost:5000/api/blocks');
                if (!blocksResponse.ok) {
                    throw new Error('Failed to fetch blocks');
                }
                const blocksData = await blocksResponse.json();
                
                // Filter blocks based on gender
                const filteredBlocks = blocksData.filter(block => {
                    if (gender === 'male') {
                        return block.number >= 201 && block.number <= 222;
                    } else if (gender === 'female') {
                        return block.number >= 223 && block.number <= 237;
                    }
                    return false; // Don't show any blocks if gender is not selected
                });
                
                setBlocks(filteredBlocks);
            } catch (error) {
                console.error('Error fetching blocks:', error);
                setBlockError(error.message);
            } finally {
                setLoadingBlocks(false);
            }
        };

        fetchBlocksAndDorms();
    }, [gender]); // Add gender as a dependency

    // Add useEffect to fetch dorms when block is selected
    useEffect(() => {
        const fetchDorms = async () => {
            if (!blockNumber) {
                setDorms([]);
                return;
            }

            try {
                setLoadingDorms(true);
                // Find the block object that matches the selected block number
                const selectedBlock = blocks.find(block => block.number === blockNumber);
                if (!selectedBlock) {
                    throw new Error('Selected block not found');
                }
                
                const dormsResponse = await fetch(`http://localhost:5000/api/dorms/block/${selectedBlock._id}`);
                if (!dormsResponse.ok) {
                    throw new Error('Failed to fetch dorms');
                }
                const dormsData = await dormsResponse.json();
                setDorms(dormsData);
            } catch (error) {
                console.error('Error fetching dorms:', error);
                setDormError(error.message);
            } finally {
                setLoadingDorms(false);
            }
        };

        fetchDorms();
    }, [blockNumber, blocks]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (collegeRef.current && !collegeRef.current.contains(event.target)) {
                //setIsCollegeOpen(false); // No need for this anymore with select
            }
            if (departmentRef.current && !departmentRef.current.contains(event.target)) {
                //setIsDepartmentOpen(false); // No need for this anymore with select
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
                } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value)) { // Updated regex for @gmail.com validation
                    errorMessage = "Email must be in the format: example@gmail.com";
                }
                break;
            case "userId":
                if (!value) {
                    errorMessage = "User ID is required";
                } else if (/^[pvda]/i.test(value)) {
                    errorMessage = "User ID cannot start with P, V, D, or A";
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
                    errorMessage = "Phone Number must start with +251 or 0 and contain only digits like this including the size. E.g., +251994319895 or 0994319895.";
                }
                break;
            // Validation logic in validateField function
            case "password":
                const passwordErrors = [];
                if (!value) {
                    passwordErrors.push("Password is required.");
                }
                if (value.length < 8) {
                    passwordErrors.push("Password should be at least 8 characters long.");
                }
                if (!/[A-Z]/.test(value)) {
                    passwordErrors.push("Password should contain at least one uppercase letter.");
                }
                if (!/[a-z]/.test(value)) {
                    passwordErrors.push("Password should contain at least one lowercase letter.");
                }
                if (!/[0-9]/.test(value)) {
                    passwordErrors.push("Password should contain at least one number.");
                }
                if (!/[!@#$%^&*]/.test(value)) {
                    passwordErrors.push("Password should contain at least one special character.");
                }
                if (passwordErrors.length > 0) {
                    errorMessage = passwordErrors.join(" "); // Join all errors into one message
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
            case "blockNumber":
                if (!value) {
                    errorMessage = "Block Number is required";
                }
                break;
            case "dormNumber":
                if (!value) {
                    errorMessage = "Dorm Number is required";
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
        // Validate all fields first
        const fields = {
            fullName,
            email,
            userId,
            phoneNumber,
            password,
            confirmPassword,
            gender,
            college,
            department,
            blockNumber,
            dormNumber
        };

        // Validate each field
        Object.keys(fields).forEach(field => {
            validateField(field, fields[field]);
        });

        // Check if there are any validation errors
        if (Object.values(validationErrors).some(error => error !== "")) {
            setError("Please fix the validation errors before submitting.");
            return;
        }

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('fullName', fullName);
            formData.append('email', email);
            formData.append('userId', userId);
            formData.append('phoneNumber', phoneNumber);
            formData.append('password', password);
            formData.append('gender', gender);
            formData.append('college', college);
            formData.append('department', department);
            formData.append('blockNumber', blockNumber);
            formData.append('dormNumber', dormNumber);
            
            // Only append profilePhoto if it exists
            if (profilePhoto) {
                formData.append('profilePhoto', profilePhoto);
            }

            // First create the user
            const userResponse = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                body: formData
            });

            const userData = await userResponse.json();

            if (!userResponse.ok) {
                throw new Error(userData.message || 'Failed to create user account');
            }

            // Then create the student approval record
            const approvalResponse = await fetch('http://localhost:5000/api/student-approvals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentId: userId,
                    name: fullName,
                    email,
                    department,
                    college
                }),
            });

            if (!approvalResponse.ok) {
                throw new Error('Failed to create approval record');
            }

            // Show success message with approval information
            setError(null);
            alert(`
                Account created successfully!
                
                Important Information:
                1. Please wait for admin approval before logging in.
                2. You will receive an email notification at ${email} once your account is approved.
                3. Check your email regularly for updates on your approval status.
                4. If you don't receive an email within 24 hours, please contact the admin office.
                
                Thank you for your patience!
            `);

            // Navigate to login after showing the message
            navigate('/login');
        } catch (error) {
            console.error('Signup error:', error);
            setError(error.message || 'An error occurred during signup');
        }
    };

    return (
        <div>
            <Navbar />
            <div className="signup-container">
                <div
                    className="signup-form"
                >
                    <h2 className="signup-title">
                        <Rocket className="mr-2" />
                        Create Your Account
                    </h2>

                    <div className="input-group photo-upload-group">
                        <div
                            className="profile-photo-container"
                            onClick={() => document.getElementById("profilePhoto").click()}
                        >
                            <div
                                className="profile-preview"
                            >
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
                            onChange={(e) => setEmail(e.target.value)} // Set email value
                            onBlur={(e) => {
                                handleBlur(e);
                                validateField("email", e.target.value); // Validate on blur
                            }}
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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-school mr-2"><path d="M3 12v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2"></path><path d="M5 18v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"></path><path d="M11 12v6"></path><path d="M7 12v6"></path><path d="M17 12v6"></path></svg>
                            College
                        </label>
                        {loadingColleges ? (
                            <div>Loading colleges...</div>
                        ) : (
                            <select
                                id="college"
                                value={college}
                                onChange={(e) => {
                                    const selectedCollege = e.target.value;
                                    setCollege(selectedCollege);
                                    setDepartment(''); // Reset department when college changes
                                    validateField("college", selectedCollege);
                                }}
                                onBlur={handleBlur}
                                className={validationErrors.college ? "error-input" : ""}
                            >
                                <option value="">Select College</option>
                                {colleges.map((col) => (
                                    <option key={col._id} value={col.name}>
                                        {col.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {validationErrors.college && <span className="error">{validationErrors.college}</span>}
                    </div>

                    {/* Department Dropdown */}
                    {college && (
                        <div className="input-groups">
                            <label htmlFor="department">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-book-open-text mr-2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path><path d="M12 13h6"></path><path d="M12 17h6"></path></svg>
                                Department
                            </label>
                            {loadingDepartments ? (
                                <div>Loading departments...</div>
                            ) : (
                                <select
                                    id="department"
                                    value={department}
                                    onChange={(e) => {
                                        setDepartment(e.target.value);
                                        validateField("department", e.target.value);
                                    }}
                                    onBlur={handleBlur}
                                    className={validationErrors.department ? "error-input" : ""}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((dept) => (
                                        <option key={dept._id} value={dept.name}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {validationErrors.department && <span className="error">{validationErrors.department}</span>}
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
                            name="phoneNumber"
                            placeholder="Enter your phone number"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            onBlur={handleBlur}
                            className={validationErrors.phoneNumber ? "error-input" : ""}
                        />
                        {validationErrors.phoneNumber && <span className="error">{validationErrors.phoneNumber}</span>}
                    </div>

                    <div className="input-groups">
                        <label htmlFor="blockNumber">
                            <Home className="mr-2" />
                            Block Number
                        </label>
                        {loadingBlocks ? (
                            <div style={{ color: '#666', padding: '8px 0' }}>Loading blocks...</div>
                        ) : (
                            <select
                            id="blockNumber"
                            name="blockNumber"
                            value={blockNumber}
                                onChange={(e) => {
                                    setBlockNumber(e.target.value);
                                    setDormNumber(''); // Reset dorm selection when block changes
                                    validateField("blockNumber", e.target.value);
                                }}
                            onBlur={(e) => {
                                handleBlur(e);
                                    validateField("blockNumber", e.target.value);
                            }}
                            className={validationErrors.blockNumber ? "error-input" : ""}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    backgroundColor: '#fff',
                                    color: '#222',
                                    fontSize: '1em'
                                }}
                            >
                                <option key="default" value="">Select Block</option>
                                {blocks.map((block) => (
                                    <option key={block._id} value={block.number}>
                                        Block {block.number}
                                    </option>
                                ))}
                            </select>
                        )}
                        {blockError && <span className="error">{blockError}</span>}
                        {validationErrors.blockNumber && <span className="error">{validationErrors.blockNumber}</span>}
                    </div>

                    <div className="input-groups">
                        <label htmlFor="dormNumber">
                            <Home className="mr-2" />
                            Dorm Number
                        </label>
                        {blockNumber ? (
                            loadingDorms ? (
                                <div style={{ color: '#666', padding: '8px 0' }}>Loading dorms...</div>
                            ) : (
                                <select
                            id="dormNumber"
                            name="dormNumber"
                            value={dormNumber}
                                    onChange={(e) => {
                                        setDormNumber(e.target.value);
                                        validateField("dormNumber", e.target.value);
                                    }}
                            onBlur={(e) => {
                                handleBlur(e);
                                        validateField("dormNumber", e.target.value);
                            }}
                            className={validationErrors.dormNumber ? "error-input" : ""}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '6px',
                                        backgroundColor: '#fff',
                                        color: '#222',
                                        fontSize: '1em'
                                    }}
                                >
                                    <option value="">Select Dorm</option>
                                    {dorms.map((dorm) => (
                                        <option key={dorm._id} value={dorm.number}>
                                            Dorm {dorm.number}
                                        </option>
                                    ))}
                                </select>
                            )
                        ) : (
                            <div style={{ color: '#666', padding: '8px 0' }}>Please select a block first</div>
                        )}
                        {dormError && <span className="error">{dormError}</span>}
                        {validationErrors.dormNumber && <span className="error">{validationErrors.dormNumber}</span>}
                    </div>

                    <div className="input-groups">
                        <label htmlFor="password">
                            <Lock className="mr-2" />
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={handleBlur}
                            className={validationErrors.password ? "error-input" : ""}
                        />
                        {validationErrors.password && <span className="error">{validationErrors.password}</span>}
                    </div>

                    <div className="input-groups">
                        <label htmlFor="confirmPassword">
                            <CheckCircle className="mr-2" />
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onBlur={handleBlur}
                            className={validationErrors.confirmPassword ? "error-input" : ""}
                        />
                        {validationErrors.confirmPassword && <span className="error">{validationErrors.confirmPassword}</span>}
                    </div>

                    <motion.button
                        className="signup-button"
                        onClick={handleSignup}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        Create Account
                    </motion.button>
                    {error && <p className="error">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default Signup;
