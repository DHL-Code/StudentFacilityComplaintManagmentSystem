const mongoose = require('mongoose');
const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'College',
        required: true,
        index: true // Add this line
    }
});
module.exports = mongoose.model('Department', departmentSchema);