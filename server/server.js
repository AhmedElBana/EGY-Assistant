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