const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {User} = require('./../server/db/models/user');

let id = '5ab19f885ba1e61de4a5fdbf';


/* remove all */
// User.remove({}).then((result) => {
// 	console.log(result);
// });

/* remove one */
//User.findOneAndRemove({}).then();
User.findByIdAndRemove(id).then((result) => {
	console.log(result);
});
