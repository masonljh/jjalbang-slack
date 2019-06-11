var express = require('express');
var router = express.Router();
var jjalSelector = require('../libs/jjalSelector');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {title: 'jjalbang'});
});

router.post('/', function(req, res, next) {
  var page = 0;
  if (!req.body.tag) {
    res.status(400).json({code: '400', msg: 'Tag is undefined!'});
    return;
  }

  if (req.body.page) {
    page = req.body.page;
  }

  jjalSelector.getJJalList(req.body.tag, page, function(err, result) {
    if (err) {
      res.json(err);
      return;
    }

    result.challenge = 'yl3XiPOrmGPIqzHXpiAX2U0N';
    res.status(200).json(result);
  });
});

module.exports = router;
