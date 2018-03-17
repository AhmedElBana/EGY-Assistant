const {mongoose} = require('./../server/db/mongoose');
const {User} = require('./../server/db/models/user');

let id = '5aad4e5a0ea2060ce42cbc8b';

// User.find({
// 	_id: id
// }).then((result) => {
// 	console.log(result);
// });

// User.findOne({
// 	_id: id
// }).then((result) => {
// 	console.log(result);
// });

User.findById(id).then((result) => {
	if(!result){
		return console.log('Id not found');
	}
	console.log(result);
}).catch((err) => console.log('Id is not valid.'));