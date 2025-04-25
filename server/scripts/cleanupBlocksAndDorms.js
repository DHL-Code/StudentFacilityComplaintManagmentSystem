const mongoose = require('mongoose');
const Block = require('../models/Block');
const Dorm = require('../models/Dorm');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myDatabase', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Drop all indexes from both collections
    await Block.collection.dropIndexes();
    await Dorm.collection.dropIndexes();
    console.log('All indexes dropped successfully');
    
    // Recreate the correct indexes
    await Block.collection.createIndex({ number: 1 }, { unique: true });
    await Dorm.collection.createIndex({ number: 1, block: 1 }, { unique: true });
    console.log('New indexes created successfully');

    // Clean up invalid dorms (those referencing non-existent blocks)
    const dorms = await Dorm.find();
    const blocks = await Block.find();
    const blockIds = blocks.map(block => block._id.toString());

    for (const dorm of dorms) {
      if (!blockIds.includes(dorm.block.toString())) {
        await Dorm.deleteOne({ _id: dorm._id });
        console.log(`Deleted dorm ${dorm.number} with invalid block reference`);
      }
    }

    // Validate and fix block capacities
    for (const block of blocks) {
      const blockDorms = await Dorm.find({ block: block._id });
      const totalDormCapacity = blockDorms.reduce((sum, dorm) => sum + dorm.capacity, 0);
      
      if (totalDormCapacity > block.capacity) {
        console.log(`Warning: Block ${block.number} has dorms exceeding its capacity`);
        console.log(`Block capacity: ${block.capacity}, Total dorm capacity: ${totalDormCapacity}`);
      }
    }

    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('Could not connect to MongoDB:', err);
  process.exit(1);
}); 