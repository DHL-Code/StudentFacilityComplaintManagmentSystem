const mongoose = require('mongoose');

const dormSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d+$/.test(v); // Ensure number is numeric
      },
      message: props => `${props.value} is not a valid dorm number!`
    }
  },
  block: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  autoIndex: true
});

// Ensure unique combination of number and block
dormSchema.index({ number: 1, block: 1 }, { unique: true });

// Pre-save middleware to validate dorm number within block
dormSchema.pre('save', async function(next) {
  try {
    // Check if the dorm number already exists in this block
    const Dorm = mongoose.model('Dorm');
    const existingDorm = await Dorm.findOne({
      number: this.number,
      block: this.block,
      _id: { $ne: this._id } // Exclude current dorm when updating
    });

    if (existingDorm) {
      throw new Error(`Dorm number ${this.number} already exists in this block`);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static method to check if a dorm number exists in a block
dormSchema.statics.isDormNumberTaken = async function(number, blockId) {
  const dorm = await this.findOne({ number, block: blockId });
  return !!dorm;
};

const Dorm = mongoose.model('Dorm', dormSchema);

module.exports = Dorm; 