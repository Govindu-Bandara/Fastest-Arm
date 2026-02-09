const express = require('express');
const router = express.Router();
const {
  submitSpeed,
  getLatestSpeeds,
  getLeaderboard,
  resetLeaderboard,
  exportResults
} = require('../controllers/speedsController');

router.post('/', submitSpeed);
router.get('/latest', getLatestSpeeds);
router.get('/leaderboard', getLeaderboard);
router.delete('/reset', resetLeaderboard);
router.get('/export', exportResults);

module.exports = router;