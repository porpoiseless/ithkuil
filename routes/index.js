var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Ithkuil Dictionary',
			  subtitle: 'An interactive listing of Ithkuil roots, stems, and derivatives.',
			  masthead: "/images/masthead.svg" });
});

module.exports = router;
