/**! @preserve
 * Original CrashKit code Copyright (c) 2009 Andrey Tarantsov, YourSway LLC (http://crashkitapp.appspot.com/)
 * Copyright (c) 2010 Colin Snover (http://zetafleet.com)
 *
 * Released under the ISC License.
 * http://opensource.org/licenses/isc-license.txt
 */
var TraceKit = {};

/**
 * TraceKit.report: cross-browser processing of unhandled exceptions
 *
 * Syntax:
 *   TraceKit.report.subscribe(function(stackInfo) { ... })
 *   TraceKit.report.unsubscribe(function(stackInfo) { ... })
 *   TraceKit.report(exception)
 *   try { ...code... } catch(ex) { TraceKit.report(ex); }
 *
 * Supports:
 *   - Firefox: full stack trace with line numbers, plus column number
 *              on top frame; column number is not guaranteed
 *   - Opera:   full stack trace with line and column numbers
 *   - Chrome:  full stack trace with line and column numbers
 *   - Safari:  line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *   - IE:      line and column number for the top frame only; some frames
 *              may be missing, and column number is not guaranteed
 *
 * In theory, TraceKit should work on all of the following versions:
 *   - IE5.5+ (only 8.0 tested)
 *   - Firefox 0.9+ (only 3.5+ tested)
 *   - Opera 7+ (only 10.50 tested; versions 9 and earlier may require
 *     Exceptions Have Stacktrace to be enabled in opera:config)
 *   - Safari 3+ (only 4+ tested)
 *   - Chrome 1+ (only 5+ tested)
 *   - Konqueror 3.5+ (untested)
 *
 * Requires TraceKit.computeStackTrace.
 *
 * Tries to catch all unhandled exceptions and report them to the
 * subscribed handlers. Please note that TraceKit.report will rethrow the
 * exception. This is REQUIRED in order to get a useful stack trace in IE.
 * If the exception does not reach the top of the browser, you will only
 * get a stack trace from the point where TraceKit.report was called.
 *
 * Handlers receive a stackInfo object as described in the
 * TraceKit.computeStackTrace docs.
 */
TraceKit.report = (function () {
	var handlers = [],
		lastException = null,
		lastExceptionStack = null;

	/**
	 * Add a crash handler.
	 * @param {Function} handler
	 */
	function subscribe(handler) {
		handlers.push(handler);
	}

	/**
	 * Remove a crash handler.
	 * @param {Function} handler
	 */
	function unsubscribe(handler) {
		for (var i = handlers.length - 1; i >= 0; --i) {
			if (handlers[i] === handler) {
				handlers.splice(i, 1);
			}
		}
	}

	/**
	 * Dispatch stack information to all handlers.
	 * @param {Object.<string, *>} stack
	 */
	function notifyHandlers(stack) {
		var exception = null;
		for (var i in handlers) {
			if (handlers.hasOwnProperty(i)) {
				try {
					handlers[i](stack);
				}
				catch (inner) {
					exception = inner;
				}
			}
		}

		if (exception) {
			throw exception;
		}
	}

	var _oldOnerrorHandler = window.onerror;

	/**
	 * Ensures all global unhandled exceptions are recorded.
	 * Supported by Gecko and IE.
	 * @param {string} message Error message.
	 * @param {string} url URL of script that generated the exception.
	 * @param {(number|string)} lineNo The line number at which the error
	 * occurred.
	 */
	window.onerror = function (message, url, lineNo) {
		var stack = null;

		if (lastExceptionStack) {
			TraceKit.computeStackTrace.augmentStackTraceWithInitialElement(lastExceptionStack, url, lineNo, message);
			stack = lastExceptionStack;
			lastExceptionStack = null;
			lastException = null;
		}
		else {
			var location = { 'url': url, 'line': lineNo };
			location.func = TraceKit.computeStackTrace.guessFunctionName(location.url, location.line);
			location.context = TraceKit.computeStackTrace.gatherContext(location.url, location.line);
			stack = { 'mode': 'onerror', 'message': message, 'stack': [ location ] };
		}

		notifyHandlers(stack);

		if (_oldOnerrorHandler) {
			return _oldOnerrorHandler.apply(this, arguments);
		}

		return false;
	};

	/**
	 * Reports an unhandled Error to TraceKit.
	 * @param {Error} ex
	 */
	function report(ex) {
		if (lastExceptionStack) {
			if (lastException === ex) {
				return; // already caught by an inner catch block, ignore
			}
			else {
				var s = lastExceptionStack;
				lastExceptionStack = null;
				lastException = null;
				notifyHandlers(s);
			}
		}

		var stack = TraceKit.computeStackTrace(ex);
		lastExceptionStack = stack;
		lastException = ex;

		// If the stack trace is incomplete, wait for 2 seconds for
		// slow slow IE to see if onerror occurs or not before reporting
		// this exception; otherwise, we will end up with an incomplete
		// stack trace
		window.setTimeout(function () {
			if (lastException === ex) {
				lastExceptionStack = null;
				lastException = null;
				notifyHandlers(stack);
			}
		}, (stack.incomplete ? 2000 : 0));

		throw ex; // re-throw to propagate to the top level (and cause window.onerror)
	}

	report.subscribe = subscribe;
	report.unsubscribe = unsubscribe;
	return report;
}());

