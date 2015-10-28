describe('maltypart', function() {
	var maltypart;

	it('should be exposed via require("maltypart")', function(done) {
		require(["maltypart"], function(lib) {
			maltypart = lib;

			expect(maltypart).to.exist;
			expect(maltypart).to.be.an('object');
			done();
		});
	});

	describe('RequestBody', function() {
		it('should be a constructor', function() {
			expect(maltypart).to.have.property('RequestBody');
			expect(maltypart.RequestBody).to.be.a('function');
		});

		it('should apply fields when passed to the constructor', function() {
			var spy = sinon.spy(maltypart.RequestBody.prototype, 'append'),
				fields = {
					foo : 'bar',
					baz : 'bat'
				};
			new maltypart.RequestBody(fields);
			expect(spy).to.have.been.calledOnce;
			expect(spy).to.have.been.calledWith(fields);
			spy.restore();
		});

		describe('#setType', function() {
			it('should override getType', function() {
				var body = new maltypart.RequestBody();

				body.setType('multipart');
				expect(body.getType()).to.equal('multipart');

				body.setType('form-encoded');
				expect(body.getType()).to.equal('form-encoded');
			});

			it('should not accept unknown types', function() {
				var body = new maltypart.RequestBody();

				body.setType('unknown');
				expect(body.typeOverride).to.equal(null);
				expect(body.getType()).to.equal('form-encoded');
			});
		});

		describe('#getType', function() {
			it('should return form-encoded by default', function() {
				var body = new maltypart.RequestBody();
				expect(body.getType()).to.equal('form-encoded');
			});

			it('should return form-encoded if fields have a content-type', function() {
				var body = new maltypart.RequestBody({
					foo : 'bar',
					baz : {
						data : 'bat'
					}
				});
				expect(body.getType()).to.equal('form-encoded');
			});

			it('should return multipart if any fields have a content-type', function() {
				var body = new maltypart.RequestBody({
					foo : 'bar',
					baz : {
						contentType : 'text/html',
						data : 'bat'
					}
				});
				expect(body.getType()).to.equal('multipart');

				body = new maltypart.RequestBody();
				body.append('test', new maltypart.RequestField('<h1>hi</h1>', 'text/html'));
				expect(body.getType()).to.equal('multipart');

				//body = new maltypart.RequestBody([
				//	{ name:'test', value:new File() }
				//]);
				//expect(body.getType()).to.equal('multipart');
			});
		});

		describe('#append', function() {
			it('should invoke callbacks for single fields', function() {
				var body = new maltypart.RequestBody(),
					callback = sinon.spy();

				body.append('foo', 'bar', callback);
				expect(callback).to.have.been.calledOnce;

				body.append('test', new maltypart.RequestField('<h1>hi</h1>', 'text/html'), callback);
				expect(callback).to.have.been.calledTwice;
			});

			it('should invoke callbacks for multiple fields', function() {
				var body = new maltypart.RequestBody(),
					callback = sinon.spy();

				body.append({
					foo: 'bar',
					test: new maltypart.RequestField('<h1>hi</h1>', 'text/html')
				}, callback);
				expect(callback).to.have.been.calledOnce;

				body.append([
					{ name: 'foo2', value: 'bar' },
					{ name: 'test2', value: new maltypart.RequestField('<h1>hi</h1>', 'text/html') }
				], callback);
				expect(callback).to.have.been.calledTwice;
			});

			it('should append multiple fields with the same name', function() {
				var body = new maltypart.RequestBody(),
					callback = sinon.spy();

				body.append({
					foo: 'bar',
					test: new maltypart.RequestField('<h1>hi</h1>', 'text/html'),
					multiple: [
						new maltypart.RequestField('<a>a</a>', 'text/html'),
						new maltypart.RequestField('b', 'text/plain'),
						new maltypart.RequestField('{"c":"c"}', 'text/json')
					]
				}, callback);

				expect(callback).to.have.been.calledOnce;

				expect(body.fields)
					.to.have.property('test')
					.that.is.an('object');

				expect(body.fields)
					.to.have.property('multiple')
					.that.is.an('array')
					.with.length(3);
			});

			it('should serialize complex example', function() {
				var body = new maltypart.RequestBody(),
					callback = sinon.spy();

				body.append({
					foo: 'bar',
					test: new maltypart.RequestField('<h1>hi</h1>', 'text/html'),
					multiple: [
						new maltypart.RequestField('<a>a</a>', 'text/html'),
						new maltypart.RequestField('b', 'text/plain'),
						new maltypart.RequestField('{"c":"c"}', 'text/json')
					]
				});

				var boundary = body.boundary;

				var reference = '\
--'+boundary+'\r\n\
Content-Disposition: form-data; name="foo"\r\n\
\r\n\
bar\r\n\
--'+boundary+'\r\n\
Content-Disposition: form-data; name="test"\r\n\
Content-type: text/html\r\n\
\r\n\
<h1>hi</h1>\r\n\
--'+boundary+'\r\n\
Content-Disposition: form-data; name="multiple"\r\n\
Content-type: text/html\r\n\
\r\n\
<a>a</a>\r\n\
--'+boundary+'\r\n\
Content-Disposition: form-data; name="multiple"\r\n\
Content-type: text/plain\r\n\
\r\n\
b\r\n\
--'+boundary+'\r\n\
Content-Disposition: form-data; name="multiple"\r\n\
Content-type: text/json\r\n\
\r\n\
{"c":"c"}\r\n\
--'+boundary+'--\r\n\
';

				expect(body.toString()).to.equal(reference);
			});
		});
	});
});
