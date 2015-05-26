/*
    Test suite for TraceKit.js
*/
(function() {
    'use strict';

    describe('Handler', function(){
        it('it should not go into an infinite loop', function (done){
            var stacks = [];
            function handler(stackInfo){
                stacks.push(stackInfo);
            }

            function throwException() {
                throw new Error('Boom!');
            }

            TraceKit.report.subscribe(handler);
            expect(function () { TraceKit.wrap(throwException)(); }).toThrow();

            setTimeout(function () {
                TraceKit.report.unsubscribe(handler);
                expect(stacks.length).toBe(1);
                done();
            }, 1000);
        }, 2000);
    });

    describe('Parser', function() {
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
