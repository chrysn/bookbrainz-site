var path = require('path');

// require dependencies
var express = require('express');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var staticCache = require('express-static-cache');

var Promise = require('bluebird');
Promise.longStackTraces();

var auth = require('./src/server/helpers/auth');
var config = require('./src/server/helpers/config');
var bbws = require('./src/server/helpers/bbws');

// initialize application
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'jade');
app.locals.basedir = app.get('views');

// webservice
app.set('webservice', config.site.webservice);

app.set('trust proxy', config.site.proxyTrust);

app.use(favicon(path.join(__dirname, 'static/images/favicon.ico')));

if (app.get('env') !== 'testing') {
	app.use(logger('dev'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(staticCache(path.join(__dirname, 'static/js'), {
	buffer: true
}));

app.use(express.static(path.join(__dirname, 'static')));

app.use(session({
	store: new RedisStore({
		host: config.session.redis.host,
		port: config.session.redis.port,
		ttl: config.session.redis.ttl
	}),
	cookie: {
		secure: config.session.secure
	},
	secret: config.session.secret,
	resave: false,
	saveUninitialized: false
}));

auth.init(app);

/* Add middleware to set variables used for every rendered route. */
app.use(function(req, res, next) {
	res.locals.user = req.user;

	// Get the latest count of messages in the user's inbox.
	if (req.session && req.session.bearerToken) {
		bbws.get('/message/inbox', {
				accessToken: req.session.bearerToken
			})
			.then(function(list) {
				res.locals.inboxCount = list.objects.length;
			})
			.catch(function(err) {
				console.log(err.stack);

				res.locals.inboxCount = 0;
			})
			.finally(function() {
				next();
			});
	} else {
		res.locals.inboxCount = 0;
		next();
	}
});

// set up routes
require('./src/server/routes')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);

		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);

	res.render('error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;
