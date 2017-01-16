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

        it('should get extra arguments (isWindowError and exception)', function (done){
            var handler = jasmine.createSpy('handler');

            var exception = new Error('Boom!');

            function throwException() {
                throw exception;
            }

            TraceKit.report.subscribe(handler);
            expect(function () { TraceKit.wrap(throwException)(); }).toThrow();

            setTimeout(function () {
                TraceKit.report.unsubscribe(handler);

                expect(handler.calls.count()).toEqual(1);

                var isWindowError = handler.calls.mostRecent().args[1];
                expect(isWindowError).toEqual(false);

                var e = handler.calls.mostRecent().args[2];
                expect(e).toEqual(exception);

                done();
            }, 1000);
        }, 2000);

        // NOTE: This will not pass currently because errors are rethrown.
        /* it('it should call report handler once', function (done){
            var handlerCalledCount = 0;
            TraceKit.report.subscribe(function(stackInfo) {
                handlerCalledCount++;
            });

            function handleAndReportException() {
                try {
                    a++;
                } catch (ex) {
                    TraceKit.report(ex);
                }
            }

            expect(handleAndReportException).not.toThrow();
            setTimeout(function () {
                expect(handlerCalledCount).toBe(1);
                done();
            }, 1000);
        }, 2000); */
    });
})();
