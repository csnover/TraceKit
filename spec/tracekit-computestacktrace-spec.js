(function() {
    'use strict';

    describe('computeStackTrace', function(){
        describe('domain regex', function(){
            var regex = /(.*)\:\/\/([^\/]+)\/{0,1}([\s\S]*)/;
            it('should return subdomains properly', function (){
                var url = 'https://subdomain.yoursite.com/assets/main.js';
                var domain = 'subdomain.yoursite.com';
                expect(regex.exec(url)[2]).toBe(domain);
            });
            it('should return domains correctly with any protocol', function(){
                var url = 'http://yoursite.com/assets/main.js';
                var domain = 'yoursite.com';
                expect(regex.exec(url)[2]).toBe(domain);
            });
            it('should return the correct domain when directories match the domain', function(){
                var url = 'https://mysite.com/mysite/main.js';
                var domain = 'mysite.com';
                expect(regex.exec(url)[2]).toBe(domain);
            });
        });
    });
})();
