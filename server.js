var port = process.env.PORT || 5000,
	compression = require('compression'),
	serveStatic = require('serve-static'),
	express = require('express'),
	busboy = require('connect-busboy'),
	app = express();

app.use(compression());
app.use(serveStatic('docs'));
app.use('/demo', serveStatic('demo'));
app.use('/test', serveStatic('test'));
app.use('/src', serveStatic('src'));
app.use('/dist', serveStatic('dist'));

// for the demo
app.post('/upload-test', busboy({ immediate:true }), function(req, res) {
	var fields = {},
		i, f;
	/*
	for (i in req.body) {
		if (req.body.hasOwnProperty(i)) {
			fields[i] = req.body[i];
		}
	}
	for (i in req.files) {
		if (req.files.hasOwnProperty(i)) {
			f = req.files[i];
			fields[i] = {
				name : f.fieldname,
				filename : f.originalname,
				mimetype : f.mimetype,
				size : f.size,
				base64 : f.buffer.toString('base64')
			};
		}
	}
	*/

	if (req.busboy) {
		req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
			var chunks = [],
				size = 0;
			file.on('data', function(chunk) {
				chunks.push(chunk);
				size += chunk.length;
			});
			file.on('end', function() {
				fields[fieldname] = {
					name : fieldname,
					filename : filename,
					mimetype : mimetype,
					size : size,
					base64 : Buffer.concat(chunks, size).toString('base64')
				};
			});
		});
		req.busboy.on('field', function(key, value) {
			fields[key] = value;
		});
		req.busboy.on('finish', function() {
			res.status(200).json({
				fields : fields
			});
		});
	}
	else {
		res.status(500).text('Not supported');
	}
});

app.listen(port, function() {
	console.log('Server listening on localhost:'+port);
});
