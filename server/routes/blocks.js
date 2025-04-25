const express = require('express');
const router = express.Router();
const Block = require('../models/Block');
const auth = require('../middleware/auth');

// Get all blocks
router.get('/', auth, async (req, res) => {
  try {
    const blocks = await Block.find();
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single block by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }
    res.json(block);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new block
router.post('/', auth, async (req, res) => {
  try {
    const { number } = req.body;

    // Validate input
    if (!number) {
      return res.status(400).json({ message: 'Block number is required' });
    }

    // Check if block number is already taken
    const existingBlock = await Block.findOne({ number });
    if (existingBlock) {
      return res.status(400).json({ message: `Block number ${number} already exists` });
    }

    // Create new block
    const block = new Block({
      number
    });

    await block.save();
    res.status(201).json(block);
  } catch (error) {
    console.error('Error creating block:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update a block
router.put('/:id', auth, async (req, res) => {
  try {
    const { number } = req.body;

    // Validate input
    if (!number) {
      return res.status(400).json({ message: 'Block number is required' });
    }

    // Check if the new block number is already taken by another block
    const existingBlock = await Block.findOne({ 
      number,
      _id: { $ne: req.params.id } // Exclude current block
    });
    if (existingBlock) {
      return res.status(400).json({ message: `Block number ${number} already exists` });
    }

    const block = await Block.findByIdAndUpdate(
      req.params.id,
      { number },
      { new: true, runValidators: true }
    );

    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    res.json(block);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a block
router.delete('/:id', auth, async (req, res) => {
  try {
    const block = await Block.findByIdAndDelete(req.params.id);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }
    res.json({ message: 'Block deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 