const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Department = require('../models/Department');

// Helper function for consistent error responses
const sendErrorResponse = (res, status, message, error = {}) => {
    const response = { message };
    if (process.env.NODE_ENV !== 'production') { // Only include the error in development
        response.error = error;  // VERY IMPORTANT: Include the actual error object!
    }
    console.error(message, error); // Log the error on the server
    return res.status(status).json(response);
};

// API endpoint to get all colleges
router.get('/', async (req, res) => {
    try {
        const colleges = await College.find();
        res.json(colleges);
    } catch (err) {
        sendErrorResponse(res, 500, 'Failed to fetch colleges', err);
    }
});

// API endpoint to get departments for a specific college
router.get('/:collegeName/departments', async (req, res) => {
    const { collegeName } = req.params;
    try {
        // This should find by name, not ID
        const college = await College.findOne({ name: collegeName });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        
        const departments = await Department.find({ college: college._id });
        res.json(departments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// API endpoint to create a new college
router.post('/create-college', async (req, res) => {
    try {
      const { name } = req.body;
  
      // Validate input
      if (!name || typeof name !== 'string' || name.trim() === "") {
        return sendErrorResponse(res, 400, 'College name is required and must be a non-empty string');
      }
  
      const trimmedName = name.trim();
  
      // Check for existing college (case insensitive)
      const existingCollege = await College.findOne({ 
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') }
      });
      
      if (existingCollege) {
        return sendErrorResponse(res, 409, `College "${trimmedName}" already exists`);
      }
  
      const newCollege = new College({ name: trimmedName });
      const savedCollege = await newCollege.save();
      
      // Return the complete college list in the response
      const colleges = await College.find().sort({ name: 1 });
      
      res.status(201).json({ 
        message: 'College created successfully',
        colleges // Send back the full updated list
      });
  
    } catch (error) {
      sendErrorResponse(res, 500, 'Failed to create college', error);
    }
  });

// API endpoint to create a new department
router.post('/create-department', async (req, res) => {
    try {
        const { name, college: collegeId } = req.body;

        if (!name || name.trim() === "") {
            return sendErrorResponse(res, 400, 'Department name is required');
        }
        if (!collegeId) {
            return sendErrorResponse(res, 400, 'College ID is required');
        }

        // Check if the college exists
        const college = await College.findById(collegeId);
        if (!college) {
            return sendErrorResponse(res, 400, 'College not found');
        }

        const newDepartment = new Department({
            name,
            college: collegeId,
        });

        try {
            const savedDepartment = await newDepartment.save();
            res.status(201).json({ message: 'Department created successfully', department: savedDepartment });
        } catch (dbError) {
            return sendErrorResponse(res, 500, 'Database error while saving department', dbError);
        }


    } catch (error) {
        return sendErrorResponse(res, 500, 'Failed to create department', error);
    }
});

module.exports = router;