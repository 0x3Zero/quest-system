var express = require('express');
var router = express.Router();
const questController = require('../controllers/Quest');
const participantController = require('../controllers/Participant');

router.post('/quests', questController.createQuest);
router.get('/quests', questController.getAllQuests);
router.get('/quests/:id', questController.getQuest);
router.get('/quests/:code', questController.getQuestByCode);
router.patch('/quests/:id', questController.updateQuest);
router.delete('/quests/:id', questController.deleteQuest);

router.post(
  '/quests/:questId/participants',
  participantController.addParticipant
);
router.get(
  '/quests/:questId/participants',
  participantController.getParticipants
);
router.patch(
  '/quests/:questId/participants/:id',
  participantController.updateParticipant
);
router.get(
  '/quests/:questId/completed-participants',
  participantController.getCompletedParticipants
);
router.get(
  '/quests/:questId/participants/:address/proof',
  participantController.generateMerkleProof
);

module.exports = router;
