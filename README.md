TraceKit
========

### Tracekit is a JavaScript library that automatically normalizes and exposes stack traces for unhandled exceptions across the 5 major browsers: IE, Firefox, Chrome, Safari, and Opera. ###

Based on the hard work of [Andrey Tarantsov](http://www.tarantsov.com/).

TraceKit:

* leverages native browser support for retrieving stack traces from Error objects where available, and squeezes out as much useful information as possible from browsers that don’t. 
* integrates neatly with **jQuery**, automatically wrapping all of your event handlers and AJAX callbacks so that you get the most useful stack information possible.
* attempts to extend support for column-level granularity of the top-most frame to all browsers, in order to allow you to debug even minified JavaScript. This does not work perfectly, and won’t until all browser manufacturers are exposing good stack trace information, but it ought to be more useful than nothing.

Just 8kB minified and 3kB minified + gzipped.

The best software is software that doesn’t generate any unhandled exceptions; I hope TraceKit helps you achieve that goal.

*-Colin Snover*



Tracekit supports:

* Firefox: full stack trace with line numbers, plus column number on top frame; column number is not guaranteed
* Opera:   full stack trace with line and column numbers
* Chrome:  full stack trace with line and column numbers
* Safari:  line and column number for the top frame only; some frames  may be missing, and column number is not guaranteed
* IE:      line and column number for the top frame only; some frames may be missing, and column number is not guaranteed

In theory, TraceKit should work on all of the following versions:

* IE5.5+ (only 8.0 tested)
* Firefox 0.9+ (only 3.5+ tested)
* Opera 7+ (only 10.50 tested; versions 9 and earlier may require `Exceptions Have Stacktrace` to be enabled in opera:config)
* Safari 3+ (only 4+ tested)
* Chrome 1+ (only 5+ tested)
* Konqueror 3.5+ (untested)

## API 

*   `TraceKit.report.subscribe(function(stackInfo) { ... })`
*   `TraceKit.report.unsubscribe(function(stackInfo) { ... })`
*   `TraceKit.report(exception)`  (e.g. `try { ...code... } catch(ex) { TraceKit.report(ex); }` )


`view the source` comments for more details and examples

[Announcement blog post](http://zetafleet.com/blog/improve-javascript-error-reporting-with-tracekit) in case you'd like to comment.