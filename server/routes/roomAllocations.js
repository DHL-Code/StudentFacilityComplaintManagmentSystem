const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// Get all allocations
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find().populate('allocations.student');
    const allocations = rooms.flatMap(room => 
      room.allocations.map(allocation => ({
        ...allocation.toObject(),
        room: {
          _id: room._id,
          roomNumber: room.roomNumber,
          type: room.type
        }
      }))
    );
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get allocations for a specific student
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      'allocations.student': req.params.studentId
    }).populate('allocations.student');

    const allocations = rooms.flatMap(room => 
      room.allocations
        .filter(allocation => allocation.student._id.toString() === req.params.studentId)
        .map(allocation => ({
          ...allocation.toObject(),
          room: {
            _id: room._id,
            roomNumber: room.roomNumber,
            type: room.type
          }
        }))
    );

    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create allocation (admin only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  try {
    const room = await Room.findById(req.body.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room is available
    if (room.status !== 'available') {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Check if student is already allocated
    const existingAllocation = room.allocations.find(
      allocation => allocation.student.toString() === req.body.studentId
    );
    if (existingAllocation) {
      return res.status(400).json({ message: 'Student is already allocated to a room' });
    }

    // Check if room has capacity
    if (room.allocations.length >= room.capacity) {
      return res.status(400).json({ message: 'Room is at full capacity' });
    }

    room.allocations.push({
      student: req.body.studentId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      status: 'active'
    });

    // Update room status if full
    if (room.allocations.length === room.capacity) {
      room.status = 'occupied';
    }

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update allocation (admin only)
router.patch('/:roomId/:allocationId', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const allocation = room.allocations.id(req.params.allocationId);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (req.body.startDate) allocation.startDate = req.body.startDate;
    if (req.body.endDate) allocation.endDate = req.body.endDate;
    if (req.body.status) allocation.status = req.body.status;

    // Update room status based on allocations
    const activeAllocations = room.allocations.filter(a => a.status === 'active');
    room.status = activeAllocations.length === room.capacity ? 'occupied' : 'available';

    await room.save();
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete allocation (admin only)
router.delete('/:roomId/:allocationId', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const allocation = room.allocations.id(req.params.allocationId);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    allocation.remove();
    
    // Update room status
    const activeAllocations = room.allocations.filter(a => a.status === 'active');
    room.status = activeAllocations.length === room.capacity ? 'occupied' : 'available';

    await room.save();
    res.json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 