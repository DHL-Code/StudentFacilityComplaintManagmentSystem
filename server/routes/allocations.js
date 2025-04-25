const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// Get all allocations
router.get('/', auth, async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate('room', 'number dorm')
      .populate('student', 'name email');
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get allocation by student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const allocation = await Allocation.findOne({ student: req.params.studentId })
      .populate('room', 'number dorm')
      .populate('student', 'name email');
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    res.json(allocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new allocation
router.post('/', auth, async (req, res) => {
  try {
    const { student, room } = req.body;
    
    // Check if room exists
    const roomExists = await Room.findById(room);
    if (!roomExists) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if student already has an allocation
    const existingAllocation = await Allocation.findOne({ student });
    if (existingAllocation) {
      return res.status(400).json({ message: 'Student already has a room allocation' });
    }

    const allocation = new Allocation({ student, room });
    await allocation.save();
    res.status(201).json(allocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete an allocation
router.delete('/:id', auth, async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }
    await allocation.remove();
    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 