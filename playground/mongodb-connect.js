//const MongoClient = require('mongodb').MongoClient;
const {MongoClient,ObjectID} = require('mongodb');

//let obj = new ObjectID();

MongoClient.connect('mongodb://localhost:27017/EgyAssistant',(err, db) => {
	if(err){
		return console.log('Unable to connect to MongoDB server.');
	}
	console.log('Connected to MongoDB server.');

	// db.collection('users').insertOne({
	// 	userName: 'ahmed_elbana',
	// 	email: 'ahmedelpna@gmail.com',
	// 	password: '123'
	// },(err,result) => {
	// 	if(err){
	// 		return console.log('Unable to insert user', err);
	// 	}
	// 	//console.log(JSON.stringify(result.ops,undefined,2));
	// 	console.log(result.ops[0]._id.getTimestamp());
	// });

	db.close();
});