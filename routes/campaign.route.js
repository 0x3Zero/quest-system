const express = require('express');
const campaignController = require('../controllers/campaign.controller');
const router = new express.Router();

router.get(
  '/:campaignId/submissions',
  campaignController.updateCampaignSubmissions
);

router.post('/', campaignController.createCampaign);
router.get(
  '/token/:tokenId',
  campaignController.getAllCampaignsWithParticipationFlag
);
router.get('/', campaignController.getAllCampaigns);
router.get('/:id', campaignController.getCampaign);
router.patch('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);
router.get(
  '/:campaignId/participants/:participantId/reward-eligibility',
  campaignController.checkRewardEligibility
);

router.get('/:campaignId/participants', campaignController.getAllParticipants);
router.get(
  '/:campaignId/participants/completed-all-quests',
  campaignController.getParticipantsCompletedAllQuests
);

router.get(
  '/:campaignId/generate-merkle-root',
  campaignController.generateMerkleRoot
);

router.get(
  '/:campaignId/address/:address/generate-merkle-proof',
  campaignController.generateMerkleProof
);

router.get(
  '/participant/token/:tokenId',
  campaignController.getCampaignByTokenId
);

module.exports = router;
