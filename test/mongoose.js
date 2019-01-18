const config = require('./config')

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

mongoose.connect(config.mongo, { useMongoClient: true });
mongoose.Promise = global.Promise;

var Cat = mongoose.model('Cat', { name: String });

var kitty = new Cat({ name: 'Zildjian' });

kitty.save(function (err, doc) {
  if (err) {
    console.log(err);
  } else {
    console.log(doc);
  }
  console.log(doc._id, doc._id.toHexString(), doc._id.toString())
  Cat.findById(doc._id).then(r => console.log(r))
  Cat.findById(ObjectId('xxxxxxxxxxxx')).then(r => console.log('>>>>>', r)).catch(e => console.log(e))
});
