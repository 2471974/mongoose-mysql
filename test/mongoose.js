const config = require('./config')

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

mongoose.connect(config.mongo, { useMongoClient: true });
mongoose.Promise = global.Promise;


var schema = new mongoose.Schema({ name: String, txt: { enum: ["Y", "N"], type: String } })
schema.pre('save', function (next) {
  console.log('ccccccccccccccccccccccc')
  this.txt = 'cccccxxx'
  next()
})
var Cat = mongoose.model('Cat', schema);

var kitty = new Cat({ name: 'Zildjian', txt: 'Y' });

kitty.save(function (err, doc) {
  if (err) {
    console.log(err);
  } else {
    console.log(doc);
  }
  console.log(doc._id, doc._id.toHexString(), doc._id.toString())
  // Cat.findById(doc._id).then(r => console.log(r))
  // Cat.findById({_id: '5c4144edbb7896896e214174'}).then(r => console.log('>>>>>', r)).catch(e => console.log(e))
  // Cat.findById({_id: 'xxxxxxxxxxxx'}).then(r => console.log('>>>>>', r)).catch(e => console.log(e))
});
