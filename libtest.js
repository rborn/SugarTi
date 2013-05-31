var exec = require('child_process').exec,
fs = require('fs');




var env = process.env;
env['DYLD_LIBRARY_PATH'] = (__dirname +'/bin/libimobiledevice/') + (env['DYLD_LIBRARY_PATH'] ? ':'+env['DYLD_LIBRARY_PATH'] : '');


console.log(env);

var config = {
    env: env
};


var running_app = exec(__dirname +'/bin/libimobiledevice/idevice_id -l', config, function(error, stdout, stderr) {




	console.log(stdout)	;
	console.error(stderr);
	
});	

// var prc = exec('xcrun -sdk iphoneos PackageApplication -v '+, params);
// 
// 
// prc.stdout.setEncoding('utf8');
// prc.stdout.pipe(process.stdout);
// prc.stderr.pipe(process.stderr);
// 
// prc.on('close', function(code) { !! callback && callback();
// });

// xcrun -sdk iphoneos PackageApplication -v ./build/iphone/build/Debug-iphoneos/AsturPlaya.app -o  /tmp/AsturPlaya1.ipa
