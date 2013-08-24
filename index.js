var optimist = require('optimist'),
	utils = require('./lib/utils'),
	colors = require('colors'),
	commands = require('./commands'),
	fs = require('fs'),
	argv = require('optimist').argv,
	parser = new (require('xml2js')).Parser({
		trim: true,
		normalize: true,
		explicitArray: false
	});



fs.exists(process.cwd()+'/tiapp.xml', function(exists){
	if (exists) {

		var cmd = argv._.length < 1 ? 'help' : argv._[0];

		(argv.c) && (cmd == 'i5' || cmd == 'i4' || cmd == 'i3') && commands.getTiapp(commands['clean'],argv);

		(cmd == 'c') && (cmd = 'clean');

		if (!!commands[cmd]) {
			cmd != 'help' && cmd != 'ri' && !(cmd == 'di' && argv.i) && utils.message('Running Titanium...');
			commands.getTiapp(commands[cmd],argv);
		} else {
			commands.help();
		};
	}
	else {
		utils.message('\nIt looks like you are not in the root of a Titanium project.\n','error');
	}
});




// Dans-MacBook-Pro-2:app Dan$ /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Applications/iPhone\ Simulator.app/Contents/MacOS/iPhone\ Simulator  -SimulateDevice iPhone
// ^C
// Dans-MacBook-Pro-2:app Dan$ /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Applications/iPhone\ Simulator.app/Contents/MacOS/iPhone\ Simulator  -SimulateDevice "iPhone (Retina 4-inch)"
// ^C
// Dans-MacBook-Pro-2:app Dan$ /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/Applications/iPhone\ Simulator.app/Contents/MacOS/iPhone\ Simulator  -SimulateDevice "iPhone (Retina 3.5-inch)"








	

