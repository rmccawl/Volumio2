var express = require('express');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Volumio - Audiophile Music Player' });
});
router.get('/debug', function(req, res) {
  res.render('debug', { title: 'Debug - Volumio' });
});
router.get('/about', function(req, res) {
  res.render('about', { title: 'About - Volumio' });
});
module.exports = router;


