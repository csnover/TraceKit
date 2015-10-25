//import { TraceKit } from '../tracekit';
//
////var _oldTraceKit = window.TraceKit;
//
//
/////**
//// * TraceKit.noConflict: Export TraceKit out to another variable
//// * Example: var TK = TraceKit.noConflict()
//// */
////TraceKit.noConflict = function noConflict() {
////  window.TraceKit = _oldTraceKit;
////  return TraceKit;
////};
//
//
//var _oldOnerrorHandler, _onErrorHandlerInstalled;
//
///**
// * Ensures all global unhandled exceptions are recorded.
// * Supported by Gecko and IE.
// * @param {string} message Error message.
// * @param {string} url URL of script that generated the exception.
// * @param {(number|string)} lineNo The line number at which the error
// * occurred.
// * @param {?(number|string)} columnNo The column number at which the error
// * occurred.
// * @param {?Error} errorObj The actual Error object.
// */
//function traceKitWindowOnError(message, url, lineNo, columnNo, errorObj) {
//  var stack = null;
//
//  if (lastExceptionStack) {
//    TraceKit.computeStackTrace.augmentStackTraceWithInitialElement(lastExceptionStack, url, lineNo, message);
//    processLastException();
//  } else if (errorObj) {
//    stack = TraceKit.computeStackTrace(errorObj);
//    notifyHandlers(stack, true);
//  } else {
//    var location = {
//      'url': url,
//      'line': lineNo,
//      'column': columnNo
//    };
//    location.func = TraceKit.computeStackTrace.guessFunctionName(location.url, location.line);
//    location.context = TraceKit.computeStackTrace.gatherContext(location.url, location.line);
//    stack = {
//      'mode': 'onerror',
//      'message': message,
//      'stack': [location]
//    };
//
//    notifyHandlers(stack, true);
//  }
//
//  if (_oldOnerrorHandler) {
//    return _oldOnerrorHandler.apply(this, arguments);
//  }
//
//  return false;
//}
//
//function installGlobalHandler() {
//  if (_onErrorHandlerInstalled === true) {
//    return;
//  }
//  _oldOnerrorHandler = window.onerror;
//  window.onerror = traceKitWindowOnError;
//  _onErrorHandlerInstalled = true;
//}
