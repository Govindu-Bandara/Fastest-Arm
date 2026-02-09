const mongoose = require('mongoose');

const speedSchema = new mongoose.Schema({
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  indexNumber: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female']
  },
  pitchSpeed: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  attemptNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  isTemporary: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
speedSchema.index({ gender: 1, pitchSpeed: -1 });
speedSchema.index({ indexNumber: 1 });
speedSchema.index({ timestamp: -1 });
speedSchema.index({ isTemporary: 1 });

module.exports = mongoose.model('Speed', speedSchema);