const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d+$/.test(v); // Ensure number is numeric
  },
      message: props => `${props.value} is not a valid block number!`
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { 
  autoIndex: true 
});

// Ensure unique block numbers
blockSchema.pre('save', async function(next) {
  try {
    const model = mongoose.model('Block');

    // Check if this is a new block
    if (this.isNew) {
      // Verify the block number doesn't exist
      const existingBlock = await model.findOne({ 
        number: this.number
      });
      if (existingBlock) {
        throw new Error(`Block number ${this.number} already exists`);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-remove middleware to check for and handle existing dorms
blockSchema.pre('remove', async function(next) {
  try {
    const Dorm = mongoose.model('Dorm');
    const dormsCount = await Dorm.countDocuments({ block: this._id });
    if (dormsCount > 0) {
      throw new Error(`Cannot delete block ${this.number} because it contains ${dormsCount} dorms`);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to check if a block number is taken
blockSchema.statics.isBlockNumberTaken = async function(number) {
  const block = await this.findOne({ number });
  return !!block;
};

const Block = mongoose.model('Block', blockSchema);

module.exports = Block; 