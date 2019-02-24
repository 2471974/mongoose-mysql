const config = require('./config')
var mongoose = require('../index');
var co = require('co');
var Stringify = mongoose.Schema.Formatter.Stringify
var ObjectId = mongoose.Schema.Types.ObjectId

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
	f6: {type: Date, default: Date.now},
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
	}],
	f12 : {type: ObjectId, ref: 'Cat'}
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
	f5: Math.random() * 100,
	// f6: new Date(),
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
	}],
	f12: Math.random() * 1000 + 1
});
// console.log(JSON.stringify(Cat.schema().fields))
// console.log(Cat.ddl(false).join('\n'))

// kitty.save(function (err, doc) {console.log(err, doc)});

let condition = {
	"f5": {"$in": ["1", "2", "3", "5"]},
	"f1": "1",
	"f10.f10c1": {"$exists": false},
	"$or": [{
				"f6": {"$gte": new Date(), "$lte": new Date()}
		}, {
			"$and": [{
					"f11.$.f11c1": {"$exists": true}
				}, {
					"f2.f2c1": {"$ne": "1"}
				}
			]
	}]
}
// Cat.query().select('f1 f5 f10.f10c1').where({f1: 'f1-test'}).sort({f5: -1}).skip(0).limit(2).count(function (err, result) {
// 	console.log(err, result)
// })
// Cat.remove({'_id': {'$lte': 3}}, (error, result) => {
// 	console.log(error, result)
// })
// Cat.update({_id: 7}, {'$inc': {f5: 1}}, {new: true, select: {f5: 1}}, (error, result) => {
// 	console.log(error, result)
// })
// Cat.aggregate([{
// 	'$project': {f1: 1, f6: {'$month': '$f6'}, fg: '$lkp.f1'},
// 	'$lookup': {from: 'cat', localField: 'f5', foreignField: '_id', as:  'lkp'}
// }], (error, result) => {console.log(error, result)})
// Cat.aggregate([{
// 	'$group': {
// 		_id: {f1: 1, f5: 1},
// 		ct: {$sum: {$add: ['$f5', 10]}},
// 		f1: {$first: '$f1'}
// 	}
// }], (error, result) => {console.log(error, result)})
// Cat.query().select('f1 f5 f10.f10c1 f12').populate({path: 'f12', select: 'f1'})
// 	.where({_id: 6}).exec(function (err, result) {console.log(err, result)})
co(function *(){
	// let result = yield Cat.query().where({_id: 6})
	// console.log(result)
	// const cursor = Cat.find({_id: {'$in': [6, 9, 10]}}).limit(5).cursor();
	// for (let doc = yield cursor.next(); doc != null; doc = yield cursor.next()) {
	// 		console.log(doc._id)
	// }
	// let result = yield Cat.query({debug: true}).where({f3: {'$all': ['f3-11', 'f3-9']}})
	// console.log(result.length)
})
// Cat.findOneAndUpdate({f1: 'f1-test'}, {$set: {f5: 123}}, function () {console.log(arguments)})
// Cat.findOneAndUpdate({f1: 'f1-test'}, {$set: {'f10.f10c1': 'xxxx'}}, function () {console.log(arguments)})
co(function *(){
	// let cc = yield Cat.findById(2)
	// cc.f10.f10c1 = 'ffffsss'
	// cc.save()
	// yield Cat.rebuildArray([1], {'$push': {f3: 'xxxxxx'}})
	// yield Cat.rebuildArray([1], {'$push': {f3: {'$each': ['xx', 'saf', '25253']}}})
	// yield Cat.rebuildArray([1], {'$push': {f11: {f11c1: 'f11c1-String', f11d: { f11d1: 'f11d1-sss'}}}})
	// yield Cat.rebuildArray([1, 2], {'$pull': {f3: 'f3-2'}})
	// yield Cat.rebuildArray([1, 2], {'$pull': {f3: {'$in': ['saf', '25253']}}})
	// yield Cat.rebuildArray([1], {'$pull': {f11: {f11c1: 'f11c1-String'}}})
	let result = yield Cat.findById(7)
	result.f3 = ['ss', '333']
	result.f7 = ['777', 'xxx']
	result = yield Cat.findByIdAndUpdate(7, result)
	console.log(result.lean())
})
console.log('Bye Bye!');
