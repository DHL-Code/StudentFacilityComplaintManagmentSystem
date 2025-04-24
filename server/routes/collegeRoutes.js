const express = require('express');
const router = express.Router();
const College = require('../models/College');
const Department = require('../models/Department');

// Get all colleges
router.get('/', async (req, res) => {
  try {
    const colleges = await College.find();
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create college
router.post('/create-college', async (req, res) => {
  try {
    const college = new College({
      name: req.body.name
    });
    const newCollege = await college.save();
    res.status(201).json(newCollege);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update college
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validate input
    if (!name || typeof name !== 'string' || name.trim() === "") {
      return res.status(400).json({ message: 'College name is required and must be a non-empty string' });
    }

    const trimmedName = name.trim();

    // Check if college exists
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Check for duplicate name (case insensitive)
    const existingCollege = await College.findOne({ 
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      _id: { $ne: req.params.id } // Exclude current college from duplicate check
    });
    
    if (existingCollege) {
      return res.status(409).json({ message: `College "${trimmedName}" already exists` });
    }

    // Update college
    college.name = trimmedName;
    const updatedCollege = await college.save();
    
    // Return the complete college list in the response
    const colleges = await College.find().sort({ name: 1 });
    
    res.json({ 
      message: 'College updated successfully',
      college: updatedCollege,
      colleges // Send back the full updated list
    });
  } catch (error) {
    console.error('Error updating college:', error);
    res.status(500).json({ message: 'Failed to update college', error: error.message });
  }
});

// Delete college
router.delete('/:id', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ message: 'College not found' });
    }

    // Delete all departments associated with this college
    await Department.deleteMany({ college: req.params.id });
    
    // Delete the college
    await college.deleteOne();
    
    // Return the updated list of colleges
    const colleges = await College.find().sort({ name: 1 });
    res.json({ 
      message: 'College and associated departments deleted successfully',
      colleges
    });
  } catch (error) {
    console.error('Error deleting college:', error);
    res.status(500).json({ message: 'Failed to delete college', error: error.message });
  }
});

module.exports = router; 