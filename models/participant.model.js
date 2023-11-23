const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    tokenId: {
      type: String,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    data: {
      type: String,
    },
    quest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest',
      required: true,
    },
  },
  { timestamps: true }
);

const Participant = mongoose.model('Participant', participantSchema);

module.exports = Participant;
