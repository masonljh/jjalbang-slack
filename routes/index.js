var express = require('express');
var router = express.Router();
var jjalSelector = require('../libs/jjalSelector');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {title: 'jjalbang'});
});

router.post('/', function(req, res, next) {
  var page = 0;

  if (!req.body.text || !req.body.text.tag) {
    res.json({
      'response_type': 'ephemeral', 
      'text': 'You should input tag.'
    });
    return;
  }

  if (req.body.text.page) {
    page = req.body.text.page;
  }

  jjalSelector.getJJalList(req.body.text.tag, page, function(err, result) {
    if (err) {
      res.json({
        'response_type': 'ephemeral',
        'text': 'Sorry, that didn\'t work. Please try again.'
      });
      return;
    }

    res.json({
      'response_type': 'in_channel',
      'text': result
    });
  });
});

module.exports = router;
