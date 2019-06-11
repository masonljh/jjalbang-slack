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

  var message = {};
  message.attachments = [];
  var blocks = [];
  /* 타이틀 */
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*짤을 선택해주세요*\n(만약 해당 키워드에 해당하는 새로운 짤이 추가되었을 경우 다음 혹은 이전이 중복되서 보일 수 있습니다.)'
    }
  });

  /* 구분선 */
  blocks.push({
    type: 'divider'
  });

  /* 이미지 */
  blocks.push({
    "type": "image",
    "title": {
      "type": "plain_text",
      "text": "image1",
      "emoji": true
    },
    "image_url": "https://api.slack.com/img/blocks/bkb_template_images/beagle.png",
    "alt_text": "image1"
  });

  /* 구분선 */
  blocks.push({
    type: 'divider'
  });

  var buttons = {};
  buttons.fallback = 'You are unable to choose a jjal';
  buttons.callback_id = 'jjal_interaction';
  buttons.color = '#3AA3E3';
  buttons.attachment_type = 'default';
  buttons.actions = [];
  initializeButtons(buttons, ['prev', 'next', 'cancel', 'send'], tag);

  message.attachments.push({ 'blocks': blocks });
  message.attachments.push(buttons);

  var tag;

  if (!req.body.text) {
    sendMessageToSlackResponseURL(responseUrl, {
      'response_type': 'ephemeral', 
      'text': 'You should input tag.'
    });
    return;
  }

  tag = req.body.text;

  jjalSelector.getJJalList(tag, 0, function(err, result) {
    if (err) {
      sendMessageToSlackResponseURL(responseUrl, {
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

function initializeButtons(buttons, names, tag) {
  for (var i in names) {
    buttons.actions.push({
      name: names[i],
      text: names[i],
      type: 'button',
      value: tag + '/0/0'
    });
  }
}

function sendMessageToSlackResponseURL(responseUrl, JSONmessage){
  var postOptions = {
      uri: responseUrl,
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
