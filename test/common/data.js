'use strict';

if (!process.env.AWS_REGION) {
	module.exports = false;
	console.log('To run all tests you must set ENV variables for AWS');
	return;
}

var Extractor = require('../../lib/extractor');
var storage = require('entitizer.entities-storage');

exports.extractor = new Extractor();
exports.controlService = new storage.ControlService();
exports.createTables = storage.createTables;
exports.deleteTables = storage.deleteTables;
