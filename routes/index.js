var express = require('express');
var router = express.Router();
var jjalSelector = require('../libs/jjalSelector');

/* GET addToSlack page. */
router.get('/auth', function(req, res, next) {
  res.sendFile(__dirname + '/add_to_slack.html');
});

router.get('/auth/redirect', function(req, res, next) {
  var options = {
    uri: 'https://slack.com/api/oauth.access?code='
        + req.query.code +
        '&client_id=' + process.env.CLIENT_ID +
        '&client_secret=' + process.env.CLIENT_SECRET +
        '&redirect_uri=' + process.env.REDIRECT_URI,
    method: 'GET'
  }

  request(options, (error, response, body) => {
      var JSONresponse = JSON.parse(body)
      if (!JSONresponse.ok){
          console.log(JSONresponse)
          res.send("Error encountered: \n"+JSON.stringify(JSONresponse)).status(200).end()
      }else{
          console.log(JSONresponse)
          res.send("Success!")
      }
  });
});

router.post('/', function(req, res, next) {
  var page = 0;
  var tag;

  if (!req.body.text) {
    res.json({
      'response_type': 'ephemeral', 
      'text': 'You should input tag.'
    });
    return;
  }

  tag = req.body.text;

  if (req.body.text.page) {
    page = req.body.text.page;
  }

  jjalSelector.getJJalList(tag, page, function(err, result) {
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
