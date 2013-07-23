var utils = require('./lib/utils'),
	spawn = require('child_process').spawn,
	exec = require('child_process').exec,
	fs = require('fs'),
	plist = require('plist'),
	prompt = require("prompt"),
	parser = new(require('xml2js')).Parser({
		trim: true,
		normalize: true,
		explicitArray: false
	});

prompt.message = prompt.delimiter = '';

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
	'i5': 'Run project in the iPhone 5 simulator - iPhone (Retina 4-inch).',
	'i4': 'Run project in the iPhone 4 simulator - iPhone (Retina 3.5-inch).',
	'i3': 'Run project in the iPhone 3 simulator - iPhone.\n',
	'   -c': 'Add '+'-c'.white.bold+' to '.grey+'i5'.white.bold+', '.grey+'i4'.white.bold+' or '.grey+'i3'.white.bold+' to force clean the project before building again (shortcut to '.grey+'sti c && sti iX'.white.bold+')'.grey,
	'   -f': 'Add '+'-f'.white.bold+' to '.grey+'i5'.white.bold+', '.grey+'i4'.white.bold+' or '.grey+'i3'.white.bold+' to force a full rebuild\n'.grey,
	'di': 'Deploy to '+'iOs device'.white.bold+' device without using iTunes :)'.grey,
	'di -i': 'Deploy to '+'iOs device'.white.bold+' the last build '.grey+'without'.white.bold+' recompiling - usefull if you switch devices\n'.grey,
	'da': 'Deploy to '+'Android device'.white.bold+'\n',
	'da -i': 'Deploy to '+'Android device'.white.bold+' the last build '.grey +'without'.white.bold+' recompiling - usefull if you switch devices\n'.grey,
	'ri': 'Hot RELOAD the app in iOS simulator - ' + 'Only the changes in JS files will have effect!\n'.white.bold,
	'c, clean': 'Clean the iOS project and start fresh.'
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

							res[tiapp.name].app = stdout.trim();
							fs.writeFile(__dirname + '/session.json', JSON.stringify(res), function(err) {
								if (err) throw err;
								// utils.message('Session saved!', 'success');
							});

						});

					}
				});

			}
		});

		prc.on('close', function(code) { !! callback && callback();
		});

	});

};



function install(params, callback) {


	if (params.ipa) {
		var env = process.env;
		env['DYLD_LIBRARY_PATH'] = (__dirname +'/bin/libimobiledevice/') + (env['DYLD_LIBRARY_PATH'] ? ':'+env['DYLD_LIBRARY_PATH'] : '');

		var libimobiledevice_config = {
		    env: env
		};
	}
	
	
	if (params.install_only) {

		var prc = spawn(__dirname +'/bin/libimobiledevice/ideviceinstaller'	, ['-i',params.ipa], libimobiledevice_config);

		prc.stdout.setEncoding('utf8');
		prc.stdout.pipe(process.stdout);
		prc.stderr.pipe(process.stderr);
		
		prc.on('close', function(code) { 
			!! callback && callback();
		});
		
	}
	else {
		exec('xcrun -sdk iphoneos PackageApplication "'+params.app+ '" -o "'+params.ipa+'"', function(err, stdout,stderr) {
			if (!err) {
				var prc = spawn(__dirname +'/bin/libimobiledevice/ideviceinstaller'	, ['-i',params.ipa], libimobiledevice_config);

				prc.stdout.setEncoding('utf8');
				prc.stdout.pipe(process.stdout);
				prc.stderr.pipe(process.stderr);

				prc.on('close', function(code) { 
					!! callback && callback();
				});
			}
			else {
				
				console.error('xcrun packing error '+err);
			}
		});
	}
	

	
	// var running_app = exec(__dirname +'/bin/libimobiledevice/idevice_id -l', libimobiledevice_config, function(error, stdout, stderr) {
	// 	console.log(stdout)	;
	// 	console.error(stderr);
	// 
	// });	
	
	

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


		Object.keys(data.iOSProvisioningProfiles).forEach(function(kc) {
				out[kc] = data.iOSProvisioningProfiles[kc];
		});


		!! callback && callback(null,out);
	});
};



