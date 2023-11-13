var express = require('express');
var router = express.Router();
const questController = require('../controllers/quest.controller');
const participantController = require('../controllers/participant.controller');

router.post('/quests', questController.createQuest);

/**
 * @swagger
 * /quests:
 *   get:
 *     summary: Retrieve a list of quests
 *     responses:
 *       200:
 *         description: A list of quests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Quest'
 *
 * components:
 *   schemas:
 *     Quest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 */
router.get('/quests', questController.getAllQuests);

/**
 * @swagger
 * /quests/{id}:
 *   get:
 *     summary: Retrieve a specific quest by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the quest
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quest data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Quest'
 *       404:
 *         description: Quest not found
 */
router.get('/quests/:id', questController.getQuest);

/**
 * @swagger
 * /quests/{id}:
 *   patch:
 *     summary: Update a quest
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the quest
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Quest'
 *     responses:
 *       200:
 *         description: Successfully updated quest
 *       404:
 *         description: Quest not found
 */
router.patch('/quests/:id', questController.updateQuest);

/**
 * @swagger
 * /quests/{id}:
 *   delete:
 *     summary: Delete a quest
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the quest
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully deleted quest
 *       404:
 *         description: Quest not found
 */
router.delete('/quests/:id', questController.deleteQuest);

/**
 * @swagger
 * /quests/{questId}/participants:
 *   post:
 *     summary: Add a participant to a quest
 *     parameters:
 *       - in: path
 *         name: questId
 *         required: true
 *         description: Unique ID of the quest
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Participant'
 *     responses:
 *       201:
 *         description: Participant added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Quest not found
 */
router.post(
  '/quests/:questId/participants',
  participantController.addParticipant
);

/**
 * @swagger
 * /quests/{questId}/participants:
 *   get:
 *     summary: Get all participants of a quest
 *     parameters:
 *       - in: path
 *         name: questId
 *         required: true
 *         description: Unique ID of the quest
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of participants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Participant'
 */
router.get(
  '/quests/:questId/participants',
  participantController.getParticipants
);

/**
 * @swagger
 * /quests/{questId}/participants/{id}:
 *   patch:
 *     summary: Update a participant's details
 *     parameters:
 *       - in: path
 *         name: questId
 *         required: true
 *         description: Unique ID of the quest
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique ID of the participant
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Participant'
 *     responses:
 *       200:
 *         description: Successfully updated participant
 *       404:
 *         description: Participant or quest not found
 */
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

router.patch(
  '/quests/:questId/participants/:participantId/complete',
  participantController.markParticipantComplete
);

router.patch(
  '/quests/:questId/participants/:participantId/verify',
  participantController.verifyParticipant
);

module.exports = router;
