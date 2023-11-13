const Quest = require('../models/Quest');

const questController = {
  async createQuest(req, res) {
    try {
      const quest = new Quest(req.body);
      await quest.save();
      res.status(201).send(quest);
    } catch (error) {
      res.status(400).send(error);
    }
  },

  async getAllQuests(req, res) {
    try {
      const quests = await Quest.find({});
      res.send(quests);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getQuest(req, res) {
    try {
      const quest = await Quest.findById(req.params.id);
      if (!quest) {
        return res.status(404).send();
      }
      res.send(quest);
    } catch (error) {
      res.status(500).send(error);
    }
  },

  async getQuestByCode(req, res) {
    try {
      const code = req.params.code;
      const quest = await Quest.findOne({ code });

      if (!quest) {
        return res.status(404).send({ message: 'Quest not found.' });
      }

      res.send(quest);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  },

  async updateQuest(req, res) {
    try {
      const quest = await Quest.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
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
