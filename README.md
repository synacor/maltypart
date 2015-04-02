Maltypart [![NPM Version](http://img.shields.io/npm/v/maltypart.svg?style=flat)](https://www.npmjs.org/package/maltypart) [![Bower Version](http://img.shields.io/bower/v/maltypart.svg?style=flat)](http://bower.io/search/?q=maltypart)
=========

[![Join the chat at https://gitter.im/synacorinc/maltypart](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/synacorinc/maltypart?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

![Maltypart](logo.png)

**Maltypart is a simple multipart request builder.**

*It is very similar to [HTML5 FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData),
but offers a bit more control over fields and serialization.*

**[View Demo](http://maltypart.herokuapp.com/demo)**

[![Build Status](https://img.shields.io/travis/synacorinc/maltypart.svg?style=flat&branch=master)](https://travis-ci.org/synacorinc/maltypart)
[![Dependency Status](http://img.shields.io/david/synacorinc/maltypart.svg?style=flat)](https://david-dm.org/synacorinc/maltypart)
[![devDependency Status](http://img.shields.io/david/dev/synacorinc/maltypart.svg?style=flat)](https://david-dm.org/synacorinc/maltypart#info=devDependencies)

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)


---


Why Maltypart?
--------------

Maltypart is a good fit if your app needs to work with multipart form submissions,
but you don't want to couple networking logic to your HTML. It supports a few nice
additions that FormData doesn't offer, and can serialize Strings, Files, Elements and more.


---


Usage
-----


**Creating a new RequestBody:**

```js
// Pull in the dependency however you wish: AMD, CJS, Node and globals are all supported
var RequestBody = require('maltypart').RequestBody;

// Create a new multipart body:
var request = new RequestBody();
```


**Appending Strings:**

```js
// request is from the first example

request.append({
	// String values get serialized with the default content-type, application/octet-stream:
	some_key : "some value",

	// Passing an Object or Array to append() lets you specify multiple fields at once
	second_key : "second value"
});
```


**Appending Typed Content:**

```js
request.append('example_image', {
	// Specify an Object with "contentType" and "data" properties to set your own content-type:
	contentType : "image/png",

	// Base64-encoded data as a String:
	data : "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD"
			+ "///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDe"
			+ "NGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC"

	// You can also pass a maltypart.RequestField instead of a POJO.
});
```


**Appending a File:**

```js
request.append('some_file', new File(), function() {
	// file added.
});
```


**Using with XMLHttpRequest:**

```js
// A standard XHR
var xhr = new XMLHttpRequest();
xhr.open('POST', '/upload', true);

// Set the request's content-type appropriately:
xhr.setRequestHeader('Content-Type', request.getContentType());

// Set the multipart-encoded body:
xhr.send( request.getData() );
```


---


Instantiation
-------------

**Via node / browserify:**

```js
var maltypart = require('maltypart');
```

**Via AMD / requirejs:**

```js
define(['maltypart'], function(maltypart) {

});
```

**Via globals / script tag:**

```html
<script src="maltypart.js"></script>
<script>
	maltypart;  // now it's exposed as a "maltypart" global
</script>
```


Installation
------------

**Installation via Bower:** *(Recommended)*

```bash
bower install maltypart
```

**Manual Download:**

- [maltypart.js](dist/maltypart.js) - *full source with comments, for development*
- [maltypart.min.js](dist/maltypart.min.js) - *minified without comments, for production*


License
-------

BSD


![Malt-ey Party](http://26.media.tumblr.com/tumblr_m26u79as6N1qzdzbuo1_500.jpg)
