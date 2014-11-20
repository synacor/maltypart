/**	Maltypart is a simple multipart builder.
 *	It is very similar to HTML5 FormData, but offers a bit more control over fields and serialization.
 *
 *	@example
 *	var RequestBody = require('maltypart').RequestBody;
 *
 *	var request = new RequestBody();
 *
 *	request.append({
 *		// String values get serialized with the default content-type, application/octet-stream:
 *		some_key : "some value",
 *
 *		// Specify an Object with "contentType" and "data" properties to set your own content-type.
 *		otherKey : {
 *			contentType : "image/png",
 *			data : "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD"
 *					+ "///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDe"
 *					+ "NGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC"
 *		}
 *	});
 *
 *	request.append('some-file', new File(), function() {
 *		// file added.
 *
 *		// Log the body as text
 *		console.log( request.toString() );
 *
 *		// Send the multipart body with XMLHttpRequest:
 *		xhr.setRequestHeader('Content-Type', request.getContentType());
 *		xhr.send( request.getData() );
 *	});
 */
(function(root, factory) {
	if (typeof define==='function' && define.amd) {
		define([], factory);
	}
	else if (typeof module==='object' && module.exports) {
		module.exports = factory();
	}
	else {
		root.maltypart = factory();
	}
}(this, function() {
	/**	@private */
	var count=0, p;

	/**	@class Represents a multipart message body to be serialized.
	 *	@memberOf module:maltypart
	 *	@param {Object|Array} fields
	 *	@param {String} [boundary=random]
	 */
	function RequestBody(fields, boundary) {
		this.fields = {};
		if (fields) {
			this.append(fields);
		}
		this.setBoundary(boundary);
	}

	RequestBody.prototype = {

		/** @ignore */
		constructor : RequestBody,

		/** @private */
		availableTypes : ['multipart', 'form-encoded'],

		/** Override the automatic `mutlipart`/`form-encoded` detection.
		 *	@memberOf module:maltypart.RequestBody#
		 *	@param {String} type		One of: `multipart` or `form-encoded`.
		 *	@returns {this}
		 */
		setType : function(type) {
			this.typeOverride = this.availableTypes.indexOf(type)!==-1 ? type : null;
			return this;
		},

		/** Returns a `String` indicating if the RequestBody will be serialized as `multipart`, or `form-encoded`.
		 *	If no fields have been added that have a `contentType`, the request will be serialized as `form-encoded`.
		 *	@memberOf module:maltypart.RequestBody#
		 *	@returns {String} type
		 */
		getType : function() {
			var override = this.typeOverride;
			if (this.availableTypes.indexOf(override)!==-1) {
				return override;
			}
			for (var i in this.fields) {
				if (this.fields.hasOwnProperty(i) && typeof this.fields[i] && this.fields[i].contentType) {
					return 'multipart';
				}
			}
			return 'form-encoded';
		},

		/** Append one or more fields to the RequestBody.
		 *	If a `fields` is a `string`, this method acts as an alias of {@link module:maltypart.RequestBody#setField}.
		 *	@memberOf module:maltypart.RequestBody#
		 *	@param {Array|Object} fields		An Array of objects with `name` and `value` properties, or a key-value Object.
		 *	@param {Boolean} [replace=true]		By default, any existing field with the same name is replaced. If `replace` is set to `false`, existing values will be left in-place, and the new value will be appended. This results in duplicate keys (which can be useful!).
		 *	@returns {this}
		 */
		append : function(fields, replace) {
			var name, i;
			if (typeof fields==='string' && arguments.length>=2) {
				this.setField(fields, replace, arguments[2]);
			}
			else if (isArray(fields)) {
				for (i=0; i<fields.length; i++) {
					this.setField(fields[i].name, fields[i].value, replace);
				}
			}
			else {
				for (name in fields) {
					if (fields.hasOwnProperty(name)) {
						this.setField(name, fields[name], replace);
					}
				}
			}
			return this;
		},

		/** Set the value of a new or existing field.
		 *	@memberOf module:maltypart.RequestBody#
		 *	@param {String} name				A field name with which to associate the specified value
		 *	@param {String|module:maltypart.RequestField|Element|File} value	Any of: a {@link module:maltypart.RequestField RequestField}, a simple String value, an HTML5 [File](https://developer.mozilla.org/en/docs/Web/API/File) object, or any form input Element.
		 *	@param {Boolean} [replace=true]		By default, any existing field with the same name is replaced. If `replace` is set to `false`, existing values will be left in-place, and the new value will be appended. This results in duplicate keys (which can be useful!).
		 *	@returns {this}
		 */
		setField : function(name, value, replace) {
			var fields = this.fields;
			name = name + '';
			if ((window.File && value instanceof window.File) || (window.Blob && value instanceof window.Blob)) {
				return this.setFileField(name, value, typeof replace==='function' && replace);
			}
			if (value && value.nodeType && value.nodeName && value.getAttribute) {
				value = value.value;
			}
			else if (!isArray(value) && (!value || !(value instanceof RequestField || (value.contentType && value.data)))) {
				value = value + '';
			}
			if (name.match(/\[\]$/g)) {
				replace = false;
			}
			if (replace===false && fields.hasOwnProperty(name)) {
				if (!isArray(fields[name])) {
					fields[name] = [fields[name]];
				}
				fields[name].push(value);
			}
			else {
				fields[name] = value;
			}
			return this;
		},

		/** Add an HTML5 File object to the request body
		 *	@memberOf module:maltypart.RequestBody#
		 *	@param {String} name			A field name with which to associate the acquired field value
		 *	@param {File} file				An HTML5 [File](https://developer.mozilla.org/en/docs/Web/API/File) object.
		 *	@param {Function} [callback]	A callback to call once the file has been fully added.
		 *	@returns {this}
		 */
		setFileField : function(name, file, callback) {
			var self = this,
				reader = new FileReader();
			reader.onloadend = function() {
				self.setField(name, new RequestField(
					arrayBufferToBinaryString(reader.result),
					file.type,
					file.name
				));
				if (typeof callback==='function') {
					callback();
				}
				file = callback = self = reader = null;
			};
			reader.readAsArrayBuffer(file);
			return this;
		},

		/** Set a custom "boundary" String to use when separating multipart fields.
		 *	@memberOf module:maltypart.RequestBody#
		 *	@param {String} [boundary=rnd()]	A custom boundary. If omitted, generates a new random boundary.
		 *	@returns {this}
		 */
		setBoundary : function(boundary) {
			this.boundary = (boundary || rnd()) + '';
			return this;
		},

		/** Get the request body as a String.
		 *	@memberOf module:maltypart.RequestBody#
		 *	@param {Object} [fields]	Optionally add fields prior to serialization
		 *	@returns {String} encodedMultipartBody
		 */
		toString : function(fields) {
			var bodyType = this.getType(),
				body = '',
				iter, name, value, type, item, v, i, headers, p;

			if (!this.boundary) {
				this.setBoundary();
			}

			if (fields) {
				this.append(fields);
			}

			for (name in this.fields) {
				if (this.fields.hasOwnProperty(name)) {
					value = this.fields[name];
					iter = isArray(value) ? value : [value];
					for (i=0; i<iter.length; i++) {
						v = iter[i];
						if (bodyType==='multipart') {
							headers = v.headers;
							type = 'application/octet-stream';
							if (v.contentType) {
								type = v.contentType;
								v = v.data;
							}
							item = '--' + this.boundary + '\r\n' +
								'Content-Disposition: form-data; name="' + name + '"';
							if (iter[i].filename) {
								item += '; filename="' + iter[i].filename + '"';
							}
							item += '\r\nContent-type: ' + type + '\r\n';
							if (headers) {
								for (p in headers) {
									if (headers.hasOwnProperty(p)) {
										item += p + ': ' + headers[p] + '\r\n';
									}
								}
							}
							item += '\r\n' + v + '\r\n';
						}
						else if (bodyType==='form-encoded') {
							item = encodeURIComponent(name) + '=' + encodeURIComponent(v) + '&';
						}
						body += item;
					}
				}
			}

			if (bodyType==='multipart') {
				body += '--' + this.boundary + '--\r\n';
			}
			else if (bodyType==='form-encoded') {
				body = body.substring(0, body.length-1);
			}
			return body;
		},

		/** Get the String or Uint8Array multipart request body.
		 *	@memberOf module:maltypart.RequestBody#
		 *	@returns {String|Uint8Array} data
		 */
		getData : function() {
			var str = this.toString(),
				len, buf;
			if (this.getType()==='multipart') {
				len = str.length;
				buf = new Uint8Array(len);
				for (var i=0; i<len; i++) {
					buf[i] = str.charCodeAt(i) & 0xff;
				}
				return buf;
			}
			return str;
		},

		/** Returns the appropriate Content-Type header value for this request body.
		 *	@memberOf module:maltypart.RequestBody#
		 *	@param {Boolean} [includeCharset=false]		If `true`, specifies a character set within the content-type.
		 *	@returns {String} contentType
		 */
		getContentType : function(includeCharset) {
			var type = this.getType();
			if (type==='multipart') {
				return 'multipart/form-data; ' + (includeCharset ? 'charset=utf-8; ' : '') + 'boundary=' + this.boundary;
			}
			return 'application/x-www-form-encoded';
		}
	};



	/**	@class Represents a content field to be added to a request.
	 *	@memberOf module:maltypart
	 *	@param {Any} data				The binary or textual value of the field
	 *	@param {String} contentType		Content-Type header for the field
	 *	@param {String} [filename]		A filename to attribute to the field when serializing
	 *	@param {Object} [headers]		Extra headers to append to the field when serializing
	 */
	function RequestField(data, contentType, filename, headers) {
		/** The binary or textual value of the field
		 *	@instance @any
		 */
		this.data = data;

		/** Content-Type header for the field
		 *	@instance @string
		 */
		this.contentType = contentType;

		/** A filename to attribute to the field when serializing
		 *	@instance @string
		 */
		this.filename = filename;

		/** Extra headers to append to the field when serializing
		 *	@instance @object
		 */
		this.headers = headers;
	}


	/** @ignore */
	function isArray(arr) {
		return Object.prototype.toString.call(arr)==='[object Array]';
	}

	/** @ignore */
	function rnd() {
		return Math.random().toString(36).substring(2) + (++count).toString(36);
	}

	/** @ignore */
	function arrayBufferToBinaryString(buffer) {
		var bin   = '';
		var bytes = new Uint8Array(buffer);

		for (var i = 0; i < bytes.byteLength; i++)
			bin += String.fromCharCode(bytes[i]);

		return bin;
	}


	return {
		RequestBody : RequestBody,
		RequestField : RequestField
	};
}));
