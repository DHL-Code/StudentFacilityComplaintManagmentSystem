// models/Feedback.js
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        trim: true,
    },
    userId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    viewedByAdmin: {
        type: Boolean,
        default: false
    },
    viewedAt: {
        type: Date
    }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
module.exports = Feedback;