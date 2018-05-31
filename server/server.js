require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

let {mongoose} = require('./db/mongoose');
let {User} = require('./db/models/user');
let {authenticate} = require('./middleware/authenticate');
let {Device} = require('./db/models/device');
let app = express();
app.use(bodyParser.json());

//------------ start update user data -------------------
app.post('/update/user/image',authenticate, (req, res) => {
	let userImage = _.pick(req.body, ['userImage']);
	//set image
	let query   = { _id: req.user._id }; 
	let update  = { image: userImage.userImage }; 
	let options = { new: true };
	User.findOneAndUpdate(query, update, options, (err, user) => { 
	  res.send(user);
	});
});
app.post('/update/user/email',authenticate, (req, res) => {
	let newEmail = _.pick(req.body, ['newEmail']);
	//set new email
	let query   = { _id: req.user._id }; 
	let update  = { email: newEmail.newEmail }; 
	let options = { new: true };
	User.findOneAndUpdate(query, update, options, (err, user) => { 
	  if( err ){
	  	if (err.code === 11000 && err.codeName === "DuplicateKey") {
		    res.status(400).send({"error": "Email is used before"});
		} else {
		    res.status(400).send(err);
		}
	  }else{
	  	res.send(user);
	  }
	});
});
//------------ end update user data ---------------------

app.post('/createUser',(req,res) => {
	let body = _.pick(req.body, ['userName','email','city','password','deviceId']);
	let userData = new User(body);
	userData.mainUser = true;

	//check deviceId 
	Device.findOne({
		deviceId: userData.deviceId
	}).then((result) => {

		if(!result){
			res.status(400).send({"error": "Device ID Not found"});
		}else if(result.mainUserId != undefined){
			res.status(400).send({"error": "Device is used before"});
		}else{
			userData.save().then((user) => {
				//set mainUserId to the device
				Device.update({deviceId: userData.deviceId}, { $set:{mainUserId: user._id}}).then((err, device) => {
					user.generateAuthToken().then((token) => {
						res.header('x-auth', token).send(user);
					});
				});
			}).catch((e) => {
				if (e.code === 11000) {
				    if(e.errmsg.search("email_1 dup key") != -1){
				    	res.status(400).send({"error": "Email is used before"});
				    }
				} else {
				    res.status(400).send(e);
				}
			});
		}
	});

	
});

app.get('/getAllUsers',(req,res) => {
	User.find().then((users) => {
		res.send({
			usersNumber: users.length,
			usersArr: users
		});
	},(err) => {
		res.status(400).send(err);
	});
});

app.delete('/userDelete/:id',(req,res) => {
	let id = req.params.id;
	if( !ObjectID.isValid(id) ){
		return res.status(404).send();
	}
	User.findByIdAndRemove(id).then((user) => {
		if(!user){
			return res.status(400).send();
		}
		res.send({user});
	}).catch((err) => {
		res.status(400).send();
	});
});

app.patch('/updateUser/:id',(req,res) => {
	let id = req.params.id;
	let body = _.pick(req.body, ['userName','email','password','mainUser']);
	let changesObject = {};
	if( !ObjectID.isValid(id) ){
		return res.status(404).send();
	}

	if( body.userName ){
		changesObject.userName = body.userName;
	}
	if( body.email ){
		changesObject.email = body.email;
	}
	if( body.password ){
		changesObject.password = body.password;
	}
	if(_.isBoolean(body.mainUser) && body.mainUser){
		changesObject.mainUser = body.mainUser; 
	}

	User.findByIdAndUpdate(id, {$set: changesObject}, {new: true}).then((user) => {
		if(!user){
			return res.status(404).send();
		}

		res.send({user});
	},(err) => {
		res.status(400).send();
	});
});

app.get('/users/data',authenticate, (req, res) => {
	res.send(req.user);
});

app.post('/users/login',(req, res) => {
	let body = _.pick(req.body, ['email','password']);
	
	User.findByCredentials(body.email, body.password).then((user) => {
		return user.generateAuthToken().then((token) => {
			res.header('x-auth', token).send(user);
		});
	}).catch((e) => {
		res.status(400).send();
	});
});

app.delete('/users/me/token',authenticate, (req, res) => {
	req.user.removeToken(req.token).then(() => {
		res.status(200).send();
	}, () => {
		res.status(400).send();
	});
});


//----------------------- device
app.post('/createDevice',(req,res) => {
	let body = _.pick(req.body, ['deviceId','mainUserId']);
	let device = new Device(body);

	device.save().then(() => {
		res.status(200).send();
	}, (e) => {
		res.status(400).send(e);
	});
});

const port = process.env.PORT;
app.listen(port,() => {
    console.log(`Server is up on port ${port}`);
});
