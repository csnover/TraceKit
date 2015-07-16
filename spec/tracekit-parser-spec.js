(function() {
    'use strict';

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

        it('should not parse IE 9 Error', function() {
            expect(function() {
                TraceKit.computeStackTrace(CapturedExceptions.IE_9);
            }).toThrow(new Error('Cannot parse given Error object'));
        });

        it('should parse Safari 6 Error.stack', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.SAFARI_6);
            console.log(JSON.stringify(stackFrames));
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 48]);
            expect(stackFrames.stack[1]).toMatchStackFrame(['dumpException3', undefined, 'http://path/to/file.js', 52]);
            expect(stackFrames.stack[2]).toMatchStackFrame(['onclick', undefined, 'http://path/to/file.js', 82]);
        });

        it('should parse Safari 7 Error.stack', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.SAFARI_7);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 48, 22]);
            expect(stackFrames.stack[1]).toMatchStackFrame(['foo', undefined, 'http://path/to/file.js', 52, 15]);
            expect(stackFrames.stack[2]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 108, 107]);
        });

        it('should parse Safari 8 Error.stack', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.SAFARI_8);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 47, 22]);
            expect(stackFrames.stack[1]).toMatchStackFrame(['foo', undefined, 'http://path/to/file.js', 52, 15]);
            expect(stackFrames.stack[2]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 108, 23]);
        });

        it('should parse Firefox 31 Error.stack', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.FIREFOX_31);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(2);
            expect(stackFrames.stack[0]).toMatchStackFrame(['foo', undefined, 'http://path/to/file.js', 41, 13]);
            expect(stackFrames.stack[1]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 1, 1]);
        });

        it('should parse V8 Error.stack', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.CHROME_15);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(4);
            expect(stackFrames.stack[0]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 13, 17]);
            expect(stackFrames.stack[1]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 16, 5]);
            expect(stackFrames.stack[2]).toMatchStackFrame(['foo', undefined, 'http://path/to/file.js', 20, 5]);
            expect(stackFrames.stack[3]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 24, 4]);
        });

        it('should parse V8 entries with no location', function () {
            var stackFrames = TraceKit.computeStackTrace({stack: "Error\n at Array.forEach (native)"});
            expect(stackFrames.stack.length).toBe(1);
            expect(stackFrames.stack[0]).toMatchStackFrame(['Array.forEach', undefined, '(native)', undefined, undefined]);
        });

        it('should parse V8 Error.stack entries with port numbers', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.CHROME_36);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(2);
            expect(stackFrames.stack[0]).toMatchStackFrame(['dumpExceptionError', undefined, 'http://localhost:8080/file.js', 41, 27]);
        });

        it('should parse IE 10 Error stacks', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.IE_10);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 48, 13]);
            expect(stackFrames.stack[1]).toMatchStackFrame(['foo', undefined, 'http://path/to/file.js', 46, 9]);
            expect(stackFrames.stack[2]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 82, 1]);
        });

        it('should parse IE 11 Error stacks', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.IE_11);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 47, 21]);
            expect(stackFrames.stack[1]).toMatchStackFrame(['foo', undefined, 'http://path/to/file.js', 45, 13]);
            expect(stackFrames.stack[2]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 108, 1]);
        });

        it('should parse Opera 9.27 Error messages', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.OPERA_927);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 43]);
            expect(stackFrames.stack[1]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 31]);
            expect(stackFrames.stack[2]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 18]);
        });

        it('should parse Opera 10 Error messages', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.OPERA_10);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(7);
            expect(stackFrames.stack[0]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 42]);
            expect(stackFrames.stack[1]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 27]);
            expect(stackFrames.stack[2]).toMatchStackFrame(['printStackTrace', undefined, 'http://path/to/file.js', 18]);
            expect(stackFrames.stack[3]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 4]);
            expect(stackFrames.stack[4]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 7]);
            expect(stackFrames.stack[5]).toMatchStackFrame(['foo', undefined, 'http://path/to/file.js', 11]);
            expect(stackFrames.stack[6]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 15]);
        });

        it('should parse Opera 11 Error messages', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.OPERA_11);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(4);
            expect(stackFrames.stack[0]).toMatchStackFrame(['run', undefined, 'http://path/to/file.js', 27]);
            expect(stackFrames.stack[1]).toMatchStackFrame(['bar', undefined, 'http://domain.com:1234/path/to/file.js', 18]);
            expect(stackFrames.stack[2]).toMatchStackFrame(['foo', undefined, 'http://domain.com:1234/path/to/file.js', 11]);
            expect(stackFrames.stack[3]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 15]);
        });

        it('should parse Opera 25 Error stacks', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.OPERA_25);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toMatchStackFrame([undefined, undefined, 'http://path/to/file.js', 47, 22]);
            expect(stackFrames.stack[1]).toMatchStackFrame(['foo', undefined, 'http://path/to/file.js', 52, 15]);
            expect(stackFrames.stack[2]).toMatchStackFrame(['bar', undefined, 'http://path/to/file.js', 108, 168]);
        });
    });
})();
