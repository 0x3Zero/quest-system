const mongoose = require('mongoose');

const questSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    actionData: {
      type: String,
    },
    actionText: {
      type: String,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Participant',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quest', questSchema);
