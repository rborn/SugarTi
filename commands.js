var utils = require('./lib/utils'),
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
	fs = require('fs'),
	plist = require('plist'),
	parser = new(require('xml2js')).Parser({
	trim: true,
	normalize: true,
	explicitArray: false
});

var PROFILES_DIR = process.env['HOME'] + '/Library/MobileDevice/Provisioning Profiles/';

// var help = {
// 	'i5, iphone5': 'Run project in iphone 5 simulator - iPhone (Retina 4-inch).',
// 	'i4, iphone4': 'Run project in iphone 4 simulator - iPhone (Retina 3.5-inch).',
// 	'i3, iphone3': 'Run project in iphone 3 simulator - iPhone.',
// 	'di, deployios': 'Deploy to device without using iTunes :)',
// 	'ri, reloadios': 'Just RELOAD the app in simulator - '+'Only the changes in JS files will have effect!'.yellow,
// 	'ci, cleaniphone':'Clean the project and start fresh.',
//	'deli, deleteiphone':'Delete the aplication from the simulator'
// };
var help = {
	'i5': 'Run project in iphone 5 simulator - iPhone (Retina 4-inch).',
	'i4': 'Run project in iphone 4 simulator - iPhone (Retina 3.5-inch).',
	'i3': 'Run project in iphone 3 simulator - iPhone.',
	'di': 'Deploy to device without using iTunes :)',
	'ri': 'Just RELOAD the app in simulator - ' + 'Only the changes in JS files will have effect!'.yellow,
	'clean': 'Clean the iOs project and start fresh.'
};



function getLastSession(params, callback) {
	fs.exists(__dirname + '/session.json', function(exists) {
		if (exists) {
			fs.readFile(__dirname + '/session.json', function(err, data) {
				if (!err && data) {
					try {
						var last_session = JSON.parse(data);
						if (last_session && last_session) {
							getTiapp(function(tiapp) {
								callback(null, last_session);
							});
						}

					}
					catch(err) {
						callback(err);
					}
				} else {
					callback(err);
				}
			});
		} else {
			callback('no_session');
		}
	});
}



function execute(params, callback) {

	getTiapp(function(tiapp) {

		var prc = spawn('titanium', params);

		prc.stdout.setEncoding('utf8');
		prc.stdout.pipe(process.stdout);
		prc.stderr.pipe(process.stderr);

		var gotit = false;

		prc.stdout.on('data', function(data) {
			if (!gotit) {
				gotit = true;
				var running_app = exec('ps -eo comm|grep ' + tiapp.name + '.app|grep -v \'grep\'', function(error, stdout, stderr) {

					if (error || !stdout) {
						gotit = false;
					} else {
						getLastSession(params, function(err, res) {
							var res = res || {};
							res[tiapp.name] = res[tiapp.name] || {};

							res[tiapp.name].app = stdout.trim()
							fs.writeFile(__dirname + '/session.json', JSON.stringify(res), function(err) {
								if (err) throw err;
								utils.message('Session saved!', 'success');
							});

						})

					}
				});

			}
		});

	});

};



function install(params, callback) {

	var prc = spawn(__dirname + '/bin/fruitstrap', params);

	prc.stdout.setEncoding('utf8');
	prc.stdout.pipe(process.stdout);
	prc.stderr.pipe(process.stderr);

	prc.on('close', function(code) { !! callback && callback();
	});
};



function getIosEnv(callback) {
	var prc = spawn('titanium', ['info', '-t', 'ios', '-o', 'json']);
	prc.stdout.setEncoding('utf8');

	var buf = '';
	prc.stdout.on('data', function(data) {
		buf = buf + data.toString();
	});

	prc.on('close', function(code) {

		var data = JSON.parse(buf);
		var out = {};

		Object.keys(data.xcode).forEach(function(kc) {
			if (data.xcode[kc].selected) {
				out.sim = data.xcode[kc].sims.reverse();
				out.device = data.xcode[kc].sdks.reverse();
			}
		});

		!! callback && callback(out);
	});
};



function tailAppLog(tiapp) {
	var running_app = exec('ps -eo comm|grep ' + tiapp.name + '.app|grep -v \'grep\'', function(error, stdout, stderr) {

		if (error || !stdout) {
			utils.message('Cannot find the running app', error);
			return;
		}

		else {
			var log_file = stdout.replace(tiapp.name + '.app/' + tiapp.name + '\n', 'Documents/' + tiapp.guid + '.log').trim();
			var tail = spawn('tail', ['-f', log_file]);

			tail.stdout.setEncoding('utf8');
			// tail.stdout.pipe(process.stdout);
			tail.stdout.on('data', function(data) {
				utils.logWatcher(error, data);
			});

			tail.stderr.on('data', function(data) {
				utils.logWatcher(error, data);
			});

			tail.on('close', function(code) {
				utils.message('The logger exited with the code: ' + code, 'warn');
			});

		}
	});
};



function getTiapp(callback) {
	fs.readFile(process.cwd() + '/tiapp.xml', 'utf-8', function(err, xml) {
		if (err !== null) {
			utils.message("\nIt seems that tiapp.xml it's not correct.\nPlease review it for possible XML errors.\n", 'error');
			return;
		}

		parser.parseString(xml, function(err, tiapp) {
			if (err !== null) {
				utils.message("\nIt seems that tiapp.xml it's not correct.\nPlease review it for possible XML errors.\n", 'error');
				return;
			} !! callback && callback(tiapp['ti:app']);
		});
	});
};