/**
 * TraceKit.computeStackTrace: cross-browser stack traces in JavaScript
 *
 * Syntax:
 *   s = TraceKit.computeStackTrace.ofCaller([depth])
 *   s = TraceKit.computeStackTrace(exception) // consider using TraceKit.report instead (see below)
 * Returns:
 *   s.name              - exception name
 *   s.message           - exception message
 *   s.stack[i].url      - JavaScript or HTML file URL
 *   s.stack[i].func     - function name, or empty for anonymous functions (if guessing did not work)
 *   s.stack[i].args     - arguments passed to the function, if known
 *   s.stack[i].line     - line number, if known
 *   s.stack[i].column   - column number, if known
 *   s.stack[i].context  - an array of source code lines; the middle element corresponds to the correct line#
 *   s.mode              - 'stack', 'stacktrace', 'multiline', 'callers', 'onerror', or 'failed' -- method used to collect the stack trace
 *
 * Supports:
 *   - Firefox:  full stack trace with line numbers and unreliable column
 *               number on top frame
 *   - Opera 10: full stack trace with line and column numbers
 *   - Opera 9-: full stack trace with line numbers
 *   - Chrome:   full stack trace with line and column numbers
 *   - Safari:   line and column number for the topmost stacktrace element
 *               only
 *   - IE:       no line numbers whatsoever
 *
 * Tries to guess names of anonymous functions by looking for assignments
 * in the source code. In IE and Safari, we have to guess source file names
 * by searching for function bodies inside all page scripts. This will not
 * work for scripts that are loaded cross-domain.
 * Here be dragons: some function names may be guessed incorrectly, and
 * duplicate functions may be mismatched.
 *
 * TraceKit.computeStackTrace should only be used for tracing purposes.
 * Logging of unhandled exceptions should be done with TraceKit.report,
 * which builds on top of TraceKit.computeStackTrace and provides better
 * IE support by utilizing the window.onerror event to retrieve information
 * about the top of the stack.
 *
 * Note: In IE and Safari, no stack trace is recorded on the Error object,
 * so computeStackTrace instead walks its *own* chain of callers.
 * This means that:
 *  * in Safari, some methods may be missing from the stack trace;
 *  * in IE, the topmost function in the stack trace will always be the
 *    caller of computeStackTrace.
 *
 * This is okay for tracing (because you are likely to be calling
 * computeStackTrace from the function you want to be the topmost element
 * of the stack trace anyway), but not okay for logging unhandled
 * exceptions (because your catch block will likely be far away from the
 * inner function that actually caused the exception).
 *
 * Tracing example:
 *     function trace(message) {
 *         var stackInfo = TraceKit.computeStackTrace.ofCaller();
 *         var data = message + "\n";
 *         for(var i in stackInfo.stack) {
 *             var item = stackInfo.stack[i];
 *             data += (item.func || '[anonymous]') + "() in " + item.url + ":" + (item.line || '0') + "\n";
 *         }
 *         if (window.console)
 *             console.info(data);
 *         else
 *             alert(data);
 *     }
 */
