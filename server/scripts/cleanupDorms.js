const mongoose = require('mongoose');
const Dorm = require('../models/Dorm');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/student-facility-complaint-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Drop all indexes from the dorms collection
    await Dorm.collection.dropIndexes();
    console.log('All dorm indexes dropped successfully');
    
    // Recreate the correct compound index
    await Dorm.collection.createIndex({ number: 1, block: 1 }, { unique: true });
    console.log('New dorm index created successfully');
    
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