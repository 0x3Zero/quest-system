const Campaign = require('../models/campaign.model');
const Participant = require('../models/participant.model');
const Quest = require('../models/quest.model');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const campaignController = {
  async createCampaign(req, res) {
    try {
      const { isOngoing, expiredAt, startedAt } = req.body;
      if (!isOngoing && (!expiredAt || !startedAt)) {
        return res.status(400).send({
          error: 'Start and expiry dates are required for a ranged campaign.',
        });
      }

      const campaign = new Campaign(req.body);
      await campaign.save();
      res.status(201).send(campaign);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async getAllCampaigns(req, res) {
    try {
      const campaigns = await Campaign.find({});

      const campaignsWithQuests = await Promise.all(
        campaigns.map(async (campaign) => {
          const quests = await Quest.find({ campaign: campaign._id });
          return { ...campaign.toObject(), quests };
        })
      );

      res.send(campaignsWithQuests);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getCampaign(req, res) {
    try {
      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) {
        return res.status(404).send();
      }

      const quests = await Quest.find({ campaign: campaign._id });
      const campaignWithQuests = { ...campaign.toObject(), quests };

      res.send(campaignWithQuests);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async updateCampaign(req, res) {
    try {
      const campaign = await Campaign.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!campaign) {
        return res.status(404).send();
      }
      res.send(campaign);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async deleteCampaign(req, res) {
    try {
      const campaign = await Campaign.findByIdAndDelete(req.params.id);
      if (!campaign) {
        return res.status(404).send();
      }
      res.send(campaign);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async checkRewardEligibility(req, res) {
    try {
      const { participantId, campaignId } = req.params;
      const campaign = await Campaign.findById(campaignId).populate('quests');
      const questCompletionStatuses = await Promise.all(
        campaign.quests.map(async (quest) => {
          const participant = await Participant.findOne({
            quest: quest._id,
            _id: participantId,
          });
          return participant ? participant.isCompleted : false;
        })
      );

      const isEligibleForReward = questCompletionStatuses.every(
        (status) => status
      );
      res.status(200).send({ isEligibleForReward });
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async getAllParticipants(req, res) {
    try {
      const campaign = await Campaign.findById(req.params.campaignId);

      if (!campaign) {
        return res.status(404).send({ error: 'Campaign not found.' });
      }

      const quests = await Quest.find({ campaign: campaign._id }).populate(
        'participants'
      );

      const participants = quests.flatMap((quest) => quest.participants);

      res.send(participants);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getParticipantsCompletedAllQuests(req, res) {
    try {
      const campaign = await Campaign.findById(req.params.campaignId);

      if (!campaign) {
        return res.status(404).send({ error: 'Campaign not found.' });
      }

      const quests = await Quest.find({ campaign: campaign._id }).populate(
        'participants'
      );

      const completedParticipants = quests.flatMap((quest) =>
        quest.participants.filter((participant) => participant.isCompleted)
      );

      const uniqueParticipants = [...new Set(completedParticipants)];
      res.send(uniqueParticipants);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async generateMerkleRoot(req, res) {
    try {
      const campaignId = req.params.campaignId;
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).send({ error: 'Campaign not found.' });
      }

      const currentTime = new Date();
      if (!campaign.isOngoing && currentTime <= campaign.expiredAt) {
        return res.status(400).send({ error: 'Campaign has not expired yet.' });
      }

      const quests = await Quest.find({ campaign: campaignId });
      const participantIds = quests.flatMap((quest) => quest.participants);
      const verifiedParticipants = await Participant.find({
        _id: { $in: participantIds },
        isVerified: true,
      });

      const leaves = verifiedParticipants.map((participant) =>
        keccak256(participant.address)
      );
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const root = MerkleTree.bufferToHex(tree.getRoot());

      campaign.merkleTreeRoot = root;
      campaign.updatedAt = new Date();
      await campaign.save();

      res.send({ merkleRoot: root });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  },

  async generateMerkleProof(req, res) {
    try {
      const campaignId = req.params.campaignId;
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).send({ error: 'Campaign not found.' });
      }

      if (!req.params.address) {
        return res.status(400).send({ error: 'Empty or invalid address' });
      }

      const currentTime = new Date();
      if (!campaign.isOngoing && currentTime <= campaign.expiredAt) {
        return res.status(400).send({ error: 'Campaign has not expired yet.' });
      }

      const quests = await Quest.find({ campaign: campaignId });
      const participantIds = quests.flatMap((quest) => quest.participants);
      const verifiedParticipants = await Participant.find({
        _id: { $in: participantIds },
        isVerified: true,
      });

      const leaves = verifiedParticipants.map((participant) =>
        keccak256(participant.address)
      );

      const leaf = keccak256(req.params.address);
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const proof = tree
        .getProof(leaf)
        .map((x) => MerkleTree.bufferToHex(x.data));

      res.send({
        tree: MerkleTree.bufferToHex(tree.getRoot()),
        proof: proof,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  },
};

module.exports = campaignController;
