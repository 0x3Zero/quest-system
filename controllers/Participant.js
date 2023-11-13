const Participant = require('../models/Participant');
const Quest = require('../models/Quest');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

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

      const participant = new Participant({
        address: req.body.address,
        quest: req.params.questId,
      });
      await participant.save();
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
        req.body,
        { new: true }
      );
      if (!participant) {
        return res.status(404).send();
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

      const leaves = participants.map((participant) =>
        keccak256(participant.address)
      );
      let tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

      res.send({
        participants,
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

      const participants = await Participant.find({
        quest: req.params.questId,
        isCompleted: true,
      });

      const leaves = participants.map((participant) =>
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
