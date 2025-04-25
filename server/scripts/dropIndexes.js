const mongoose = require('mongoose');
const Block = require('../models/Block');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/student-facility-complaint-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Drop all indexes from the blocks collection
    await Block.collection.dropIndexes();
    console.log('All indexes dropped successfully');
    
    // Recreate the correct index
    await Block.collection.createIndex({ number: 1 }, { unique: true });
    console.log('New index created successfully');
    
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