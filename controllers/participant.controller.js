const Campaign = require('../models/campaign.model');
const Participant = require('../models/participant.model');
const Quest = require('../models/quest.model');

const participantController = {
  async addParticipant(req, res) {
    try {
      const quest = await Quest.findById(req.params.questId);
      if (!quest) {
        return res.status(404).send({ error: 'Quest not found.' });
      }

      const currentTime = new Date();
      if (currentTime > quest.expiredAt || currentTime < quest.startedAt) {
        return res.status(400).send({ error: 'Quest is not active.' });
      }

      const existingParticipant = await Participant.findOne({
        tokenId: req.body.tokenId,
        quest: req.params.questId,
      });

      if (existingParticipant) {
        return res
          .status(409)
          .send({ error: 'This Nous Psyche has already completed the quest.' });
      }

      const participant = new Participant({
        tokenId: req.body.tokenId,
        quest: req.params.questId,
        data: req.body.data || '',
      });

      await participant.save();

      await Quest.findByIdAndUpdate(req.params.questId, {
        $push: { participants: participant._id },
      });

      res.status(201).send(participant);
    } catch (error) {
      console.log(error);
      res.status(400).send(error);
    }
  },

  async getParticipants(req, res) {
    try {
      const participants = await Participant.find({
        quest: req.params.questId,
      });
      res.send(participants);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async updateParticipant(req, res) {
    try {
      const quest = await Quest.findById(req.params.questId);
      if (!quest) {
        return res.status(404).send({ error: 'Quest not found.' });
      }

      const currentTime = new Date();
      if (currentTime > quest.expiredAt || currentTime < quest.startedAt) {
        return res.status(400).send({ error: 'Quest is not active.' });
      }

      const participant = await Participant.findOneAndUpdate(
        { _id: req.params.id, quest: req.params.questId },
        req.body
      );
      if (!participant) {
        return res.status(404).send();
      }
      res.send(participant);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async markParticipantComplete(req, res) {
    try {
      const participant = await Participant.findOneAndUpdate(
        { _id: req.params.participantId, quest: req.params.questId },
        { isCompleted: true, updatedAt: new Date() }
      );
      if (!participant) {
        return res.status(404).send({ error: 'Participant not found.' });
      }
      res.send(participant);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async verifyParticipant(req, res) {
    try {
      const participant = await Participant.findOneAndUpdate(
        { _id: req.params.participantId, quest: req.params.questId },
        { isVerified: true, updatedAt: new Date() }
      );
      if (!participant) {
        return res.status(404).send({ error: 'Participant not found.' });
      }
      res.send(participant);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async getCompletedParticipants(req, res) {
    try {
      const quest = await Quest.findById(req.params.questId);
      if (!quest) {
        return res.status(404).send({ error: 'Quest not found.' });
      }

      const currentTime = new Date();
      if (currentTime <= quest.expiredAt) {
        return res.status(400).send({ error: 'Quest has not expired yet.' });
      }

      const participants = await Participant.find({
        quest: req.params.questId,
        isCompleted: true,
      });

      const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL);
      const contract = new ethers.Contract(
        process.env.NFT_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const ownershipPromises = participants.map(async (participant) => {
        const ownerAddress = await contract.ownerOf(participant.tokenId);
        return ownerAddress;
      });

      const participantsWithOwnership = await Promise.all(ownershipPromises);

      const leaves = participantsWithOwnership.map((address) =>
        keccak256(address)
      );

      let tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

      res.send({
        participants: participantsWithOwnership,
        merkleRoot: MerkleTree.bufferToHex(tree.getRoot()),
      });
    } catch (error) {
      console.log(error);
      res.status(500).send(error);
    }
  },

  async generateMerkleProof(req, res) {
    try {
      const address = req.params.address;

      const quest = await Quest.findById(req.params.questId);
      if (!quest) {
        return res.status(404).send({ error: 'Quest not found.' });
      }

      const currentTime = new Date();
      if (currentTime <= quest.expiredAt) {
        return res.status(400).send({ error: 'Quest has not expired yet.' });
      }

      const leaves = quest.participants.map((participant) =>
        keccak256(participant.address)
      );

      const leaf = keccak256(address);
      let tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

      const proof = tree
        .getProof(leaf)
        .map((x) => MerkleTree.bufferToHex(x.data));

      res.send({
        tree: MerkleTree.bufferToHex(tree.getRoot()),
        proof: proof,
      });
    } catch (error) {
      res.status(500).send(error);
    }
  },
};

module.exports = participantController;
