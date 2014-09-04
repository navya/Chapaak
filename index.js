/**
 * Module dependencies.
 */
var _ = require('koa-route');
var serve = require('koa-static');
var parse = require('co-busboy');
var koa = require('koa');
var fs = require('fs');
var monk = require('monk');
var co_monk= require('co-monk');
var db = monk('localhost/chapaak');
var pic = co_monk(db.get('pic'));
var app = koa();

app.use(function *(next) {
  try {
    yield next;
  } catch (err) {
    this.status = err.status || 500;
    this.body = err.message;
    this.app.emit('error', err, this);
  }
});


var api = {};

api.upload = function *upload(){
   var parts = parse(this);
    var part, uobj = {};
    while (part = yield parts) {
        if (part.pipe) {
            uobj.date = Date.now();
            uobj.name = uobj.date+'$'+part.filename;
            uobj.url = '/uploads/'+uobj.name;
            var stream = fs.createWriteStream(__dirname + '/public/uploads/' + uobj.name );
            part.pipe(stream);
            console.log('uploading %s -> %s', part.filename, stream.path);
        } else {
            //This is not the file so we store it in the object
            uobj[part[0]] = part[1];
        }
    }
    var res = yield pic.insert(uobj);
    this.body = res ;
  //  this.redirect('/');
}

api.all = function *all(){
    var res = yield pic.find({});
    this.body = res ;
  //  this.redirect('/');
}
api.range = function *all(){
    console.log(this.req);
      //  var query = this.req.uri.query ;
        var limit =  5;
        var skip =  0 ;
    var res = yield pic.find({},{
    "limit": limit,
    "sort": "date",
    "skip": skip
});
    this.body = res ;
  //  this.redirect('/');
}

// serve files from ./public
app.use(serve(__dirname + '/public'));
// handle uploads
app.use(_.post('/upload', api.upload));
app.use(_.get('/all', api.all));
app.use(_.get('/recent', api.range));
// listen
app.listen(3000);
console.log('listening on port 3000');
