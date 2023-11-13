const Quest = require('../models/quest.model');

const questController = {
  async createQuest(req, res) {
    try {
      const quest = new Quest(req.body);
      const campaign = await Campaign.findById(req.params.campaign);

      if (!campaign) {
        return res.status(404).send({ error: 'Campaign not found.' });
      }
      await quest.save();
      res.status(201).send(quest);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async getAllQuests(req, res) {
    try {
      const quests = await Quest.find({}).populate('campaign');
      res.send(quests);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getQuest(req, res) {
    try {
      const quest = await Quest.findById(req.params.id).populate('campaign');
      if (!quest) {
        return res.status(404).send();
      }
      res.send(quest);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async updateQuest(req, res) {
    try {
      const quest = await Quest.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!quest) {
        return res.status(404).send();
      }
      res.send(quest);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async deleteQuest(req, res) {
    try {
      const quest = await Quest.findByIdAndDelete(req.params.id);
      if (!quest) {
        return res.status(404).send();
      }
      res.send(quest);
    } catch (error) {
      res.status(500).send(error);
    }
  },
};

module.exports = questController;
