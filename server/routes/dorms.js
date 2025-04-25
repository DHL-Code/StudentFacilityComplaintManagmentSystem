const express = require('express');
const router = express.Router();
const Dorm = require('../models/Dorm');
const Block = require('../models/Block');
const auth = require('../middleware/auth');

// Get all dorms
router.get('/', auth, async (req, res) => {
  try {
    const dorms = await Dorm.find().populate('block');
    res.json(dorms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dorms by block
router.get('/block/:blockId', auth, async (req, res) => {
  try {
    const dorms = await Dorm.find({ block: req.params.blockId }).populate('block');
    res.json(dorms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single dorm by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const dorm = await Dorm.findById(req.params.id).populate('block');
    if (!dorm) {
      return res.status(404).json({ message: 'Dorm not found' });
    }
    res.json(dorm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new dorm
router.post('/', auth, async (req, res) => {
  try {
    const { number, block } = req.body;

    // Validate input
    if (!number || !block) {
      return res.status(400).json({ message: 'Dorm number and block are required' });
    }
    
    // Check if block exists
    const existingBlock = await Block.findById(block);
    if (!existingBlock) {
      return res.status(400).json({ message: 'Block not found' });
    }

    // Check if dorm number is already taken in this block
    const existingDorm = await Dorm.findOne({ number, block });
    if (existingDorm) {
      return res.status(400).json({ message: `Dorm number ${number} already exists in this block` });
    }

    // Create new dorm
    const dorm = new Dorm({
      number,
      block
    });

    await dorm.save();
    res.status(201).json(dorm);
  } catch (error) {
    console.error('Error creating dorm:', error);
      res.status(500).json({ message: error.message });
  }
});

// Update a dorm
router.put('/:id', auth, async (req, res) => {
  try {
    const { number, block } = req.body;

    // Validate input
    if (!number || !block) {
      return res.status(400).json({ message: 'Dorm number and block are required' });
    }
    
    // Check if block exists
    const existingBlock = await Block.findById(block);
    if (!existingBlock) {
      return res.status(400).json({ message: 'Block not found' });
    }

    // Check if the new dorm number is already taken in this block
    const existingDorm = await Dorm.findOne({ 
      number,
      block,
      _id: { $ne: req.params.id } // Exclude current dorm
    });
    if (existingDorm) {
      return res.status(400).json({ message: `Dorm number ${number} already exists in this block` });
    }

    const dorm = await Dorm.findByIdAndUpdate(
      req.params.id,
      { number, block },
      { new: true, runValidators: true }
    ).populate('block');

    if (!dorm) {
      return res.status(404).json({ message: 'Dorm not found' });
    }

    res.json(dorm);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// Delete a dorm
router.delete('/:id', auth, async (req, res) => {
  try {
    const dorm = await Dorm.findByIdAndDelete(req.params.id);
    if (!dorm) {
      return res.status(404).json({ message: 'Dorm not found' });
    }
    res.json({ message: 'Dorm deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 