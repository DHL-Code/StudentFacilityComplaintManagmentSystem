const express = require('express');
const router = express.Router();
const Department = require('../models/Department');

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().populate('college', 'name');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create department
router.post('/create-department', async (req, res) => {
  try {
    const department = new Department({
      name: req.body.name,
      college: req.body.college
    });
    const newDepartment = await department.save();
    // Populate the college information before sending response
    const populatedDepartment = await Department.findById(newDepartment._id).populate('college', 'name');
    res.status(201).json(populatedDepartment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    department.name = req.body.name;
    department.college = req.body.college;
    const updatedDepartment = await department.save();
    // Populate the college information before sending response
    const populatedDepartment = await Department.findById(updatedDepartment._id).populate('college', 'name');
    res.json(populatedDepartment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    await department.deleteOne();
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 