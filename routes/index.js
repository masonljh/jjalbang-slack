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
    "text": "I am a test message http://slack.com",
    "attachments": [
      {
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Hello, Assistant to the Regional Manager Dwight! *Michael Scott* wants to know where you'd like to take the Paper Company investors to dinner tonight.\n\n *Please select a restaurant:*"
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Farmhouse Thai Cuisine*\n:star::star::star::star: 1528 reviews\n They do have some vegan options, like the roti and curry, plus they have a ton of salad stuff and noodles can be ordered without meat!! They have something for everyone here"
          },
          "accessory": {
            "type": "image",
            "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/c7ed05m9lC2EmA3Aruue7A/o.jpg",
            "alt_text": "alt text for image"
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Kin Khao*\n:star::star::star::star: 1638 reviews\n The sticky rice also goes wonderfully with the caramelized pork belly, which is absolutely melt-in-your-mouth and so soft."
          },
          "accessory": {
            "type": "image",
            "image_url": "https://s3-media2.fl.yelpcdn.com/bphoto/korel-1YjNtFtJlMTaC26A/o.jpg",
            "alt_text": "alt text for image"
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*Ler Ros*\n:star::star::star::star: 2082 reviews\n I would really recommend the  Yum Koh Moo Yang - Spicy lime dressing and roasted quick marinated pork shoulder, basil leaves, chili & rice powder."
          },
          "accessory": {
            "type": "image",
            "image_url": "https://s3-media2.fl.yelpcdn.com/bphoto/DawwNigKJ2ckPeDeDM7jAg/o.jpg",
            "alt_text": "alt text for image"
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Farmhouse",
                "emoji": true
              },
              "value": "click_me_123"
            },
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Kin Khao",
                "emoji": true
              },
              "value": "click_me_123"
            },
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Ler Ros",
                "emoji": true
              },
              "value": "click_me_123"
            }
          ]
        }
      ]
    }
  ]};


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