function getAndroidEnv(callback) {
	var prc = spawn('titanium', ['info', '-t', 'android', '-o', 'json']);
	prc.stdout.setEncoding('utf8');

	var buf = '';
	prc.stdout.on('data', function(data) {
		buf = buf + data.toString();
	});

	prc.on('close', function(code) {

		var data = JSON.parse(buf);
		var out = {};

		if (data && data.android && data.android.sdkPath) {
			out.sdkPath = data.android.sdkPath;
		}

		!! callback && callback(null,out);
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



function getTiapp(callback, params) {
	fs.readFile(process.cwd() + '/tiapp.xml', 'utf-8', function(err, xml) {
		if (err !== null) {
			utils.message("\nIt seems that tiapp.xml it's not correct.\nPlease review it for possible XML errors.\n", 'error');
			return;
		}

		parser.parseString(xml, function(err, tiapp) {
			if (err !== null) {
				utils.message("\nIt seems that tiapp.xml it's not correct.\nPlease review it for possible XML errors.\n", 'error');
				return;
			} !! callback && callback(tiapp['ti:app'],params);
		});
	});
};



function getProfiles(id, callback) {
	var profiles = [];

	// 
	
	
	// prompt.start();
	// 
	// var property = {
	//   name: 'yesno',
	//   message: 'are you sure?',
	//   validator: /y[es]*|n[o]?/,
	//   warning: 'Must respond yes or no',
	//   default: 'no'
	// };
	// 
	// //
	// // Get the simple yes or no property
	// //
	// prompt.get(property, function (err, result) {
	//   //
	//   // Log the results.
	//   //
	//   console.log('Command-line input received:');
	//   console.log('  result: ' + result.yesno);
	// });
	// 
	// 
	// getIosEnv( function(err,profs) {
	// 	
	// 	
	// });



	fs.readdir(PROFILES_DIR, function(err, files) {
		if (err !== null) {
			callback(true, 'Error searching for provisioning profiles');
			return;
		}

		var found_profile =  false;

		for (var i = 0; i < files.length; i++) {
			if (files[i] !== '.DS_Store') {
				var xml = fs.readFileSync(PROFILES_DIR + files[i], 'utf8'),
					parsed_plist = plist.parseStringSync(xml.substring(xml.indexOf('<?xml'), xml.indexOf('</plist>') + 8)),
					PlistAppIdPrefix = parsed_plist.ApplicationIdentifierPrefix,
					PlistAppId = parsed_plist.Entitlements['application-identifier'],
					
					PlistProfile = PlistAppId.replace(PlistAppIdPrefix + '.', '');
					WildcarPlistProfile = PlistAppId.replace(PlistAppIdPrefix + '.', '').replace('.*', '');
					UUID = parsed_plist.UUID;

					DeveloperName = parsed_plist.TeamName;					

				if (id.indexOf(PlistProfile) >= 0 || id.indexOf(WildcarPlistProfile) >= 0) {
					if (new Date() > new Date(parsed_plist.ExpirationDate)) {
						console.log(('Found an EXPIRED matching profile: ' + parsed_plist.Name.inverse + ' => ' + PlistAppId.inverse));
						console.log('Trying to find another profile...');
					} else {

						var type = 'development';

						if (!parsed_plist.ProvisionedDevices || !parsed_plist.ProvisionedDevices.length) {
							type = 'distribution';
						} else if (parsed_plist.DeveloperCertificates[0].indexOf('Distribution:') != -1) {
							type = 'adhoc';
						}

						type != 'distribution' && profiles.push({
							name: parsed_plist.Name,
							id: PlistProfile,
							developer_name: DeveloperName,
							UUID: UUID,
							profile_file:files[i].substring(0, files[i].indexOf('.')),
							type: type
						});

					}
				}
			}

		}

		// if (!found_profile) {
		// 
		// 
		// 
		// 	for (var i = 0; i < files.length; i++) {
		// 		if (files[i] !== '.DS_Store') {
		// 			var xml = fs.readFileSync(PROFILES_DIR + files[i], 'utf8'),
		// 				parsed_plist = plist.parseStringSync(xml.substring(xml.indexOf('<?xml'), xml.indexOf('</plist>') + 8)),
		// 				PlistAppIdPrefix = parsed_plist.ApplicationIdentifierPrefix,
		// 				PlistAppId = parsed_plist.Entitlements['application-identifier'],
		// 
		// 				// PlistProfile = PlistAppId.replace(PlistAppIdPrefix + '.', '');
		// 				WildcarPlistProfile = PlistAppId.replace(PlistAppIdPrefix + '.', '').replace('.*', '');
		// 
		// 				DeveloperName = parsed_plist.TeamName;					
		// 
		// 			if (id.indexOf(WildcarPlistProfile) >= 0) {
		// 				if (new Date() > new Date(parsed_plist.ExpirationDate)) {
		// 					console.log(('Found an EXPIRED matching profile: ' + parsed_plist.Name.inverse + ' => ' + PlistAppId.inverse));
		// 					console.log('Trying to find another profile...');
		// 				} else {
		// 					console.log(('Found a VALID WILDCARD matching profile:\n' + parsed_plist.Name.inverse + ' with id: ' + PlistProfile.inverse + ' and Developer name: ' + DeveloperName.inverse+'\nTrying with this one...\n\n').green);
		// 
		// 					callback(null, files[i].substring(0, files[i].indexOf('.')), DeveloperName);
		// 					found_profile = true;
		// 					break;
		// 				}
		// 			}
		// 		}
		// 
		// 	}
		// 
		// 	
		// }


		if (!profiles.length) {
			callback('no_profile');
		}
		else {
 			prompt.start();
			
			
			var msg = ['Multiple profiles detected, please choose one:\n'.green];
			
			for (var i=0; i < profiles.length; i++) {
				msg.push('['+(i+1)+'] '+profiles[i].name.white.bold + ' with id: '.grey +profiles[i].id.white.bold +' and Developer name: '.grey +profiles[i].developer_name.white.bold);
			};
			
			utils.message(msg.join('\n'));

			var property = {
				name: 'profile',
			  	description: 'Profile :',
			  	message: 'Please choose between 1 and '+profiles.length,
			  	pattern: new RegExp('[1-'+profiles.length+']'),
				required:true
			};
			prompt.get(property, function (err, result) {
				if (!err) {
					callback(null, profiles[result.profile-1].profile_file, profiles[result.profile-1].developer_name);
				}
				else {
					if (err.toString() != 'Error: canceled') {
						utils.message('Some weird error occured: \n\t'.bold+err,'error');
						process.exit();
					}
				}
			});

			
		}

		
		
		
		// console.log(profiles);

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
			utils.message('Project cleaned.');
		});
	},
	i5: function(tiapp, params) {
		execute(['build', '-p', 'ios', '-D', 'development', '--retina', '--tall', params && params.f ?'-f':'' ], function() {
			utils.message('The simulator should be started now...');
		});
	},
	i4: function(tiapp, params) {
		execute(['build', '-p', 'ios', '-D', 'development', '--retina', params && params.f ?'-f':''], function() {
			utils.message('The simulator should be started now...');
		});
	},
	i3: function(tiapp, params) {
		execute(['build', '-p', 'ios', '-D', 'development', params && params.f ?'-f':''], function() {
			utils.message('The simulator should be started now...');
		});
	},
	di: function(tiapp, params) {
		
		if (params && params.i) {
			utils.message('Trying to install on the iOS device...');
			var ipa_file = process.cwd() + '/build/iphone/build/'+ tiapp.name+'.ipa';
			
			fs.exists(ipa_file, function(exists) {
				if (exists) {
					
					utils.message('This will only install the latest built on your device without recompiling it.\n\tIf you made changes in the code since the last install you need to run ' + '\'sti di\''.white.bold +' instead.'.yellow,'warn');
					install({ipa:ipa_file, install_only:true}, function() {
						utils.message('Install finished');
						process.exit();
					});
				}
				else {
					utils.message('Cannot find the ipa file.\n\tRun \'sti di\' instead.','error');
					process.exit();
				}
			});
		}
		else {
			var options = ['build', '-p', 'ios', '-T', 'device', '-b'];

			// 
			// getIosEnv()


			getProfiles(tiapp.id, function(err, profile_id, developer_name) {
				if (!err && profile_id) {
					execute(options.concat(['-P', profile_id, '-V', developer_name]), function() {
						utils.message('Trying to install on device...');
						var app_file = process.cwd() + '/build/iphone/build/Debug-iphoneos/' + tiapp.name + '.app';
						var ipa_file = process.cwd() + '/build/iphone/build/'+ tiapp.name+'.ipa';

						fs.exists(app_file, function(exists) {
							if (exists) {
								install({app:app_file,ipa:ipa_file}, function() {
									utils.message('Finshed');
									process.exit();
								});
							}
							else {
								utils.message('Cannot find the app bundle.\n\tTry to clean the project and run \'sti di\' again.','error');
								process.exit();
							}
						});

					});
				} else {
				
				
				
					utils.message('It seems we could not found a valid profile for this app.\n\tBe sure that you have a valid profile for '+tiapp.id.inverse, 'error');
				}
			});
		}
		
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
						});

					} else {
						utils.message('Cannot restart app, run a build command (sti with i3, i4 or i5)', 'error');
					}
				});
			}
		});
	},
	
	da: function(tiapp, params) {
			if (params && params.i) {
				utils.message('Trying to install on the android device...');
				
				var apk_file = process.cwd() + '/build/iphone/build/android/bin/app.apk';

				fs.exists(apk_file, function(exists) {
					if (exists) {

						utils.message('This will only install the latest built on your device without recompiling it.\n\tIf you made changes in the code since the last install you need to run ' + '\'sti di\''.white.bold +' instead.'.yellow,'warn');
						install({ipa:ipa_file, install_only:true}, function() {
							utils.message('Install finished');
							process.exit();
						});
					}
					else {
						utils.message('Cannot find the ipa file.\n\tRun \'sti di\' instead.','error');
						process.exit();
					}				});	
				///Volumes/Data/android-sdk-mac_x86/platform-tools/adb -d install -r /Volumes/Work/clients/tobias_group_time/gitted/mobile/build/android/bin/app.apk
			}	
			else {
				utils.message('Trying to install on the android device...');
				var options = ['build', '-p', 'android', '-T', 'device']; // we shoudl use -b and install the app ourselves?
				execute(options, function() {
					utils.message('The aplication should be started on the device');
				});
				
			}	
	},
	getTiapp: getTiapp
};
