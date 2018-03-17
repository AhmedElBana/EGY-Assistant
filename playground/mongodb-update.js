//const MongoClient = require('mongodb').MongoClient;
const {MongoClient,ObjectID} = require('mongodb');

//let obj = new ObjectID();

MongoClient.connect('mongodb://localhost:27017/EgyAssistant',(err, db) => {
	if(err){
		return console.log('Unable to connect to MongoDB server.');
	}
	console.log('Connected to MongoDB server.');

	db.collection('users').findOneAndUpdate(
	{mainUser: false},
	{
		$set: {
			mainUser: true
		}
	},
	{
		returnOriginal: false
	}
	).then((result) => {
		console.log(result);
	});

	//db.close();
});