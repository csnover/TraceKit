beforeEach(function () {
    jasmine.addMatchers({
        toMatchStackFrame: function () {
            return {
                compare: function (actual, expected) {
                    var message = '';
                    if (actual.func !== expected[0]) {
                        message += 'expected functionName: ' + actual.func + ' to equal ' + expected[0] + '\n';
                    }

                    if (Array.isArray(actual.args) && Array.isArray(expected[1])) {
                        if (actual.args.join() !== expected[1].join()) {
                            message += 'expected args: ' + actual.args + ' to equal ' + expected[1] + '\n';
                        }
                    } else if (actual.args !== expected[1]) {
                        message += 'expected args: ' + actual.args + ' to equal ' + expected[1] + '\n';
                    }

                    if (actual.url !== expected[2]) {
                        message += 'expected fileName: ' + actual.url + ' to equal ' + expected[2] + '\n';
                    }

                    if (actual.line !== expected[3]) {
                        message += 'expected lineNumber: ' + actual.line + ' to equal ' + expected[3] + '\n';
                    }

                    if (actual.column !== expected[4]) {
                        message += 'expected columnNumber: ' + actual.column + ' to equal ' + expected[4] + '\n';
                    }

                    this.message = function () {
                        return message
                    };

                    return message === '';
                }
            };
        }
    });
});
