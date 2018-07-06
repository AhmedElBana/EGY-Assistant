const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

let DeviceSchema = new mongoose.Schema({
	deviceId: {
		unique: true,
		type: String,
		required: true,
		trim: true,
		minlenght: 1		
	},
	writeAPIKey: {
		type: String,
		required: true
	},
	readAPIKey: {
		type: String,
		required: true
	},
	mainUserId: {
		type: String,
		minlenght: 2
	},
	subUsers: [{
		userId: {
			type: String,
			required: true
		}
	}],
	components: [{
		componentName: {
			type: String,
			required: true
		},
		componentState: {
			type: Number,
			required: true
		}
	}]
});



let Device = mongoose.model('Device', DeviceSchema);

module.exports = {Device}