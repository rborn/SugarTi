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



function get_tiapp(callback) {
	fs.readFile(process.cwd() + '/tiapp.xml', 'utf-8', function (err, xml) {
		if (err !== null) {
			utils.message("\nIt seems that tiapp.xml it's not correct.\nPlease review it for possible XML errors.\n", 'error');
			return;
		}

		parser.parseString(xml, function (err, tiapp) {
			if (err !== null) {
				utils.message("\nIt seems that tiapp.xml it's not correct.\nPlease review it for possible XML errors.\n", 'error');
				return;
			}
			!!callback && callback(tiapp['ti:app']);
		});
	});
}






fs.exists(process.cwd()+'/tiapp.xml', function(exists){
	if (exists) {
		
		var cmd = argv._.length < 1 ? 'help' : argv._[0];

		if (!!commands[cmd]) {
			cmd != 'help' && utils.message('Running Titanium...');
			get_tiapp(commands[cmd]);
		} else {
			commands.help();
		};
	}
	else {
		utils.message('\nIt looks like you are not in the root of a Titanium project.\n','error');
	}
});













	

