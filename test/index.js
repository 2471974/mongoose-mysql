const config = require('./config')
var mongoose = require('../index');

mongoose.connect(config.mongo, { useMongoClient: true });

var Cat = mongoose.model('Cat', { name: String });

var kitty = new Cat({ name: 'Zildjian' });

console.log(kitty.ddl(true))

kitty.save(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('meow');
  }
});

console.log('Bye Bye!');
