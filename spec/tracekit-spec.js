(function () {
  'use strict';

  describe('TraceKit', function () {
    describe('General', function () {
      it('should not remove anonymous functions from the stack', function () {
        // mock up an error object with a stack trace that includes both
        // named functions and anonymous functions
        var stack_str = '' +
          '  Error: \n' +
          '    at new <anonymous> (http://example.com/js/test.js:63:1)\n' +   // stack[0]
          '    at namedFunc0 (http://example.com/js/script.js:10:2)\n' +      // stack[1]
          '    at http://example.com/js/test.js:65:10\n' +                    // stack[2]
          '    at namedFunc2 (http://example.com/js/script.js:20:5)\n' +      // stack[3]
          '    at http://example.com/js/test.js:67:5\n' +                     // stack[4]
          '    at namedFunc4 (http://example.com/js/script.js:100001:10002)'; // stack[5]
        var mock_err = { stack: stack_str };
        var stackFrames = TraceKit.computeStackTrace.computeStackTraceFromStackProp(mock_err);

        // Make sure TraceKit didn't remove the anonymous functions
        // from the stack like it used to :)
        expect(stackFrames).toBeTruthy();
        expect(stackFrames.stack[0].func).toEqual('new <anonymous>');
        expect(stackFrames.stack[0].url).toEqual('http://example.com/js/test.js');
        expect(stackFrames.stack[0].line).toBe(63);
        expect(stackFrames.stack[0].column).toBe(1);

        expect(stackFrames.stack[1].func).toEqual('namedFunc0');
        expect(stackFrames.stack[1].url).toEqual('http://example.com/js/script.js');
        expect(stackFrames.stack[1].line).toBe(10);
        expect(stackFrames.stack[1].column).toBe(2);

        expect(stackFrames.stack[2].func).toEqual('?');
        expect(stackFrames.stack[2].url).toEqual('http://example.com/js/test.js');
        expect(stackFrames.stack[2].line).toBe(65);
        expect(stackFrames.stack[2].column).toBe(10);

        expect(stackFrames.stack[3].func).toEqual('namedFunc2');
        expect(stackFrames.stack[3].url).toEqual('http://example.com/js/script.js');
        expect(stackFrames.stack[3].line).toBe(20);
        expect(stackFrames.stack[3].column).toBe(5);

        expect(stackFrames.stack[4].func).toEqual('?');
        expect(stackFrames.stack[4].url).toEqual('http://example.com/js/test.js');
        expect(stackFrames.stack[4].line).toBe(67);
        expect(stackFrames.stack[4].column).toBe(5);

        expect(stackFrames.stack[5].func).toEqual('namedFunc4');
        expect(stackFrames.stack[5].url).toEqual('http://example.com/js/script.js');
        expect(stackFrames.stack[5].line).toBe(100001);
        expect(stackFrames.stack[5].column).toBe(10002);
      });

      it('should handle eval/anonymous strings in Chrome 46', function () {
        var stack_str = '' +
          'ReferenceError: baz is not defined\n' +
          '   at bar (http://example.com/js/test.js:19:7)\n' +
          '   at foo (http://example.com/js/test.js:23:7)\n' +
          '   at eval (eval at <anonymous> (http://example.com/js/test.js:26:5)).toBe(<anonymous>:1:26)\n';

        var mock_err = { stack: stack_str };
        var stackFrames = TraceKit.computeStackTrace.computeStackTraceFromStackProp(mock_err);
        expect(stackFrames).toBeTruthy();
        expect(stackFrames.stack[0].func).toEqual('bar');
        expect(stackFrames.stack[0].url).toEqual('http://example.com/js/test.js');
        expect(stackFrames.stack[0].line).toBe(19);
        expect(stackFrames.stack[0].column).toBe(7);

        expect(stackFrames.stack[1].func).toEqual('foo');
        expect(stackFrames.stack[1].url).toEqual('http://example.com/js/test.js');
        expect(stackFrames.stack[1].line).toBe(23);
        expect(stackFrames.stack[1].column).toBe(7);

        expect(stackFrames.stack[2].func).toEqual('eval');
        // TODO: fix nested evals
        expect(stackFrames.stack[2].url).toEqual('http://example.com/js/test.js');
        expect(stackFrames.stack[2].line).toBe(26);
        expect(stackFrames.stack[2].column).toBe(5);
      });
    });

    describe('.computeStackTrace', function () {
      it('should handle a native error object', function () {
        var ex = new Error('test');
        var stack = TraceKit.computeStackTrace(ex);
        expect(stack.name).toEqual('Error');
        expect(stack.message).toEqual('test');
      });

      it('should handle a native error object stack from Chrome', function () {
        var stackStr = '' +
          'Error: foo\n' +
          '    at <anonymous>:2:11\n' +
          '    at Object.InjectedScript._evaluateOn (<anonymous>:904:140)\n' +
          '    at Object.InjectedScript._evaluateAndWrap (<anonymous>:837:34)\n' +
          '    at Object.InjectedScript.evaluate (<anonymous>:693:21)';
        var mockErr = {
          name: 'Error',
          message: 'foo',
          stack: stackStr
        };
        var stackFrames = TraceKit.computeStackTrace(mockErr);
        expect(stackFrames).toBeTruthy();
        expect(stackFrames.stack[0].url).toEqual('<anonymous>');
      });
    });

    describe('error notifications', function () {
      var testMessage = '__mocha_ignore__';
      var testLineNo = 1337;

      var subscriptionHandler;
      var oldOnErrorHandler;

      // TraceKit waits 2000ms for window.onerror to fire, so give the tests
      // some extra time.
      //this.timeout(3000);

      beforeEach(function () {

        // Prevent the onerror call that's part of our tests from getting to
        // mocha's handler, which would treat it as a test failure.
        //
        // We set this up here and don't ever restore the old handler, because
        // we can't do that without clobbering TraceKit's handler, which can only
        // be installed once.
        oldOnErrorHandler = window.onerror;
        window.onerror = function (message, url, lineNo, error) {
          if (message === testMessage || lineNo === testLineNo) {
            return true;
          }
          return oldOnErrorHandler.apply(this, arguments);
        };
      });

      afterEach(function () {
        window.onerror = oldOnErrorHandler;
        if (subscriptionHandler) {
          TraceKit.report.unsubscribe(subscriptionHandler);
          subscriptionHandler = null;
        }
      });

      describe('with undefined arguments', function () {
        it('should pass undefined:undefined', function (done) {
          // this is probably not good behavior;  just writing this test to verify
          // that it doesn't change unintentionally
          subscriptionHandler = function (stack, isWindowError, error) {
            expect(stack.name).toBe(undefined);
            expect(stack.message).toBe(undefined);
            done();
          };
          TraceKit.report.subscribe(subscriptionHandler);
          window.onerror(undefined, undefined, testLineNo);
        });
      });

      describe('when no 5th argument (error object)', function () {
        it('should separate name, message for default error types (e.g. ReferenceError)', function (done) {
          subscriptionHandler = function (stack, isWindowError, error) {
            expect(stack.name).toEqual('ReferenceError');
            expect(stack.message).toEqual('foo is undefined');
            done();
          };
          TraceKit.report.subscribe(subscriptionHandler);
          window.onerror('ReferenceError: foo is undefined', 'http://example.com', testLineNo);
        });

        it('should separate name, message for default error types (e.g. Uncaught ReferenceError)', function (done) {
          subscriptionHandler = function (stack, isWindowError, error) {
            expect(stack.name).toEqual('ReferenceError');
            expect(stack.message).toEqual('foo is undefined');
            done();
          };
          TraceKit.report.subscribe(subscriptionHandler);
          // should work with/without 'Uncaught'
          window.onerror('Uncaught ReferenceError: foo is undefined', 'http://example.com', testLineNo);
        });

        it('should separate name, message for default error types on Opera Mini', function (done) {
          subscriptionHandler = function (stack, isWindowError, error) {
            expect(stack.name).toEqual('ReferenceError');
            expect(stack.message).toEqual('Undefined variable: foo');
            done();
          };
          TraceKit.report.subscribe(subscriptionHandler);
          window.onerror('Uncaught exception: ReferenceError: Undefined variable: foo', 'http://example.com', testLineNo);
        });

        it('should ignore unknown error types', function (done) {
          // TODO: should we attempt to parse this?
          subscriptionHandler = function (stack, isWindowError, error) {
            expect(stack.name).toBe(undefined);
            expect(stack.message).toEqual('CustomError: woo scary');
            done();
          };
          TraceKit.report.subscribe(subscriptionHandler);
          window.onerror('CustomError: woo scary', 'http://example.com', testLineNo);
        });

        it('should ignore arbitrary messages passed through onerror', function (done) {
          subscriptionHandler = function (stack, isWindowError, error) {
            expect(stack.name).toBe(undefined);
            expect(stack.message).toEqual('all work and no play makes homer: something something');
            done();
          };
          TraceKit.report.subscribe(subscriptionHandler);
          window.onerror('all work and no play makes homer: something something', 'http://example.com', testLineNo);
        });
      });

      function testErrorNotification(collectWindowErrors, callOnError, numReports, done) {
        var numDone = 0;
        // TraceKit's collectWindowErrors flag shouldn't affect direct calls
        // to TraceKit.report, so we parameterize it for the tests.
        TraceKit.collectWindowErrors = collectWindowErrors;

        subscriptionHandler = function (stack, isWindowError, error) {
          numDone++;
          if (numDone == numReports) {
            done();
          }
        };
        TraceKit.report.subscribe(subscriptionHandler);

        // TraceKit.report always throws an exception in order to trigger
        // window.onerror so it can gather more stack data. Mocha treats
        // uncaught exceptions as errors, so we catch it via assert.throws
        // here (and manually call window.onerror later if appropriate).
        //
        // We test multiple reports because TraceKit has special logic for when
        // report() is called a second time before either a timeout elapses or
        // window.onerror is called (which is why we always call window.onerror
        // only once below, after all calls to report()).
        for (var i = 0; i < numReports; i++) {
          var e = new Error('testing');
          expect(function () {
            TraceKit.report(e);
          }).toThrow(e);
        }
        // The call to report should work whether or not window.onerror is
        // triggered, so we parameterize it for the tests. We only call it
        // once, regardless of numReports, because the case we want to test for
        // multiple reports is when window.onerror is *not* called between them.
        if (callOnError) {
          window.onerror(testMessage);
        }
      }

      [false, true].forEach(function (collectWindowErrors) {
        [false, true].forEach(function (callOnError) {
          [1, 2].forEach(function (numReports) {
            it('it should receive arguments from report() when' +
              ' collectWindowErrors is ' + collectWindowErrors +
              ' and callOnError is ' + callOnError +
              ' and numReports is ' + numReports, function (done) {
                testErrorNotification(collectWindowErrors, callOnError, numReports, done);
              });
          });
        });
      });
    });
  });
})();