function getProfiles(id, callback) {
	var profiles = [];

	fs.readdir(PROFILES_DIR, function(err, files) {
		if (err !== null) {
			callback(true, 'Error searching for provisioning profiles');
			return;
		}

		l = files.length;
		while (l--) {
			if (files[l] !== '.DS_Store') {
				var xml = fs.readFileSync(PROFILES_DIR + files[l], 'utf8'),
					parsed_plist = plist.parseStringSync(xml.substring(xml.indexOf('<?xml'), xml.indexOf('</plist>') + 8)),
					PlistAppIdPrefix = parsed_plist.ApplicationIdentifierPrefix,
					PlistAppId = parsed_plist.Entitlements['application-identifier'],
					PlistProfile = PlistAppId.replace(PlistAppIdPrefix + '.', '').replace('.*', '');

				if (id.indexOf(PlistProfile) >= 0) {
					if (new Date() > new Date(parsed_plist.ExpirationDate)) {
						console.log(('Found an EXPIRED matching profile: ' + parsed_plist.Name.inverse + ' => ' + PlistAppId.inverse));
						console.log('Trying to find another profile...');
					} else {
						console.log(('Found a VALID matching profile: "' + parsed_plist.Name.inverse + '" => ' + PlistAppId.inverse + '\nTrying with this one...\n\n').green);
						callback(null, files[l].substring(0, files[l].indexOf('.')));
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
			list.push('  ' + utils.rpad(k, 15) + help[k].grey);
		}

		var prompt = ["Available commands:".yellow.bold, "", list.join("\n"), ""];
		console.log(prompt.join("\n"));
	},
	clean: function(tiapp) {
		execute(['clean'], function() {
			utils.message('STI done.');
		});
	},
	i5: function(tiapp) {

		execute(['build', '-p', 'ios', '-D', 'development', '--retina', '--tall'], function() {
			utils.message('Simulator should be started now...');
		});
	},
	i4: function(tiapp) {
		execute(['build', '-p', 'ios', '-D', 'development', '--retina'], function() {
			utils.message('Simulator should be started now...');
		});
	},
	i3: function(tiapp) {
		execute(['build', '-p', 'ios', '-D', 'development'], function() {
			utils.message('Simulator should be started now...');
		});
	},
	di: function(tiapp) {

		var options = ['build', '-p', 'ios', '-T', 'device', '-b'];

		getProfiles(tiapp.id, function(err, profile_id) {
			execute(options.concat(['-P', profile_id]), function() {
				utils.message('Trying to install on device...');
				var app_file = process.cwd() + '/build/iphone/build/Debug-iphoneos/' + tiapp.name + '.app';

				fs.exists(app_file, function(exists) {
					if (exists) {
						install([app_file], function() {
							process.exit();
						});
					}
				});

			});
		});
	},
	ri: function(tiapp) {

		var running_app = exec('ps -eo comm|grep ' + tiapp.name + '.app|grep -v \'grep\'', function(error, stdout, stderr) {
			var app = stdout.replace(/.app\/(.*)/, '.app').trim();

			if (app) {

				fs.exists(app, function(exists) {
					if (exists) {

						utils.message('Trying to reload app...\n\tOk, app running, restarting...');

						var killInstruments = spawn('killall', ['instruments']);
						fs.unlink('/tmp/sti.trace');

						setTimeout(function() {
							var reload = spawn('instruments', ['-D', '/tmp/sti.trace', '-t', '/Applications/Xcode.app/Contents/Applications/Instruments.app/Contents/PlugIns/AutomationInstrument.bundle/Contents/Resources/Automation.tracetemplate', app], {
								detached: true
							});

							exec('osascript -e \'application "iPhone Simulator" activate\'');

							setTimeout(function() {
								tailAppLog(tiapp);
							},
							2000);

						},
						500);
					} else {
						utils.message('It seems the app doesn\'t exist anymore in the current simulator.\n\tYou will have to run a new build command (sti with i3,i4 or i5)', 'error');
					}
				});

			} else {
				utils.message('App not running, trying to restart...', 'warn');
				getLastSession(tiapp, function(err, session) {
					if (!err && session && session[tiapp.name] && session[tiapp.name].app) {

						fs.exists(session[tiapp.name].app, function(exists) {
							if (exists) {
								var reload = spawn('instruments', ['-D', '/tmp/sti.trace', '-t', '/Applications/Xcode.app/Contents/Applications/Instruments.app/Contents/PlugIns/AutomationInstrument.bundle/Contents/Resources/Automation.tracetemplate', session[tiapp.name].app], {
									detached: true
								});

								var interval = setInterval(function() {

									exec('ps -eo comm|grep "' + session[tiapp.name].app + '"|grep -v \'grep\'', function(error, stdout, stderr) {

										if (stdout.trim() == session[tiapp.name].app) {

											setTimeout(function() {
												tailAppLog(tiapp);
											},
											1000);
											clearInterval(interval);
											exec('osascript -e \'application "iPhone Simulator" activate\'');
										}
									});

								},
								1000);
							} else {
								utils.message('It seems the app doesn\'t exist anymore in the current simulator.\n\tYou will have to run a new build command (sti with i3,i4 or i5)', 'error');
								
								delete session[tiapp.name];
								
								fs.writeFile(__dirname + '/session.json', JSON.stringify(session), function(err) {});
							}
						})

					} else {
						utils.message('Cannot restart app, run a build command (sti with i3, i4 or i5)', 'error');
					}
				})
			}
		});
	},
	getTiapp: getTiapp
};
