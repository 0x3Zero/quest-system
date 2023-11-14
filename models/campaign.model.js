const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    banner: {
      type: String,
    },
    isOngoing: {
      type: Boolean,
      required: true,
      default: false,
    },
    expiredAt: {
      type: Date,
      required: function () {
        return !this.isOngoing;
      },
    },
    submissions: [
      {
        type: String,
      },
    ],
    startedAt: {
      type: Date,
      required: function () {
        return !this.isOngoing;
      },
    },
    perkIds: [
      {
        type: Number,
      },
    ],
    merkleTreeRoot: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
