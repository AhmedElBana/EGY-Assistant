require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');
const axios = require('axios');

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
app.post('/update/user/name',authenticate, (req, res) => {
	let newName = _.pick(req.body, ['newName']);
	//set new name
	let query   = { _id: req.user._id };
	let update  = { userName: newName.newName }; 
	let options = { new: true };
	User.findOneAndUpdate(query, update, options, (err, user) => { 
	  if( err ){
		res.status(400).send(err);
	  }else{
	  	res.send(user);
	  }
	});
});
app.post('/update/user/password',authenticate, (req, res) => {
	let newPassword = _.pick(req.body, ["newPassword"]);

	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(newPassword.newPassword, salt, (err, hash) => {
			//set new password
			let query   = { _id: req.user._id };
			let update  = { password: hash }; 
			let options = { new: true };
			User.findOneAndUpdate(query, update, options, (err, user) => { 
			  if( err ){
				res.status(400).send(err);
			  }else{
			  	res.send({"message": "Password Changed Successfully."});
			  }
			});
		});
	});
	
});
//------------ end update user data ---------------------


//------------ start sub-user --------------------
app.post('/create/subUser', authenticate, (req, res) => {
	let currentUser = req.user;
	if( currentUser.mainUser ){
		if( currentUser.subUserNum < 6 ){
			let body = _.pick(req.body, ['userName','email','password']);
			let subUserData = new User(body);
			subUserData.mainUser = false;
			subUserData.deviceId = currentUser.deviceId;
			subUserData.city = currentUser.city;

			subUserData.save().then((subUuser) => {
				//update number of sub users in main user
				let query   = { _id: currentUser._id };
				let update  = { subUserNum: currentUser.subUserNum + 1 }; 
				let options = { new: true };
				User.findOneAndUpdate(query, update, options, (err, mainUser) => { 
				  if( err ){
					res.status(400).send(err);
				  }else{
				  	//update number of sub users in Device data
				  	Device.findOne({
						deviceId: currentUser.deviceId
					}).then((result) => {
						let subUsersList = [...result.subUsers, subUuser._id];

						let devQuery   = { deviceId: currentUser.deviceId };
						let devUpdate  = { subUsers: subUsersList }; 
						let devOptions = { new: true };
						Device.findOneAndUpdate(devQuery, devUpdate, devOptions, (err, device) => { 
						  if( err ){
							res.status(400).send(err);
						  }else{
							res.send(subUuser);
						  }
						});
					});
				  }
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
		}else{
			res.status(400).send({"error": "Can't Create More Than 6 Sub Users"});
		}
	}else{
		res.status(400).send({"error": "Don't have permission to create sub user"});
	}
});
app.post('/remove/subUser', authenticate, (req, res) => {
	let currentUser = req.user;
	if( currentUser.mainUser ){
		let body = _.pick(req.body, ['email']);
		let query  = { 
						email: body.email,
						deviceId: currentUser.deviceId,
						mainUser: false
					 };
		User.findOneAndRemove(query).then((result) => {
			if(!result){
				res.status(400).send({"error": "Can't find sub user with this email"});
			}else{
				//update number of sub users in main user
				let query   = { _id: currentUser._id };
				let update  = { subUserNum: currentUser.subUserNum - 1 }; 
				let options = { new: true };
				User.findOneAndUpdate(query, update, options, (err, mainUser) => { 
				  if( err ){
					res.status(400).send(err);
				  }else{
				  	res.send(result);
				  }
				});
			}
		});
	}else{
		res.status(400).send({"error": "Don't have permission to remove sub user"});
	}
});
app.get('/users/getAllSubUsers', authenticate, (req,res) => {
	let currentUser = req.user;
	if( currentUser.mainUser ){
		let query  = { 
						deviceId: currentUser.deviceId,
						mainUser: false
					 };
		User.find(query).then((result) => {
			if(result.length == 0){
				res.status(400).send({"error": "Can't find any sub users."});
			}else{
				res.send(result);
			}
		});
	}else{
		res.status(400).send({"error": "Don't have permission to remove sub user"});
	}
});
//------------ end sub-user ----------------------
app.post('/createUser',(req,res) => {
	let body = _.pick(req.body, ['userName','email','city','password','deviceId']);
	let userData = new User(body);
	userData.mainUser = true;
	userData.subUserNum = 0;

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
		res.status(400).send({"error": "User name or password is not correct."});
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
	let body = _.pick(req.body, ['deviceId','mainUserId','components','writeAPIKey','readAPIKey']);
	let device = new Device(body);

	device.save().then(() => {
		res.status(200).send();
	}, (e) => {
		res.status(400).send(e);
	});
});
app.get('/device/getAllDevicesState', authenticate, (req,res) => {
	let currentUser = req.user;
	Device.findOne({
		deviceId: currentUser.deviceId
	}).then((device) => {
		//check if auto control is on or not
		if(device.components[4].componentState == 1){
			readThingspeak(device).then((thingspeakRespond) => {
				let componentsList = device.components;
				componentsList[0].componentState = thingspeakRespond.field2;
				componentsList[1].componentState = thingspeakRespond.field4;
				componentsList[2].componentState = thingspeakRespond.field3;
				componentsList[3].componentState = thingspeakRespond.field1;
				let query   = { deviceId: currentUser.deviceId };
				let update  = { components: componentsList }; 
				let options = { new: true };
				Device.findOneAndUpdate(query, update, options, (err, device) => { 
				  if( err ){
					res.status(400).send(err);
				  }else{
				  	//update components state on thingspeak
					updateThingspeak(device).then((thingspeakRespond) => {
						res.send(thingspeakRespond);
					}).catch((err) => {
						res.status(400).send(err);
					});
				  }
				});
			}).catch((err) => {
				res.status(400).send(err);
			});
		}else{
			let currentUser = req.user;
			Device.findOne({
				deviceId: currentUser.deviceId
			}).then((result) => {
				res.send(result.components);
			});
		}
	});
});

app.post('/hardware/changeComponentState', (req, res) => {
	let body = _.pick(req.body, ['deviceId','componentName','componentState']);

	Device.findOne({
		deviceId: body.deviceId
	}).then((result) => {
		let componentsList = result.components;
		for(let i=0;i < componentsList.length; i++){
			if(componentsList[i].componentName == body.componentName){
				componentsList[i].componentState = body.componentState;
			}
		}
		let query   = { deviceId: body.deviceId };
		let update  = { components: componentsList }; 
		let options = { new: true };
		Device.findOneAndUpdate(query, update, options, (err, device) => { 
		  if( err ){
			res.status(400).send(err);
		  }else{
		  	//update components state on thingspeak
			updateThingspeak(device).then((thingspeakRespond) => {
				res.send(thingspeakRespond);
			}).catch((err) => {
				res.status(400).send(err);
			});
		  }
		});
	}).catch((err) => {
		res.status(400).send(err);
	});
});
app.post('/device/changeComponentState', authenticate, (req, res) => {
	let body = _.pick(req.body, ['componentName','componentState']);
	let currentUser = req.user;
	Device.findOne({
		deviceId: currentUser.deviceId
	}).then((result) => {
		let componentsList = result.components;
		for(let i=0;i < componentsList.length; i++){
			if(componentsList[i].componentName == body.componentName){
				componentsList[i].componentState = body.componentState;
			}
		}
		let query   = { deviceId: currentUser.deviceId };
		let update  = { components: componentsList }; 
		let options = { new: true };
		Device.findOneAndUpdate(query, update, options, (err, device) => { 
		  if( err ){
			res.status(400).send(err);
		  }else{
		  	//update components state on thingspeak
			updateThingspeak(device).then((thingspeakRespond) => {
				res.send(thingspeakRespond);
			}).catch((err) => {
				res.status(400).send(err);
			});
		  }
		});
	});
});

const updateThingspeak = (device) => {
	return new Promise((resolve, reject) => {
        axios.get('https://api.thingspeak.com/update?api_key=' + device.writeAPIKey + '&field1=' + (device.components[0].componentState * 1000) + '&field2=' + (device.components[1].componentState * 1000) + '&field3=' + (device.components[2].componentState * 1000) + '&field4=' + (device.components[3].componentState * 1000) + '&field5=' + (device.components[4].componentState * 1000) + '')
          .then(response => {
		    resolve(device.components);
		  })
		  .catch(error => {
		    console.log('error happen while sending the get request');
		    reject(error);
		  });
    });
}

const readThingspeak = (device) => {
	return new Promise((resolve, reject) => {
        axios.get('https://api.thingspeak.com/channels/520515/feeds.json?results=1')
          .then(response => {
		    resolve(response.data.feeds[0]);
		  })
		  .catch(error => {
		    console.log('error happen while sending the get request');
		    reject(error);
		  });
    });
}
//------------- start test axios ------------------------
app.get('/test/axios', (req, res) => {
	getNasaData().then((axiosData) => {
		res.send(axiosData.explanation);
	}).catch((err) => {
		res.status(400).send(err);
	});
});
const getNasaData = () =>{
	
	return new Promise((resolve, reject) => {

        axios.get('https://api.thingspeak.com/update?api_key=I5V36XMFN6L1Q2H5&field1=0&field2=7777&field3=7777&field4=0')
          .then(response => {
		    resolve(response.data);
		  })
		  .catch(error => {
		    console.log('error happen while sending the get request');
		    reject(error);
		  });
    });
}
//------------ end test axios ---------------------------

const port = process.env.PORT;
app.listen(port,() => {
    console.log(`Server is up on port ${port}`);
});
