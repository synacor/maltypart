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
			expect(spy).to.have.been.calledWithExactly(fields);
			spy.restore();
		});

		describe('#setType', function() {
			it('should override getType', function(done) {
				var body = new maltypart.RequestBody();

				body.setType('multipart');
				expect(body.getType()).to.equal('multipart');

				body.setType('form-encoded');
				expect(body.getType()).to.equal('form-encoded');
			});

			it('should not accept unknown types', function(done) {
				var body = new maltypart.RequestBody();

				body.setType('unknown');
				expect(body.typeOverride).to.be.empty;
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

				body = new maltypart.RequestBody([
					{ name:'test', value:new File() }
				]);
				expect(body.getType()).to.equal('multipart');
			});
		});
	});
});
