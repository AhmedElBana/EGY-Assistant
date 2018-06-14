const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

let UserSchema = new mongoose.Schema({
	userName: {
		type: String,
		required: true,
		minlenght: 2,
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
	city: {
		type: String,
		minlenght: 1,
		required: true
	},
	image: {
		type: String
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
	},
	subUserNum: {
		type: Number
	},
	deviceId: {
		type: String,
		minlenght: 2,
		required: true
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

	return _.pick(userObject, ['_id','userName','email','image','mainUser','deviceId'])
}

UserSchema.methods.generateAuthToken = function(){
	let user = this;
	let access = 'auth';
	let token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET, { expiresIn: 60 * 60 * 24 * 30 * 12 }).toString();
	user.tokens.push({access,token});

	return user.save().then(() => {
		return token
	});
}

UserSchema.methods.removeToken = function(token){
	let user = this;
	return user.update({
		$pull: {
			tokens: {token}
		}
	});
}
UserSchema.statics.findByToken = function(token){
	let User = this;
	let decoded;
	try {
	  decoded = jwt.verify(token, process.env.JWT_SECRET);
	} catch(err) {
	    console.log('----------------------------------');
		console.log(err.name);
		console.log(err.message);
		console.log(err.expiredAt);
		console.log('----------------------------------');
		if(err.message == 'jwt expired'){
			User.findOne({
						'tokens': {$elemMatch: {'token':token, 'access':'auth'}}
			}).then((result) => {
				if(result){
					console.log(result);
					console.log('----------------------------------');
					result.update({
						$pull: {
							tokens: {token}
						}
					}).then((expireToken) => {
						console.log(expireToken);
					}).catch((e) => {
						console.log(e);
					});
				}else{
					console.log('token not found');
				}
			}).catch((e) => {
				console.log(e);
			});
			return Promise.reject();
		}else{
			return Promise.reject();
		}
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