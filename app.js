
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    consolidate = require('consolidate'),
    path = require('path'),
    redis = require('redis');

var app = express(),
    client = redis.createClient();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hjs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


// Move this code!
var gallery = {
  image: function(req, res){
    var hash = req.params.hash,
        field = req.params.field;
    if (hash == 'teapot') {
      res.send(418);
      return;
    }

    // Now back to the serious stuff
    if (!/^[A-Fa-f\d]{56}$/.test(hash)) {
      res.send(500, {'error': 'invalid hash'});
    }

    if (field) {
      client.hget(hash, field, function(err, ret) {
        if (err) {
          // TODO: Error handling
          res.send(500, {'error': err.toString()});
          return;
        }
        var data = {hash: hash};
        data[field] = ret;
        res.send(data);
      });
    } else {
      client.hgetall(hash, function(err, ret) {
        if (err) {
          // TODO: Error handling
          res.send(500, {'error': err.toString()});
          return;
        }
        if (!ret) {
          // TODO: Error handling
          res.send(404, {'error': 'not found'});
          return;
        }
        res.send(ret);
      });
    }
  },
  list: function(req, res){
    var get_images = function(start, end) {
      client.lrange('image_list', start, end, function(err, ret) {
        if (err) {
          // TODO: Error handling
          res.send(500, {'error': err.toString()});
          return;
        }
        res.send(ret);
      });
    };

    var op = req.params.operation;

    switch (true) {
      case /^all$/.test(op):
        get_images(0, Math.pow(2, 32));
        break;
      case /^\d+-\d+$/.test(op):
        var match = /(\d+)-(\d+)/.exec(op);
        get_images(Number(match[1]), Number(match[2]));
        break;
      case /^\d+$/.test(op):
        var index = Number(op);
        get_images(index, index);
        break;
      default:
        res.send(500, {'error': 'unknown operation'});
        break;
    }
  }
};
// End


app.get('/', routes.index);
app.get('/list/:operation', gallery.list);
app.get('/image/:hash/:field?', gallery.image);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
