var string = require('./lib/string'),
	spawn = require('child_process').spawn,
	fs = require('fs'),
	plist = require('plist'),
	parser = new (require('xml2js')).Parser({
		trim: true,
		normalize: true,
		explicitArray: false
	});



var PROFILES_DIR = process.env['HOME'] + '/Library/MobileDevice/Provisioning Profiles/';




var help = {
	'i5': 'Run project in iphone 5 simulator - iPhone (Retina 4-inch).',
	'i4': 'Run project in iphone 4 simulator - iPhone (Retina 3.5-inch).',
	'i3': 'Run project in iphone 3 simulator - iPhone.',
	'di': 'Deploy to device without using iTunes :)',
	'clean':'Clean the project and start fresh.'
};


function execute(params, callback) {
	var prc = spawn('titanium',  params);

	prc.stdout.setEncoding('utf8');
	prc.stdout.on('data', function (data) {
	    var str = data.toString().replace(/\n{2,}/gi,"\n");
		console.log(str);
	});

	prc.on('close', function (code) {
		!!callback && callback();
	});
};


function install(params, callback) {
	
	var prc = spawn(__dirname + '/bin/fruitstrap',  params);

	prc.stdout.setEncoding('utf8');
	prc.stdout.on('data', function (data) {
	    var str = data.toString().replace(/\n{2,}/gi,"\n");
		console.log(str);
	});

	prc.on('close', function (code) {
		!!callback && callback();
	});
};


function get_profiles(id, callback) {
	var profiles = [];
	
	fs.readdir(PROFILES_DIR, function (err, files) {
		if (err !== null) {
			callback(true, 'Error searching for provisioning profiles');
			return;
		}

		l = files.length;
		while (l--)	{
			if (files[l] !== '.DS_Store') {
				var xml = fs.readFileSync(PROFILES_DIR + files[l], 'utf8'),
				parsed_plist = plist.parseStringSync(xml.substring(xml.indexOf('<?xml'), xml.indexOf('</plist>') + 8)),
				PlistAppIdPrefix = parsed_plist.ApplicationIdentifierPrefix,
				PlistAppId = parsed_plist.Entitlements['application-identifier'],
				PlistProfile = PlistAppId.replace(PlistAppIdPrefix+'.','').replace('.*','');

				if (id.indexOf(PlistProfile) >= 0 ) {
					if (new Date() > new Date(parsed_plist.ExpirationDate) ) {
						console.log(('Found an EXPIRED matching profile: '+ parsed_plist.Name.inverse +' => ' + PlistAppId.inverse) );
						console.log('Trying to find another profile...');
					}
					else {
						console.log(('Found a VALID matching profile: "'+ parsed_plist.Name.inverse+'" => '+PlistAppId.inverse+'\nTrying with this one...').green);
						callback(null,files[l].substring(0, files[l].indexOf('.')));
					}
				}
			}
		}
	});
}


module.exports = {
	help: function() {
		var list = [];
		for (var k in help) {
			list.push('  ' + string.rpad(k, 15) + help[k].grey);
		}

		var prompt = ["Available commands:".yellow.bold, "", list.join("\n"), ""];
		console.log(prompt.join("\n"));
	},
	clean: function() { 
		execute(['clean'], function(){
			console.log('Simulator should be started now...'.cyan);
		});
	},
	i5: function(tiapp) {
		execute(['build','-p','ios','--retina','--tall'], function(){
			console.log('Simulator should be started now...'.cyan);
		});
	},
	i4: function(tiapp) {
		execute(['build','-p','ios','--retina'], function(){
			console.log('Simulator should be started now...'.cyan);
		});
	},
	i3: function(tiapp) {
		execute(['build','-p','ios'], function(){
			console.log('Simulator should be started now...'.cyan);
		});
	},
	di: function(tiapp) {
		
		var options = ['build','-p','ios','-T','device','-b'];
		
		get_profiles(tiapp.id, function(err,profile_id){
			execute(options.concat(['-P', profile_id]),function(){
				console.log('Trying to install on device...'.cyan);
				var app_file = process.cwd()+'/build/iphone/build/Debug-iphoneos/'+tiapp.name+'.app';

				fs.exists(app_file, function(exists){
					if (exists) {
						console.log(app_file);
						install([app_file], function() {
							process.exit();
						});
					}
				});
				
			});
		});
		
	}
}
