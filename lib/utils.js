/*
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */




function rpad (t, c, ch) {
	if (!ch) ch = ' ';
	var x = c - t.length;
	if (x <= 0) return t;
	var s = t;
	for (var y=0;y<x;y++)
	{
		s+=ch;
	}
	return s;
}

function trim (str) {
	return str.replace(/^\s+|\s+$/g,"");
}

function logWatcher (error, output) {
	if (error) {
		console.log(output.red);
		process.exit();
	}

	var lines = output.split('\n'), line;
	for (var i = 0, l = lines.length; i < l; i++) {
		line = lines[i].trim();

		if (line.indexOf('ERROR') > 0) {
			currentColor = 'red';
			line = '[ERROR]'.replace + line.replace('[ERROR]','');
		}
		else if (line.indexOf('LOG') > 0) {
			currentColor = 'yellow';
			line = '[LOG]'.yellow + line.replace('[LOG]','');
		}
		else if (line.indexOf('WARN') > 0) {
			currentColor = 'yellow';
			line = '[WARN]'.yellow + line.replace('[WARN]','');
		}
		else if (line.indexOf('DEBUG') > 0) {
			currentColor = 'grey';
			line = '[DEBUG]'.magenta + line.replace('[DEBUG]','');
		}
		else if (line.indexOf('INFO') > 0) {
			currentColor = 'white';
			line = '[INFO]'.green + line.replace('[INFO]','');
			
		}
		else if (line.indexOf('TRACE') > 0) {
			currentColor = 'grey';
			line = '[TRACE]'.grey + line.replace('[TRACE]','');
		}
		else {
			currentColor = 'white';
		}
		console.log(line[currentColor]);
	}	
};



var message = function(msg, type) {
	
	var t = {
		error:'red',
		success:'green',
		warn:'yellow',
		normal:'cyan'
	};
	
	console.log('\n----------------------------------------------------------------------'[t[type||'normal']]);
	console.log('\t'+msg[t[type||'normal']]);
	console.log('----------------------------------------------------------------------\n'[t[type||'normal']]);
};


exports.trim = trim;
exports.rpad = rpad;
exports.logWatcher = logWatcher;
exports.message = message;