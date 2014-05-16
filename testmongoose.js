var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/test'); 

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  // yay!
});


// We define the Schema

var UserSchema = mongoose.Schema({
    username: String,
    mail: String,
    password: String
})

// We define the Model from the Schema
var User = mongoose.model('user', UserSchema)


// Define an user 
var user_test = new User({ username: 'Prova', mail: 'prova@prova.com', password: 'test' })
console.log('user_test')
console.log(user_test)
user_test.save()


// Find an user
user_found = User.find({ username: 'Prova'}, function callback(err, users)
    {
        if (err) return console.error(err);
        return console.log(users)
    });

console.log('user_found')
//console.log(user_found) 
