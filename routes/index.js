var express = require('express');
var router = express.Router();
var jjalSelector = require('../libs/jjalSelector');
var request = require('request');

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
  res.status(200).end();

  let responseUrl = req.body.response_url;
  if (req.body.token != process.env.TOKEN) {
    res.status(403).end("Access forbidden");
    return;
  }

  var message = {
    text: 'This is your first interactive message',
    attachments: [
      {
        text: 'Building buttons is easy right?',
        fallback: 'Shame... buttons aren\'t supported in this land',
        callback_id: 'button_tutorial',
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: [
          {
            name: 'cancel',
            text: 'cancel',
            type: 'button',
            value: 'cancel',
            style: 'danger'
          },
          {
            name: 'prev',
            text: 'prev',
            type: 'button',
            value: 'prev'
          },
          {
            name: 'next',
            text: 'next',
            type: 'button',
            value: 'next'
          }
        ]
      }
    ]
  };

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

    sendMessageToSlackResponseURL(responseUrl, message);

    // res.json({
    //   'response_type': 'in_channel',
    //   'text': result
    // });
  });
});

function sendMessageToSlackResponseURL(responseURL, JSONmessage){
  var postOptions = {
      uri: responseURL,
      method: 'POST',
      headers: {
          'Content-type': 'application/json'
      },
      json: JSONmessage
  }
  request(postOptions, (error, response, body) => {
      if (error){
          // handle errors as you see fit
      }
  })
}

module.exports = router;