TraceKit.computeStackTrace = (function () {
	var debug = false, sourceCache = {};

	/**
	 * Attempts to retrieve source code via XMLHttpRequest, which is used
	 * to look up anonymous function names.
	 * @param {string} url URL of source code.
	 * @return {string} Source contents.
	 */
	function loadSource(url) {
		try {
			if (XMLHttpRequest === undefined) { // IE 5.x-6.x:
				XMLHttpRequest = function () {
					try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); } catch(e) {}
					try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); } catch(e) {}
					try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch(e) {}
					try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch(e) {}
					throw new Error('No XHR.');
				};
			}

			var request = new XMLHttpRequest();
			request.open('GET', url, false);
			request.send('');
			return request.responseText;
		}
		catch (e) {
			return '';
		}
	}

	/**
	 * Retrieves source code from the source code cache.
	 * @param {string} url URL of source code.
	 * @return {Array.<string>} Source contents.
	 */
	function getSource(url) {
		if (!sourceCache.hasOwnProperty(url)) {
			var source = loadSource(url);
			sourceCache[url] = source.length ? source.split("\n") : [];
		}

		return sourceCache[url];
	}

	/**
	 * Tries to use an externally loaded copy of source code to determine
	 * the name of a function by looking at the name of the variable it was
	 * assigned to, if any.
	 * @param {string} url URL of source code.
	 * @param {(string|number)} lineNo Line number in source code.
	 * @return {string} The function name, if discoverable.
	 */
	function guessFunctionName(url, lineNo) {
		var reFunctionArgNames = /function ([^(]*)\(([^)]*)\)/,
			reGuessFunction = /['"]?([0-9A-Za-z$_]+)['"]?\s*[:=]\s*(function|eval|new Function)/,
			line = '',
			maxLines = 10,
			source = getSource(url),
			m;

		if (!source.length) {
			return '?';
		}

		// Walk backwards from the first line in the function until we find the line which
		// matches the pattern above, which is the function definition
		for (var i = 0; i < maxLines; ++i) {
			line = source[lineNo - i] + line;

			if (line !== undefined) {
				if ((m = reGuessFunction.exec(line))) {
					return m[1];
				}
				else if ((m = reFunctionArgNames.exec(line))) {
					return m[1];
				}
			}
		}

		return '?';
	}

	/**
	 * Retrieves the surrounding lines from where an exception occurred.
	 * @param {string} url URL of source code.
	 * @param {(string|number)} line Line number in source code to centre
	 * around for context.
	 * @return {?Array.<string>} Lines of source code.
	 */
	function gatherContext(url, line) {
		var source = getSource(url),
			context = [],
			hasContext = false;

		if (!source.length) {
			return null;
		}

		line -= 1; // convert to 0-based index

		for (var i = line - 2, j = line + 2; i < j; ++i) {
			context.push(source[i]);
			if (source[i] !== undefined) {
				hasContext = true;
			}
		}

		return hasContext ? context : null;
	}

	/**
	 * Escapes special characters, except for whitespace, in a string to be
	 * used inside a regular expression as a string literal.
	 * @param {string} text The string.
	 * @return {string} The escaped string literal.
	 */
	function escapeRegExp(text) {
		return text.replace(/[\-\[\]{}()*+?.,\\\^$|#]/g, '\\$&');
	}

	/**
	 * Escapes special characters in a string to be used inside a regular
	 * expression as a string literal. Also ensures that HTML entities will
	 * be matched the same as their literal friends.
	 * @param {string} body The string.
	 * @return {string} The escaped string.
	 */
	function escapeCodeAsRegExpForMatchingInsideHTML(body) {
		return escapeRegExp(body).replace('<', '(?:<|&lt;)').replace('>', '(?:>|&gt;)')
				.replace('&', '(?:&|&amp;)').replace('"', '(?:"|&quot;)').replace(/\s+/g, '\\s+');
	}

	/**
	 * Determines where a code fragment occurs in the source code.
	 * @param {RegExp} re The function definition.
	 * @param {Array.<string>} urls A list of URLs to search.
	 * @return {?Object.<string, (string|number)>} An object containing
	 * the url, line, and column number of the defined function.
	 */
	function findSourceInUrls(re, urls) {
		var source, m;
		for (var i = 0, j = urls.length; i < j; ++i) {
			// console.log('searching', urls[i]);
			if ((source = getSource(urls[i])).length) {
				source = source.join("\n");
				if ((m = re.exec(source))) {
					// console.log('Found function in ' + urls[i]);

					return {
						'url': urls[i],
						'line': source.substring(0, m.index).split("\n").length,
						'column': m.index - source.lastIndexOf("\n", m.index) - 1
					};
				}
			}
		}

		// console.log('no match');

		return null;
	}

	/**
	 * Determines at which column a code fragment occurs on a line of the
	 * source code.
	 * @param {string} fragment The code fragment.
	 * @param {string} url The URL to search.
	 * @param {(string|number)} line The line number to examine.
	 * @return {?number} The column number.
	 */
	function findSourceInLine(fragment, url, line) {
		var source = getSource(url),
			re = new RegExp('\\b' + escapeRegExp(fragment) + '\\b'),
			m;

		line -= 1;

		if (source && source.length > line && (m = re.exec(source[line]))) {
			return m.index;
		}

		return null;
	}

	/**
	 * Determines where a function was defined within the source code.
	 * @param {(Function|string)} func A function reference or serialized
	 * function definition.
	 * @return {?Object.<string, (string|number)>} An object containing
	 * the url, line, and column number of the defined function.
	 */
	function findSourceByFunctionBody(func) {
		var urls = [ window.location.href ],
			scripts = document.getElementsByTagName("script"),
			body,
			code = '' + func,
			codeRE = /^function(?:\s+([\w$]+))?\s*\(([\w\s,]*)\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
			eventRE = /^function on([\w$]+)\s*\(event\)\s*\{\s*(\S[\s\S]*\S)\s*\}\s*$/,
			re,
			parts,
			result;

		for (var i = 0; i < scripts.length; ++i) {
			var script = scripts[i];
			if (script.src) {
				urls.push(script.src);
			}
		}

		if (!(parts = codeRE.exec(code))) {
			re = new RegExp(escapeRegExp(code).replace(/\s+/g, '\\s+'));
		}

		// not sure if this is really necessary, but I don’t have a test
		// corpus large enough to confirm that and it was in the original.
		else {
			var name = parts[1] ? '\\s+' + parts[1] : '',
				args = parts[2].split(",").join("\\s*,\\s*");

			body = escapeRegExp(parts[3])
				.replace(/;$/, ';?') // semicolon is inserted if the function ends with a comment
				.replace(/\s+/g, '\\s+');
			re = new RegExp("function" + name + "\\s*\\(\\s*" + args + "\\s*\\)\\s*{\\s*" + body + "\\s*}");
		}

		// look for a normal function definition
		if ((result = findSourceInUrls(re, urls))) {
			return result;
		}

		// look for an old-school event handler function
		if ((parts = eventRE.exec(code))) {
			var event = parts[1];
			body = escapeCodeAsRegExpForMatchingInsideHTML(parts[2]);

			// look for a function defined in HTML as an onXXX handler
			re = new RegExp("on" + event + '=[\\\'"]\\s*' + body + '\\s*[\\\'"]', 'i');

			if ((result = findSourceInUrls(re, urls[0]))) {
				return result;
			}

			// look for ???
			re = new RegExp(body);

			if ((result = findSourceInUrls(re, urls))) {
				return result;
			}
		}

		return null;
	}

	// Contents of Exception in various browsers.
	//
	// SAFARI:
	// ex.message = Can't find variable: qq
	// ex.line = 59
	// ex.sourceId = 580238192
	// ex.sourceURL = http://...
	// ex.expressionBeginOffset = 96
	// ex.expressionCaretOffset = 98
	// ex.expressionEndOffset = 98
	// ex.name = ReferenceError
	//
	// FIREFOX:
	// ex.message = qq is not defined
	// ex.fileName = http://...
	// ex.lineNumber = 59
	// ex.stack = ...stack trace... (see the example below)
	// ex.name = ReferenceError
	//
	// CHROME:
	// ex.message = qq is not defined
	// ex.name = ReferenceError
	// ex.type = not_defined
	// ex.arguments = ['aa']
	// ex.stack = ...stack trace...
	//
	// INTERNET EXPLORER:
	// ex.message = ...
	// ex.name = ReferenceError
	//
	// OPERA:
	// ex.message = ...message... (see the example below)
	// ex.name = ReferenceError
	// ex.opera#sourceloc = 11  (pretty much useless, duplicates the info in ex.message)
	// ex.stacktrace = n/a; see 'opera:config#UserPrefs|Exceptions Have Stacktrace'

	/**
	 * Computes stack trace information from the stack property.
	 * Chrome and Gecko use this property.
	 * @param {Error} ex
	 * @return {?Object.<string, *>} Stack trace information.
	 */
	function computeStackTraceFromStackProp(ex) {
		if (!ex.stack) {
			return null;
		}

		var chrome = /^\s*at (\S+) \(((?:file|http):.*?):(\d+)(?::(\d+))?\)\s*$/i,
			gecko = /^\s*(\S*)(?:\((.*?)\))?@((?:file|http).*?):(\d+)(?::(\d+))?\s*$/i,
			lines = ex.stack.split("\n"),
			stack = [],
			parts,
			element,
			reference = /^(.*) is undefined$/.exec(ex.message);

		for (var i = 0, j = lines.length; i < j; ++i) {
			if ((parts = gecko.exec(lines[i]))) {
				element = { 'url': parts[3], 'func': parts[1], 'args': parts[2] ? parts[2].split(',') : '', 'line': +parts[4], 'column': parts[5] ? +parts[5] : null };
			}
			else if ((parts = chrome.exec(lines[i]))) {
				element = { 'url': parts[2], 'func': parts[1], 'line': +parts[3], 'column': parts[4] ? +parts[4] : null };
			}
			else {
				continue;
			}

			if (!element.func && element.line) {
				element.func = guessFunctionName(element.url, element.line);
			}

			if (element.line) {
				element.context = gatherContext(element.url, element.line);
			}

			stack.push(element);
		}

		if (stack[0] && stack[0].line && !stack[0].column && reference) {
			stack[0].column = findSourceInLine(reference[1], stack[0].url, stack[0].line);
		}

		if (!stack.length) {
			return null;
		}

		return {
			'mode': 'stack',
			'name': ex.name,
			'message': ex.message,
			'stack': stack
		};
	}

	/**
	 * Computes stack trace information from the stacktrace property.
	 * Opera 10 uses this property.
	 * @param {Error} ex
	 * @return {?Object.<string, *>} Stack trace information.
	 */
	function computeStackTraceFromStacktraceProp(ex) {
		// Access and store the stacktrace property before doing ANYTHING
		// else to it because Opera is not very good at providing it
		// reliably in other circumstances.
		var stacktrace = ex.stacktrace;

		var testRE = / line (\d+), column (\d+) in (?:<anonymous function: ([^>]+)>|([^\)]+))\((.*)\) in (.*):\s*$/i,
			lines = stacktrace.split("\n"),
			stack = [],
			parts;

		for (var i = 0, j = lines.length; i < j; i += 2) {
			if ((parts = testRE.exec(lines[i]))) {
				var element = { 'line': +parts[1], 'column': +parts[2], 'func': parts[3] || parts[4], 'args': parts[5] ? parts[5].split(',') : [], 'url': parts[6] };

				if (!element.func && element.line) {
					element.func = guessFunctionName(element.url, element.line);
				}
				if (element.line) {
					try {
						element.context = gatherContext(element.url, element.line);
					}
					catch (exc) {}
				}

				if (!element.context) {
					element.context = [ lines[i + 1] ];
				}

				stack.push(element);
			}
		}

		if (!stack.length) {
			return null;
		}

		return {
			'mode': 'stacktrace',
			'name': ex.name,
			'message': ex.message,
			'stack': stack
		};
	}

	/**
	 * NOT TESTED.
	 * Computes stack trace information from an error message that includes
	 * the stack trace.
	 * Opera 9 and earlier use this method if the option to show stack
	 * traces is turned on in opera:config.
	 * @param {Error} ex
	 * @return {?Object.<string, *>} Stack information.
	 */
	function computeStackTraceFromOperaMultiLineMessage(ex) {
		// Opera includes a stack trace into the exception message. An example is:
		//
		// Statement on line 3: Undefined variable: undefinedFunc
		// Backtrace:
		//   Line 3 of linked script file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.js: In function zzz
		//         undefinedFunc(a);
		//   Line 7 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function yyy
		//           zzz(x, y, z);
		//   Line 3 of inline#1 script in file://localhost/Users/andreyvit/Projects/TraceKit/javascript-client/sample.html: In function xxx
		//           yyy(a, a, a);
		//   Line 1 of function script
		//     try { xxx('hi'); return false; } catch(ex) { TraceKit.report(ex); }
		//   ...

		var lines = ex.message.split('\n');
		if (lines.length < 4) {
			return null;
		}

		var lineRE1 = /^\s*Line (\d+) of linked script ((?:file|http)\S+)(?:: in function (\S+))?\s*$/i,
			lineRE2 = /^\s*Line (\d+) of inline#(\d+) script in ((?:file|http)\S+)(?:: in function (\S+))?\s*$/i,
			lineRE3 = /^\s*Line (\d+) of function script\s*$/i,
			stack = [],
			scripts = document.getElementsByTagName('script'),
			inlineScriptBlocks = [],
			parts,
			i,
			len,
			source;

		for (i in scripts) {
			if (scripts.hasOwnProperty(i) && !scripts[i].src) {
				inlineScriptBlocks.push(scripts[i]);
			}
		}

		for (i = 2, len = lines.length; i < len; i += 2) {
			var item = null;
			if ((parts = lineRE1.exec(lines[i]))) {
				item = { 'url': parts[2], 'func': parts[3], 'line': +parts[1] };
			}
			else if ((parts = lineRE2.exec(lines[i]))) {
				item = { 'url': parts[3], 'func': parts[4] };
				var relativeLine = (+parts[1]);  // relative to the start of the <SCRIPT> block
				var script = inlineScriptBlocks[parts[2] - 1];
				if (script) {
					source = getSource(item.url);
					if (source) {
						source = source.join("\n");
						var pos = source.indexOf(script.innerText);
						if (pos >= 0) {
							item.line = relativeLine + source.substring(0, pos).split("\n").length;
						}
					}
				}
			}
			else if ((parts = lineRE3.exec(lines[i]))) {
				var url = window.location.href.replace(/#.*$/, ''), line = parts[1];
				var re = new RegExp(escapeCodeAsRegExpForMatchingInsideHTML(lines[i + 1]));
				source = findSourceInUrls(re, [url]);
				item = { 'url': url, 'line': source ? source.line : line, 'func': '' };
			}

			if (item) {
				if (!item.func) {
					item.func = guessFunctionName(item.url, item.line);
				}
				var context = gatherContext(item.url, item.line);
				var midline = (context ? context[Math.floor(context.length / 2)] : null);
				if (context && midline.replace(/^\s*/, '') === lines[i + 1].replace(/^\s*/, '')) {
					item.context = context;
				}
				else {
					// if (context) alert("Context mismatch. Correct midline:\n" + lines[i+1] + "\n\nMidline:\n" + midline + "\n\nContext:\n" + context.join("\n") + "\n\nURL:\n" + item.url);
					item.context = [lines[i + 1]];
				}
				stack.push(item);
			}
		}
		if (!stack.length) {
			return null; // could not parse multiline exception message as Opera stack trace
		}

		return {
			'mode': 'multiline',
			'name': ex.name,
			'message': lines[0],
			'stack': stack
		};
	}

	/**
	 * Adds information about the first frame to incomplete stack traces.
	 * Safari and IE require this to get complete data on the first frame.
	 * @param {Object.<string, *>} stackInfo Stack trace information from
	 * one of the compute* methods.
	 * @param {string} url The URL of the script that caused an error.
	 * @param {(number|string)} lineNo The line number of the script that
	 * caused an error.
	 * @param {string=} message The error generated by the browser, which
	 * hopefully contains the name of the object that caused the error.
	 * @return {boolean} Whether or not the stack information was
	 * augmented.
	 */
	function augmentStackTraceWithInitialElement(stackInfo, url, lineNo, message) {
		var initial = {
			'url': url,
			'line': lineNo
		};

		if (initial.url && initial.line) {
			stackInfo.incomplete = false;

			if (!initial.func) {
				initial.func = guessFunctionName(initial.url, initial.line);
			}

			if (!initial.context) {
			initial.context = gatherContext(initial.url, initial.line);
			}

			var reference = / '([^']+)' /.exec(message);
			if (reference) {
				initial.column = findSourceInLine(reference[1], initial.url, initial.line);
			}

			if (stackInfo.stack.length > 0) {
				if (stackInfo.stack[0].url === initial.url) {
					if (stackInfo.stack[0].line === initial.line) {
						return false; // already in stack trace
					}
					else if (!stackInfo.stack[0].line && stackInfo.stack[0].func === initial.func) {
						stackInfo.stack[0].line = initial.line;
						stackInfo.stack[0].context = initial.context;
						return false;
					}
				}
			}

			stackInfo.stack.unshift(initial);
			stackInfo.partial = true;
			return true;
		}
		else {
			stackInfo.incomplete = true;
		}

		return false;
	}

	/**
	 * Computes stack trace information by walking the arguments.caller
	 * chain at the time the exception occurred. This will cause earlier
	 * frames to be missed but is the only way to get any stack trace in
	 * Safari and IE. The top frame is restored by
	 * {@link augmentStackTraceWithInitialElement}.
	 * @param {Error} ex
	 * @return {?Object.<string, *>} Stack trace information.
	 */
	function computeStackTraceByWalkingCallerChain(ex, depth) {
		var functionName = /function\s+([_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*)?\s*\(/i,
		stack = [],
		funcs = {},
		recursion = false,
		parts,
		item,
		source;

		for (var curr = arguments.callee.caller; curr && !recursion; curr = curr.caller) {
			if (curr === computeStackTrace || curr === TraceKit.report) {
				// console.log('skipping internal function');
				continue;
			}

			item = {
				'url': null,
				'func': '?',
				'line': null,
				'column': null
			};

			if (curr.name) {
				item.func = curr.name;
			}
			else if ((parts = functionName.exec(curr.toString()))) {
				item.func = parts[1];
			}

			if ((source = findSourceByFunctionBody(curr))) {
				item.url = source.url;
				item.line = source.line;

				if (item.func === '?') {
					item.func = guessFunctionName(item.url, item.line);
				}

				var reference = / '([^']+)' /.exec(ex.message || ex.description);
				if (reference) {
					item.column = findSourceInLine(reference[1], source.url, source.line);
				}
			}

			if (funcs['' + curr]) {
				item.recursion = true;
			}

			stack.push(item);
		}

		if (depth) {
			// console.log('depth is ' + depth);
			// console.log('stack is ' + stack.length);
			stack.splice(0, depth);
		}

		var result = { 'mode': 'callers', 'name': ex.name, 'message': ex.message, 'stack': stack };
		augmentStackTraceWithInitialElement(result, ex.sourceURL || ex.fileName, ex.line || ex.lineNumber, ex.message || ex.description);
		return result;
	}

	/**
	 * Computes a stack trace for an exception.
	 * @param {Error} ex
	 * @param {(string|number)=} depth
	 */
	function computeStackTrace(ex, depth) {
		var stack = null;
		depth = (depth === undefined ? 0 : +depth);

		try {
			// This must be tried first because Opera 10 *destroys*
			// its stacktrace property if you try to access the stack
			// property first!!
			stack = computeStackTraceFromStacktraceProp(ex);
			if (stack) {
				return stack;
			}
		}
		catch (e) {
			if (debug) {
				throw e;
			}
		}

		try {
			stack = computeStackTraceFromStackProp(ex);
			if (stack) {
				return stack;
			}
		}
		catch (e) {
			if (debug) {
				throw e;
			}
		}

		try {
			stack = computeStackTraceFromOperaMultiLineMessage(ex);
			if (stack) {
				return stack;
			}
		}
		catch (e) {
			if (debug) {
				throw e;
			}
		}

		try {
			stack = computeStackTraceByWalkingCallerChain(ex, depth + 1);
			if (stack) {
				return stack;
			}
		}
		catch (e) {
			if (debug) {
				throw e;
			}
		}

		return { 'mode': 'failed' };
	}

	/**
	 * Logs a stacktrace starting from the previous call and working down.
	 * @param {(number|string)=} depth How many frames deep to trace.
	 * @return {Object.<string, *>} Stack trace information.
	 */
	function computeStackTraceOfCaller(depth) {
		depth = (depth === undefined ? 0 : +depth) + 1; // "+ 1" because "ofCaller" should drop one frame
		try {
			(0)();
		}
		catch (ex) {
			return computeStackTrace(ex, depth + 1);
		}

		return null;
	}

	computeStackTrace.augmentStackTraceWithInitialElement = augmentStackTraceWithInitialElement;
	computeStackTrace.guessFunctionName = guessFunctionName;
	computeStackTrace.gatherContext = gatherContext;
	computeStackTrace.ofCaller = computeStackTraceOfCaller;

	return computeStackTrace;
}());

