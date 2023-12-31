const Campaign = require('../models/campaign.model');
const Participant = require('../models/participant.model');
const Quest = require('../models/quest.model');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require('ethers');

const abi = [
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
];

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
      console.log(error);
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

  async getAllCampaignsWithParticipationFlag(req, res) {
    try {
      const participantTokenId = req.params.tokenId;

      const participantQuests = await Participant.find({
        tokenId: participantTokenId,
      });

      const participantQuestIds = participantQuests.map((participant) =>
        participant.quest.toString()
      );
      let campaigns = await Campaign.find({});

      const campaignsWithQuests = await Promise.all(
        campaigns.map(async (campaign) => {
          const quests = await Quest.find({ campaign: campaign._id });

          const questsWithParticipationFlag = quests.map((quest) => ({
            ...quest.toObject(),
            isParticipated: participantQuestIds.includes(quest._id.toString()),
          }));

          return {
            ...campaign.toObject(),
            quests: questsWithParticipationFlag,
          };
        })
      );

      res.send(campaignsWithQuests);
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  },

  async getCampaignByTokenId(req, res) {
    try {
      const participantTokenId = req.params.tokenId;

      const participants = await Participant.find({
        tokenId: participantTokenId,
      });
      const questIds = participants.map((participant) => participant.quest);
      const uniqueQuests = await Quest.find({ _id: { $in: questIds } });
      const campaignIds = uniqueQuests.map((quest) =>
        quest.campaign.toString()
      );
      const uniqueCampaignIds = [...new Set(campaignIds)];

      const campaigns = await Campaign.find({
        _id: { $in: uniqueCampaignIds },
      });

      res.send(campaigns);
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

      console.log(quests);

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

  async updateCampaignSubmissions(req, res) {
    try {
      const campaignId = req.params.campaignId;
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).send({ error: 'Campaign not found.' });
      }

      const quests = await Quest.find({ campaign: campaign._id });

      const completedParticipants = {};
      for (const quest of quests) {
        const participants = await Participant.find({
          quest: quest._id,
        });
        participants.forEach((participant) => {
          if (completedParticipants[participant.tokenId]) {
            completedParticipants[participant.tokenId]++;
          } else {
            completedParticipants[participant.tokenId] = 1;
          }
        });
      }

      const allQuestsCount = quests.length;
      const completedTokenId = Object.keys(completedParticipants).filter(
        (tokenId) => completedParticipants[tokenId] === allQuestsCount
      );

      const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL);
      const contract = new ethers.Contract(
        process.env.NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const ownershipPromises = completedTokenId.map(async (tokenId) => {
        const ownerAddress = await contract.ownerOf(tokenId);
        return ownerAddress;
      });

      const participantsWithOwnership = await Promise.all(ownershipPromises);

      if (!campaign.submissions) {
        campaign.submissions = participantsWithOwnership;
        campaign.save();
      } else {
        await Campaign.findByIdAndUpdate(campaignId, {
          $addToSet: { submissions: { $each: participantsWithOwnership } },
        });
      }

      res.send({
        campaign,
        addresses: participantsWithOwnership,
      });
    } catch (error) {
      console.log(error);
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

      if (!campaign.submissions || !campaign.submissions.length) {
        return res.status(400).send({
          error: 'Campaign not yet finalized, run /submissions endpoint.',
        });
      }

      const leaves = campaign.submissions.map((submission) =>
        keccak256(submission)
      );

      const tree = new MerkleTree(leaves, keccak256);
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

      if (!campaign.submissions || !campaign.submissions.length) {
        return res.status(400).send({
          error: 'Campaign not yet finalized, run /submissions endpoint.',
        });
      }

      if (!campaign.merkleTreeRoot) {
        return res.status(400).send({
          error: 'Campaign have no merkle root.',
        });
      }

      if (campaign.submissions.length === 1) {
       campaign.submissions = campaign.submissions.flatMap(i => [i,i]) 
      }

      const leaves = campaign.submissions.map((submission) =>
        keccak256(submission)
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
