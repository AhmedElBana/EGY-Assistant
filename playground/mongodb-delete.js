//const MongoClient = require('mongodb').MongoClient;
const {MongoClient,ObjectID} = require('mongodb');

//let obj = new ObjectID();

MongoClient.connect('mongodb://localhost:27017/EgyAssistant',(err, db) => {
	if(err){
		return console.log('Unable to connect to MongoDB server.');
	}
	console.log('Connected to MongoDB server.');

	//deleteMany
	// db.collection('users').deleteMany({mainUser: true}).then((result) => {
	// 	console.log(result);
	// });
	//deleteOne
	// db.collection('users').deleteOne({mainUser: true}).then((result) => {
	// 	console.log(result);
	// });
	//findOneAndDelete
	db.collection('users').findOneAndDelete({mainUser: true}).then((result) => {
		console.log(result);
	});


	//db.close();
});