/**
 * Extends support for global error handling for asynchronous browser
 * functions. Adopted from Closure Library's errorhandler.js
 */
(function (w) {
	var _helper = function(fnName) {
		var originalFn = w[fnName];
		w[fnName] = function() {
			// Make a copy of the arguments
			var args = Array.prototype.slice.call(arguments, 0);
			var originalCallback = args[0];
			if(typeof(originalCallback) === 'function') {
				args[0] = function() {
					try {
						originalCallback.apply(this, arguments);
					} catch (e) {
						TraceKit.report(e);
						throw e;
					}
				};
			} 
			// IE < 9 doesn't support .call/.apply on setInterval/setTimeout, but it
			// also only supports 2 argument and doesn't care what "this" is, so we
			// can just call the original function directly.
			if (originalFn.apply) {
				return originalFn.apply(this, args);
			}
			else {
				return originalFn(args[0], args[1]);
			}
		};
	};

	_helper('setTimeout');
	_helper('setInterval');
}(window));

/**
 * Extended support for backtraces and global error handling for most
 * asynchronous jQuery functions.
 */
(function ($) {

	// quit if jQuery isn't on the page
	if (!$) {
		return;
	}

	var _oldEventAdd = $.event.add;
	$.event.add = function (elem, types, handler, data) {
		var _handler;

		if (handler.handler) {
			_handler = handler.handler;
			handler.handler = function () {
				try {
					return _handler.apply(this, arguments);
				}
				catch (e) {
					TraceKit.report(e);
					throw e;
				}
			};
		}
		else {
			_handler = handler;
			handler = function () {
				try {
					return _handler.apply(this, arguments);
				}
				catch (e) {
					TraceKit.report(e);
					throw e;
				}
			};
		}

		// If the handler we are attaching doesn’t have the same guid as
		// the original, it will never be removed when someone tries to
		// unbind the original function later. Technically as a result of
		// this our guids are no longer globally unique, but whatever, that
		// never hurt anybody RIGHT?!
		if (_handler.guid) {
			handler.guid = _handler.guid;
		}
		else {
			handler.guid = _handler.guid = $.guid++;
		}

		return _oldEventAdd.call(this, elem, types, handler, data);
	};

	var _oldReady = $.fn.ready;
	$.fn.ready = function (fn) {
		var _fn = function () {
			try {
				return fn.apply(this, arguments);
			}
			catch (e) {
				TraceKit.report(e);
				throw e;
			}
		};

		return _oldReady.call(this, _fn);
	};

	var _oldAjax = $.ajax;
	$.fn.ajax = function (s) {
		if ($.isFunction(s.complete)) {
			var _oldComplete = s.complete;
			s.complete = function () {
				try {
					return _oldComplete.apply(this, arguments);
				}
				catch (e) {
					TraceKit.report(e);
					throw e;
				}
			};
		}

		if ($.isFunction(s.error)) {
			var _oldError = s.error;
			s.error = function () {
				try {
					return _oldError.apply(this, arguments);
				}
				catch (e) {
					TraceKit.report(e);
					throw e;
				}
			};
		}

		if ($.isFunction(s.success)) {
			var _oldSuccess = s.success;
			s.success = function () {
				try {
					return _oldSuccess.apply(this, arguments);
				}
				catch (e) {
					TraceKit.report(e);
					throw e;
				}
			};
		}

		try {
			return _oldAjax.call(this, s);
		}
		catch (e) {
			TraceKit.report(e);
			throw e;
		}
	};

}(window.jQuery));
