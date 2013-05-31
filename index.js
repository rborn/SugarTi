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













	

