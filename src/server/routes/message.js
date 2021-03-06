var express = require('express');
var router = express.Router();
var auth = require('../helpers/auth');

var bbws = require('../helpers/bbws');

var request = require('superagent');
require('superagent-bluebird-promise');

router.get('/send', auth.isAuthenticated, function(req, res) {
	res.render('editor/messageForm', {
		error: req.query.error,
		recipients: req.query.recipients,
		subject: req.query.subject,
		content: req.query.content
	});
});

function renderMessageList(view, req, res) {
	bbws.get('/message/' + view + '/', {
			accessToken: req.session.bearerToken
		})
		.then(function fetchMessageList(list) {
			res.render('editor/messageList', {
				view: view,
				messages: list
			});
		});
}

router.get('/inbox', auth.isAuthenticated, function(req, res) {
	renderMessageList('inbox', req, res);
});

router.get('/archive', auth.isAuthenticated, function(req, res) {
	renderMessageList('archive', req, res);
});

router.get('/sent', auth.isAuthenticated, function(req, res) {
	renderMessageList('sent', req, res);
});

router.get('/:id', auth.isAuthenticated, function(req, res) {
	var ws = req.app.get('webservice');
	request.get(ws + '/message/' + req.params.id)
		.set('Authorization', 'Bearer ' + req.session.bearerToken).promise()
		.then(function(messageResponse) {
			return messageResponse.body;
		})
		.then(function(message) {
			res.render('editor/message', {
				message: message
			});
		})
});

router.post('/send/handler', auth.isAuthenticated, function(req, res) {
	// This function should post a new message to the /message/send endpoint of the ws.
	var ws = req.app.get('webservice');

	// Parse recipient ids
	recipientIds = req.body.recipients.split(',').map(function(substr) {
		return parseInt(substr);
	});

	request.post(ws + '/message/sent/')
		.set('Authorization', 'Bearer ' + req.session.bearerToken)
		.send({
			recipient_ids: recipientIds,
			subject: req.body.subject,
			content: req.body.content,
		}).promise()
		.then(function() {
			res.redirect(303, '/message/sent');
		});
});


module.exports = router;
