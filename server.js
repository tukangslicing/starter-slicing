'use strict';

var statics = require('node-static');

var options = {
	cache: 86400,
	serverInfo:'www.digitalocean.com/?refcode=731164068215',
	headers: {
		'X-Creator':'Follow @hengkiardo'
	}
}

if (process.env.NODE_ENV === 'production') {
	options.gzip = true
}

var Server = new statics.Server('./', options);

var port = 4041;

require('http').createServer(function (request, response) {

	request.addListener('end', function () {

  	Server.serve(request, response,function (e, res) {
      if (e && (e.status === 404)) {
         Server.serveFile('/404.html', 404, {}, request, response);
      }
    });
  }).resume();

}).listen(port);

if (process.env.NODE_ENV !== 'production') {
	console.log("> node-static is listening on http://127.0.0.1:"+ port);
	require('open')("http://127.0.0.1:"+ port);
}
