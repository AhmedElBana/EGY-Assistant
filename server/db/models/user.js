const mongoose = require('mongoose');

let User = mongoose.model('User',{
	userName: {
		type: String,
		required: true,
		minlenght: 1,
		trim: true
	},
	email: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	mainUser: {
		type: Boolean,
		required: true,
		default: false
	}
});

module.exports = {User}