const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/EgyAssistant');

module.exports = {mongoose}