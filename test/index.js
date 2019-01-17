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
	},
	f9: {
		f9d: {
			f9d1: String
		}
	},
	f10: {
		f10c1: String,
		f10d: {
			f10d1: String
		}
	},
	f11: [{
		f11c1: String,
		f11d: {
			f11d1: String
		}
	}]
}, {collection: 'cat'})

var Cat = mongoose.model('Cat', CatSchema);

var kitty = new Cat({
	f1: 'f1-test',
	f2: {
		f2c1: 'f2-c1'
	},
	f3: ['f3-1', 'f3-2', 'f3-3'],
	f4: [{
		f4c1: 'f4c1-1'
	}, {
		f4c1: 'f4c1-2'
	}],
	f5: 1224,
	f6: new Date(),
	f7: ['f7-1', 'f7-2'],
	f8: {
		f8c1: 'f8c1'
	},
	f9: {
		f9d: {
			f9d1: 'f9d1-String'
		}
	},
	f10: {
		f10c1: 'f10c1-String',
		f10d: {
			f10d1: 'f10d1-String'
		}
	},
	f11: [{
		f11c1: 'f11c1-String',
		f11d: {
			f11d1: 'f11d1-sss'
		}
	}]
});

// console.log(kitty.schema().fields)
// console.log(kitty.ddl(true).join('\n'))
// console.log(kitty)

kitty.save(function (err, doc) {
  if (err) {
    console.log(err);
  } else {
    console.log(doc);
  }
});

console.log('Bye Bye!');
