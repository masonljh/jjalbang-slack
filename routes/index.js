var express = require('express');
var router = express.Router();
var jjalSelector = require('../libs/jjalSelector');
var request = require('request');
var config = require('../config/config');

/* GET addToSlack page. */
router.get('/auth', function(req, res, next) {
  res.sendFile(__dirname + '/add_to_slack.html');
});

router.get('/auth/redirect', function(req, res, next) {
  var options = {
    uri: 'https://slack.com/api/oauth.access?code='
        + req.query.code +
        '&client_id=' + process.env.CLIENT_ID +
        '&client_secret=' + process.env.CLIENT_SECRET,
    method: 'GET'
  }

  request(options, (error, response, body) => {
    var JSONresponse = JSON.parse(body);
    if (!JSONresponse.ok){
      console.log(JSONresponse)
      res.send("Error encountered: \n"+JSON.stringify(JSONresponse)).status(200).end()
    } else {
      console.log(JSONresponse);
      res.send("Success!");
    }
  });
});

router.post('/slack/actions', function(req, res, next) {
  res.status(200).end();

  var payload = JSON.parse(req.body.payload);
  // console.log(payload);

  let responseUrl = payload.response_url;
  if (payload.token != process.env.TOKEN) {
    sendMessageToSlackResponseURL(responseUrl, {
      'response_type': 'ephemeral', 
      'text': 'Forbidden'
    });
    return;
  }
  
  if (payload.actions.length === 0) {
    return;
  }

  var action = payload.actions[0];
  let strings = action.value.split(',');
  let tag = strings[0];
  var page = Number.parseInt(strings[1]);
  var idx = Number.parseInt(strings[2]);
  var message;

  switch(action.name) {
    case 'prev':
      // console.log('prev');
      if (idx > 0) {
        idx--;
      } else {
        if (page !== 0) {
          page--;
          idx = 23;
        }
      }
      message = createSelectMessage(tag, page, idx);
      break;
    case 'next':
      // console.log('next');
      if (idx < 23) {
        idx++;
      } else {
        page++;
        idx = 0;
      }
      message = createSelectMessage(tag, page, idx);
      break;
    case 'send':
      // console.log('send');
      sendMessageToSlackResponseURL(responseUrl, {
        'response_type': 'in_channel',
        'replace_original': true,
        'attachments': [{
          'blocks': [
            {
              "type": "image",
              "title": {
                "type": "plain_text",
                "text": tag,
                "emoji": true
              },
              "image_url": strings[3],
              "alt_text": tag
            }
          ]
        }]
      });
      return;
  }

  jjalSelector.getJJalList(tag, page, function(err, result) {
    if (err) {
      sendMessageToSlackResponseURL(responseUrl, {
        'response_type': 'ephemeral', 
        'text': 'Sorry, that didn\'t work. Please try again.'
      });
      return;
    }

    var jjalStr = result[idx].list_jjal;
    let startIdx = jjalStr.indexOf('<img src=\"/files') + 10;
    let endIdx = -1;

    if (jjalStr.indexOf('.jpg') != -1) {
      endIdx = jjalStr.indexOf('.jpg') + 4;
    } else if (jjalStr.indexOf('.png') != -1) {
      endIdx = jjalStr.indexOf('.png') + 4;
    } else if (jjalStr.indexOf('.gif') != -1) {
      endIdx = jjalStr.indexOf('.gif') + 4;
    } else if (jjalStr.indexOf('.jpeg') != -1) {
      endIdx = jjalStr.indexOf('.jpeg') + 5;
    } else {
      sendMessageToSlackResponseURL(responseUrl, {
        'response_type': 'ephemeral', 
        'text': '해당 이미지가 존재하지 않습니다.'
      });
      return;
    }

    message.attachments[0].blocks[2].image_url = 'http://' + config.hostname + jjalStr.substring(startIdx, endIdx);
    message.attachments[1].actions[2].value = message.attachments[1].actions[2].value + ',' + message.attachments[0].blocks[2].image_url;

    console.log(message.attachments[0].blocks[2].image_url);

    sendMessageToSlackResponseURL(responseUrl, message);
  });
});

router.post('/', function(req, res, next) {
  res.status(200).end();

  let responseUrl = req.body.response_url;
  if (req.body.token != process.env.TOKEN) {
    sendMessageToSlackResponseURL(responseUrl, {
      'response_type': 'ephemeral', 
      'text': 'Forbidden'
    });
    return;
  }

  if (!req.body.text) {
    sendMessageToSlackResponseURL(responseUrl, {
      'response_type': 'ephemeral', 
      'text': 'You should input tag.'
    });
    return;
  }

  var message = createSelectMessage(req.body.text, 0, 0);
  jjalSelector.getJJalList(req.body.text, 0, function(err, result) {
    if (err) {
      sendMessageToSlackResponseURL(responseUrl, {
        'response_type': 'ephemeral', 
        'text': 'Sorry, that didn\'t work. Please try again.'
      });
      return;
    }

    var jjalStr = result[0].list_jjal;
    let startIdx = jjalStr.indexOf('<img src=\"/files') + 10;
    let endIdx = -1;

    if (jjalStr.indexOf('.jpg') != -1) {
      endIdx = jjalStr.indexOf('.jpg') + 4;
    } else if (jjalStr.indexOf('.png') != -1) {
      endIdx = jjalStr.indexOf('.png') + 4;
    } else if (jjalStr.indexOf('.gif') != -1) {
      endIdx = jjalStr.indexOf('.gif') + 4;
    } else if (jjalStr.indexOf('.jpeg') != -1) {
      endIdx = jjalStr.indexOf('.jpeg') + 5;
    } else {
      sendMessageToSlackResponseURL(responseUrl, {
        'response_type': 'ephemeral', 
        'text': '해당 이미지가 존재하지 않습니다.'
      });
      return;
    }

    message.attachments[0].blocks[2].image_url = 'http://' + config.hostname + jjalStr.substring(startIdx, endIdx);
    message.attachments[1].actions[2].value = message.attachments[1].actions[2].value + ',' + message.attachments[0].blocks[2].image_url;

    console.log(message.attachments[0].blocks[2].image_url);
    sendMessageToSlackResponseURL(responseUrl, message);
  });
});

function createSelectMessage(tag, page, idx) {
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
      "text": "jjal",
      "emoji": true
    },
    "image_url": "https://api.slack.com/img/blocks/bkb_template_images/beagle.png",
    "alt_text": "jjal"
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
  initializeButtons(buttons, ['prev', 'next', 'send'], tag, page, idx);

  message.attachments.push({ 'blocks': blocks });
  message.attachments.push(buttons);

  return message;
}

function initializeButtons(buttons, names, tag, page, idx) {
  for (var i in names) {
    buttons.actions.push({
      name: names[i],
      text: names[i],
      type: 'button',
      value: tag + ',' + page + ',' + idx
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
