var path = require('path'),
    fs = require('fs'),
    dotenv = require('dotenv'),
    express = require('express'),
    app = express(),
    pubDir = path.join(__dirname, '..', 'client'),
    envFile = path.join(__dirname, '..', '.env'),
    lessMiddleware = require('less-middleware'),
    mongoose = require('mongoose'),
    browserify = require('browserify-middleware'),
    config = require('../site/config'),
    bodyParser = require('body-parser'),
    urlParse = bodyParser.urlencoded({
        extended: true
    }),
    jsonParse = bodyParser.json();

global.__server__ = config.useServerRender;
global.__client__ = config.useClientRender;
global.__useBlog__ = config.useBlog;

// var pages = require('./routes/pages'),
//     api = require('./routes/api');


// load up .env file
if (fs.existsSync(envFile)) {
    dotenv.load();
}

var mongo_url = process.env.MONGO_URI || process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || process.env.MONGOSOUP_URL;
if (!mongo_url) {
    // var mockgoose = require('mockgoose');
    // mockgoose(mongoose);
    // mockgoose.reset();
    mongo_url = config.mongo.uri;
}

mongoose.connect(mongo_url);

if (config.seedUser) {
    //Reset verify DB.
    require('../site/seedVerify')();

    //Create users.
    require('../site/seedUser')();
    config.seedUser = false;
}
if (config.seedPost) {
    require('../site/seedPost')();
    config.seedPost = false;
}
// use models after potential mockgoose
// var auth = require('./utils/auth');

// serve up CSS from LESS. this is efficiently cached.
app.use(lessMiddleware(pubDir, {
    parser: {
        paths: [path.join(__dirname, '..')]
    }
}));

// // static server
app.use(express.static(pubDir));

// keep all auth-related routes at /auth/whatevs
// app.use('/auth', auth);

// app.use('/api', [urlParse, jsonParse], api);

//// experiment------------------------------------------------------
// var homePage = require('./pages/home');
// app.use('/', homePage);
// //-------------------------------------------------
// var loginPage = require('./pages/login');
// app.use('/login', loginPage)
// //-------------------------------------------------
// var logoutPage = require('./pages/logout');
// app.use('/logout', logoutPage)
// //-------------------------------------------------
// var registerPage = require('./pages/register');
// app.use('/register', registerPage)
// //-------------------------------------------------
// var verifyPage = require('./pages/verify');
// app.use('/verify', verifyPage)
// //-------------------------------------------------
// var blog = require('./pages/blog');
// var postPage = require('./pages/blog/post');
// app.use('/blog', blog);
// app.use('/post', postPage);
// //-------------------------------------------------
// var usersPage = require('./pages/user');
// app.use('/users', usersPage);
// //-------------------------------------------------
// var profilePage = require('./pages/profile');
// app.use('/profile', profilePage);
// //======================================================
console.log('server/index98-index.html', path.join(__dirname, 'index.html'));
console.log('server/index98-index.html', path.join(__dirname, '..', 'client', 'index.template.html'));
if (global.__server__) {
    if (global.__client__) {
        // browserify the entry-point. this is efficiently cached if NODE_ENV=production
        app.get('/app.js', browserify(path.join(pubDir, 'js', 'app.js'), {}));
    }
    //server-side render
    // app.use(pages);

    var verify = require('./pages/verify');
    app.use('/verify/:code', verify);

    app.get('/*', function(req, res) {
        res.redirect('/');
    });

} else {
    // browserify the entry-point. this is efficiently cached if NODE_ENV=production
    app.get('/app.js', browserify(path.join(pubDir, 'js', 'app.js'), {}));

    var apiLogin = require('./pages/login/apiLogin');
    app.use('/api/login', apiLogin);

    var apiBlog = require('./pages/blog/apiBlog');
    app.use('/api/blog', apiBlog);

    var apiPost = require('./pages/blog/apiPost');
    app.use('/api/post', apiPost);

    var apiProfile = require('./pages/profile/apiProfile');
    app.use('/api/profile', apiProfile);

    var apiUsers = require('./pages/user/apiUsers');
    app.use('/api/users', apiUsers);


    var apiRegister = require('./pages/register/apiRegister');
    app.use('/api/register', apiRegister);

    var apiVerify = require('./pages/verify/apiVerify');
    app.use('/api/verify', apiVerify);


    app.get('/*', function(req, res) {
        res.sendFile(path.join(__dirname, '..', 'client', 'index.client.html'));
    });
}

if (require.main === module) {
    var port = process.env.PORT || 3000;
    app.listen(port, function() {
        console.log('Listening on http://localhost:' + port);
        if (config.env === 'development' && config.useBrowsersync === true) {
            /**
             * Require Browsersync
             */
            var browserSync = require('browser-sync');

            /**
             * Run Browsersync with proxy config
             * Proxy is the main server of this app 
             */
            browserSync({
                //Use the main server as proxy
                proxy: config.baseUrl,
                //The client-side files are watched by browsersync. The server-related files are watched by nodemon
                files: ["./client"]
            });
        }

    });
}



module.exports = app;
