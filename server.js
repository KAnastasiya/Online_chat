var express = require('express');
var app = express();

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
});

app.post('/message', function(req, res) {
  res.sendStatus(200);
});

app.get('/message', function(req, res) {
  res.json({'message': 'Чем могу помочь?'});
});

app.use(express.static('./'));
app.listen(8080, function() {});
