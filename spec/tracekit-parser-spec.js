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
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 48, column: null, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: 'dumpException3', args: '', line: 52, column: null, context: null });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://path/to/file.js', func: 'onclick', args: '', line: 82, column: null, context: null });
        });

        it('should parse Safari 7 Error.stack', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.SAFARI_7);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 48, column: 22, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: 'foo', args: '', line: 52, column: 15, context: null });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 108, column: 107, context: null });
        });

        it('should parse Safari 8 Error.stack', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.SAFARI_8);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 47, column: 22, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: 'foo', args: '', line: 52, column: 15, context: null });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 108, column: 23, context: null });
        });

        it('should parse Firefox 31 Error.stack', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.FIREFOX_31);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(2);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: 'foo', args: '', line: 41, column: 13, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 1, column: 1, context: null });
        });

        it('should parse V8 Error.stack', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.CHROME_15);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(4);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 13, column: 17, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 16, column: 5, context: null });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://path/to/file.js', func: 'foo', args: '', line: 20, column: 5, context: null });
            expect(stackFrames.stack[3]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 24, column: 4, context: null });
        });

        it('should parse V8 entries with no location', function () {
            var stackFrames = TraceKit.computeStackTrace({stack: "Error\n at Array.forEach (native)"});
            expect(stackFrames.stack.length).toBe(1);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: 'Array.forEach', args: '(native)', line: undefined, column: undefined, context: null });
        });

        it('should parse V8 Error.stack entries with port numbers', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.CHROME_36);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(2);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://localhost:8080/file.js', func: 'dumpExceptionError', args: '', line: 41, column: 27, context: null });
        });

        it('should parse IE 10 Error stacks', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.IE_10);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 48, column: 13, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: 'foo', args: '', line: 46, column: 9, context: null });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 82, column: 1, context: null });
        });

        it('should parse IE 11 Error stacks', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.IE_11);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 47, column: 21, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: 'foo', args: '', line: 45, column: 13, context: null });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 108, column: 1, context: null });
        });

        it('should parse Opera 9.27 Error messages', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.OPERA_927);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 43, column: null, context: [ '    bar(n - 1);' ] });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 31, column: null, context: [ '    bar(2);' ] });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 18, column: null, context: [ '    foo();' ] });
        });

        it('should parse Opera 10 Error messages', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.OPERA_10);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(7);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 42, column: null, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 27, column: null, context: null });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://path/to/file.js', func: 'printStackTrace', args: '', line: 18, column: null, context: null });
            expect(stackFrames.stack[3]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 4, column: null, context: null });
            expect(stackFrames.stack[4]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 7, column: null, context: null });
            expect(stackFrames.stack[5]).toEqual({ url: 'http://path/to/file.js', func: 'foo', args: '', line: 11, column: null, context: null });
            expect(stackFrames.stack[6]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 15, column: null, context: null });
        });

        it('should parse Opera 11 Error messages', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.OPERA_11);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(4);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: 'run', args: '', line: 27, column: null, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://domain.com:1234/path/to/file.js', func: 'bar', args: '', line: 18, column: null, context: null });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://domain.com:1234/path/to/file.js', func: 'foo', args: '', line: 11, column: null, context: null });
            expect(stackFrames.stack[3]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 15, column: null, context: null });
        });

        it('should parse Opera 25 Error stacks', function () {
            var stackFrames = TraceKit.computeStackTrace(CapturedExceptions.OPERA_25);
            expect(stackFrames).toBeTruthy();
            expect(stackFrames.stack.length).toBe(3);
            expect(stackFrames.stack[0]).toEqual({ url: 'http://path/to/file.js', func: '?', args: '', line: 47, column: 22, context: null });
            expect(stackFrames.stack[1]).toEqual({ url: 'http://path/to/file.js', func: 'foo', args: '', line: 52, column: 15, context: null });
            expect(stackFrames.stack[2]).toEqual({ url: 'http://path/to/file.js', func: 'bar', args: '', line: 108, column: 168, context: null });
        });
    });
})();
