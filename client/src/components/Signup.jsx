import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "../styles/Signup.css";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [department, setDepartment] = useState("");
  const [profilePreview, setProfilePreview] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  // Validate individual fields
  const validateField = (name, value) => {
    let errorMessage = "";

    switch (name) {
      case "fullName":
        if (!value) errorMessage = "Full Name is required";
        break;
      case "email":
        if (!value) {
          errorMessage = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          errorMessage = "Email address is invalid";
        }
        break;
      case "userId":
        if (!value) errorMessage = "User ID is required";
        break;
      case "department":
        if (!value) errorMessage = "Department is required";
        break;
      case "phoneNumber":
        if (!value) {
          errorMessage = "Phone Number is required";
        } else if (!/^\d{10}$/.test(value)) {
          errorMessage = "Phone Number is invalid";
        }
        break;
      case "password":
        if (!value) {
          errorMessage = "Password is required";
        } else if (value.length < 6) {
          errorMessage = "Password must be at least 6 characters";
        }
        break;
      case "confirmPassword":
        if (!value) {
          errorMessage = "Confirm Password is required";
        } else if (value !== password) {
          errorMessage = "Passwords don't match";
        }
        break;
      case "gender":
        if (!value) errorMessage = "Gender is required";
        break;
      default:
        break;
    }

    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [name]: errorMessage,
    }));
  };

  // Handle blur event for validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  // Handle photo upload
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

  // Handle form submission
  const handleSignup = async () => {
    // Validate all fields before submission
    validateField("fullName", fullName);
    validateField("email", email);
    validateField("userId", userId);
    validateField("department", department);
    validateField("phoneNumber", phoneNumber);
    validateField("password", password);
    validateField("confirmPassword", confirmPassword);
    validateField("gender", gender);

    // Check if there are any validation errors
    if (Object.values(validationErrors).some((error) => error)) {
      setError("Please fix the errors before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("userId", userId);
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
      console.error("Signup error:", err);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="signup-container">
        <div className="signup-form">
          <h1 className="signup-title">Create Your Account</h1>

          <div className="input-group photo-upload-group">
            <div className="profile-photo-container">
              <div
                className="profile-preview"
                onClick={() => document.getElementById("profilePhoto").click()}
              >
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile preview" />
                ) : (
                  <div className="upload-placeholder">
                    <span>+</span>
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
              <div className="upload-instruction">Click to upload profile photo</div>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={handleBlur}
            />
            {validationErrors.fullName && <span className="error">{validationErrors.fullName}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleBlur}
            />
            {validationErrors.email && <span className="error">{validationErrors.email}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="userId">User ID</label>
            <input
              type="text"
              id="userId"
              name="userId"
              placeholder="Enter your user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onBlur={handleBlur}
            />
            {validationErrors.userId && <span className="error">{validationErrors.userId}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="department">Department</label>
            <select
              id="department"
              name="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              onBlur={handleBlur}
            >
              <option value="">Select Department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
            {validationErrors.department && <span className="error">{validationErrors.department}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onBlur={handleBlur}
            />
            {validationErrors.phoneNumber && <span className="error">{validationErrors.phoneNumber}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handleBlur}
            />
            {validationErrors.password && <span className="error">{validationErrors.password}</span>}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={handleBlur}
            />
            {validationErrors.confirmPassword && <span className="error">{validationErrors.confirmPassword}</span>}
          </div>

          <div className="input-group gender-group">
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

          <button className="signup-button" onClick={handleSignup}>
            Create Account
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Signup;