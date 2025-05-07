const express = require('express');
const Log = require('../models/Log.js');
const router = express.Router();
const auth = require('../middlewares/auth');
const allowRoles = require('../middlewares/allowRoles');

router.get('/',auth, allowRoles('admin'), async (req, res) => {
  const logs = await Log.find().populate('userId');
  res.json(logs);
});

module.exports = router;