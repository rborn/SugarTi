#!/usr/bin/env node

require('fs').chmod(__dirname+'/../session.json','666',function(err, res) {
	// console.log(arguments);
});