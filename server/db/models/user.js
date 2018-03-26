const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

let UserSchema = new mongoose.Schema({
	userName: {
		type: String,
		required: true,
		minlenght: 1,
		trim: true
	},
	email: {
		type: String,
		required: true,
		trim: true,
		minlenght: 1,
		unique: true,
		validate: {
          validator: (value) => {
            return validator.isEmail(value);
          },
          message: '{VALUE} is not a valid email!'
        }
	},
	password: {
		type: String,
		minlenght: 6,
		required: true
	},
	mainUser: {
		type: Boolean,
		required: true,
		default: false
	},tokens: [{
		access: {
			type: String,
			required: true
		},
		token: {
			type: String,
			required: true
		}
	}]
});

UserSchema.methods.toJSON = function(){
	let user = this;
	let userObject = user.toObject();

	return _.pick(userObject, ['_id','userName','email'])
}

UserSchema.methods.generateAuthToken = function(){
	let user = this;
	let access = 'auth';
	let token = jwt.sign({_id: user._id.toHexString(), access},'123abc').toString();
	user.tokens.push({access,token});

	return user.save().then(() => {
		return token
	});
}

UserSchema.statics.findByToken = function(token){
	let User = this;
	let decoded;
	try{
		decoded = jwt.verify(token, '123abc');
	} catch(e){
		return Promise.reject();
	}
	return User.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
}

UserSchema.statics.findByCredentials = function(email, password){
	User = this;
	return User.findOne({email}).then((user) => {
		if(!user){
			return Promise.reject();
		}

		return new Promise((resolve, reject) => {
			bcrypt.compare(password, user.password, (err, res) => {
				if(res){
					resolve(user);
				}else{
					reject();
				}
			});
		});
	});
}

UserSchema.pre('save', function(next){
	let user = this;
	if(user.isModified('password')){
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				user.password = hash;
				next();
			});
		});
	}else{
		next();
	}
});
let User = mongoose.model('User', UserSchema);

module.exports = {User}