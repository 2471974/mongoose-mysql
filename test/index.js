const config = require('./config')
var mongoose = require('../index');
var Stringify = mongoose.Schema.Formatter.Stringify

mongoose.connect(config.mysql, { useMongoClient: true });

var CatSchema = new mongoose.Schema({
	f1: {type: String},
	f2: {
		f2c1: String
	},
	f3: [String],
	f4: [{
		f4c1: String
	}],
	f5: Number,
	f6: Date,
	f7: {type: [{type: String}], formatter: new Stringify()},
	f8: {
		id: false,
		f8c1: String
	}
}, {collection: 'cat'})

var Cat = mongoose.model('Cat', CatSchema);

var kitty = new Cat({ f1: 'Zildjian' });

console.log(kitty.schema.fields)
console.log(kitty.ddl(true).join('\n'))

console.log(kitty)

kitty.save(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('meow');
  }
});

console.log('Bye Bye!');
