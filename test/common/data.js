'use strict';

if (!process.env.AWS_REGION) {
	module.exports = false;
	console.log('To run all tests you must set ENV variables for AWS');
	return;
}

var extractor = require('../../lib/extractor');
var storage = require('entitizer.entities-storage');
var conceptsParser = require('concepts-parser');

exports.conceptsParser = conceptsParser;
exports.extractor = extractor;
exports.controlService = new storage.ControlService();
exports.createTables = storage.createTables;
exports.deleteTables = storage.deleteTables;
