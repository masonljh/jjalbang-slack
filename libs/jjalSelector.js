const request = require('request');
const config = require('../config/config');

exports.getJJalList = function(tag, page, callback) {
	let url = 'http://' + config.hostname + '/ajax/ajaxlist.php';
	request({
		url: url,
		qs: {
			tag: tag, 
			page: page,
			mode: 'key'
		}
	}, function(error, response, body) {
		console.log(error);
		callback(error, JSON.parse(body));
	});
};