/*
    Test suite for TraceKit.js
*/
(function() {
    'use strict';

    describe('Tracing', function() {
        function foo() {
            return bar();
        }

        function bar() {
            return baz();
        }

        function baz() {
            return TraceKit.computeStackTrace.ofCaller();
        }

        it('should get the order of functions called right', function() {
            var trace = foo();
            var expected = ['baz', 'bar', 'foo'];
            for(var i = 1; i <= 3; i++) {
                expect(trace.stack[i].func).toBe(expected[i - 1]);
            }
        });
    });
})();
