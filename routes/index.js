var express = require('express');
var router = express.Router();
var jjalSelector = require('../libs/jjalSelector');

/* GET home page. */
router.get('/', function(req, res, next) {
  var page = 0;
  if (!req.query.tag) {
    res.status(400).json({code: '400', msg: 'Query is undefined!'});
    return;
  }

  if (req.params.page) {
    page = req.query.page;
  }

  jjalSelector.getJJalList(req.query.tag, page, function(err, result) {
    if (err) {
      res.json(err);
      return;
    }

    res.status(200).json(result);
  });
});

module.exports = router;
