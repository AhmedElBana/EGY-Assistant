//const MongoClient = require('mongodb').MongoClient;
const {MongoClient,ObjectID} = require('mongodb');

//let obj = new ObjectID();

MongoClient.connect('mongodb://localhost:27017/EgyAssistant',(err, db) => {
	if(err){
		return console.log('Unable to connect to MongoDB server.');
	}
	console.log('Connected to MongoDB server.');

	// db.collection('users').find({mainUser: true}).toArray().then((docs) => {
	// 	console.log('Users : ');
	// 	console.log(JSON.stringify(docs,undefined,2));
	// },(err) => {
	// 	console.log('Unable to fetch users',err);
	// });

	db.collection('users').find().count().then((count) => {
		console.log(`Users number : ${count}`);
	},(err) => {
		console.log('Unable to fetch users',err);
	});

	//db.close();
});