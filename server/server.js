const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

let {mongoose} = require('./db/mongoose');
let {User} = require('./db/models/user');
let {authenticate} = require('./middleware/authenticate');
let app = express();
app.use(bodyParser.json());

app.post('/createUser',(req,res) => {
	let body = _.pick(req.body, ['userName','email','password','mainUser']);
	let user = new User(body);


	user.save().then((user) => {
		return user.generateAuthToken();
	}).then((token) => {
		res.header('x-auth', token).send(user);
	}).catch((e) => {
		res.status(400).send(e);
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


app.get('/users/me',authenticate, (req, res) => {
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
const port = process.env.PORT || 3000;
app.listen(port,() => {
    console.log(`Server is up on port ${port}`);
});
