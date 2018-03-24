const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

let {mongoose} = require('./db/mongoose');
let {User} = require('./db/models/user');

let app = express();
app.use(bodyParser.json());

app.post('/createUser',(req,res) => {
	console.log(req.body);
	let newUser = new User(req.body);
	newUser.save().then((doc) => {
		res.send(doc);
	},(err) => {
		res.status(400).send(err);
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

const port = process.env.PORT || 3000;
app.listen(port,() => {
    console.log(`Server is up on port ${port}`);
});




// let newUser = new User({
// 	userName: "ahmed_elbanna",
// 	email: "ahmedelpna@gmail.com",
// 	password: "123",
// 	mainUser: true
// });

// newUser.save().then((doc) => {
// 	console.log('saved user : ' + doc);
// },(err) => {
// 	console.log('Unable to save newUser.')
// });