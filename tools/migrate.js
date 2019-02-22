var mongoose = require('mongoose');
var mysql = require('../index')
var co = require('co');
var fs = require('fs');
var path = require('path');
mysql.withTransaction = false
const config = {
    mongo: 'mongodb://localhost/database',
    mysql: {
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'mongoose'
    },
    migrate: {
        ddl: true,
        data: true,
        relation: true,
        special: true
    }
}
mongoose.connect(config.mongo, { useMongoClient: true });
mysql.connect(config.mysql, { useMongoClient: true });
const MigrateUtil = {
    model (filename, filepath) {
        var MySQLModel = require(filepath)
        var MongooseModel = require(filepath.replace('mysql-model-dir', 'mongoose-model-dir'))
        var fields = MySQLModel.$schema().fields
        var refs = {}
        for (let field in fields) {
            if (fields[field].type === mysql.Schema.Types.ObjectId) {
                Object.assign(refs, {[field]: fields[field].ref})
            }
        }
        if (config.migrate.special) switch (MongooseModel.modelName) {
            case 'Menu':
                Object.assign(refs, {parentId: 'Menu'})
                break
        }
        return {
            name: MongooseModel.modelName,
            collection: MongooseModel.collection.name,
            mongo: MongooseModel,
            mysql: MySQLModel,
            refs, filename, filepath
        }
    },
    models () {
        var pathModel = path.resolve('/path/to/mysql-model-dir')
        var models = []
        fs.readdirSync(pathModel).forEach(filename => {
            var pathFile = path.join(pathModel, filename)
            if (pathFile.indexOf('.js') === -1) {
                fs.readdirSync(pathFile).forEach(item => models.push(this.model(item, path.join(pathFile, item))))
            } else {
                models.push(this.model(filename, pathFile))
            }
        })
        var map = {}
        models.forEach(item => Object.assign(map, {[item.name]: item}))
        return map
    },

}
console.log('migrate start...')
var PKModel = mysql.model('PKSchema', new mysql.Schema({
    model: String,
    collection: String,
    objectid: String,
    mysqlid: Number,
    field: String,
    refmodel: String,
    refid: String
}))
let promises = Promise.resolve(), models = MigrateUtil.models()
config.migrate.ddl && (promises = promises.then(() => {return mysql.connection.query(PKModel.ddl(false).join(''))}))
for (let index in models) {
    let model = models[index]
    if (config.migrate.ddl || config.migrate.data) promises = promises.then(() => {
        console.log('migrate', model.name, model.filepath)
        return Promise.resolve()
    })
    if (config.migrate.ddl) {
        promises = promises.then(() => {return model.mysql.ddl(false).map(item => mysql.connection.query(item))})
        if (config.migrate.special) {
            if (model.name == 'User') {
                promises = promises.then(() => {
                    return mysql.connection.query('ALTER TABLE `users` MODIFY COLUMN `textfield` text NULL AFTER `otherfield`;')
                })
            }
        }
    }
    config.migrate.data && (promises = promises.then(() => {return co(function* () {
        const cursor = model.mongo.find({}).cursor()
        for (let doc = yield cursor.next(); doc != null; doc = yield cursor.next()) {
            let docId = doc._doc._id.toString()
            doc = Object.assign(doc._doc, {_id: null})
            console.log("process ", model.name, docId)
            let refs = []
            refs.push({ // 当前记录的映射关系
                model: model.name,
                collection: model.collection,
                objectid: docId,
                mysqlid: null
            })
            for (let field in model.refs) { // 当前记录外键字段的映射关系
                let refid = doc[field] ? (doc[field]._id ? doc[field]._id.toString() : doc[field].toString()) : null
                refid && refs.push({
                    model: model.name,
                    collection: model.collection,
                    objectid: docId,
                    mysqlid: null,
                    field: field,
                    refmodel: model.refs[field],
                    refid
                })
                Object.assign(doc, {[field]: null})
            }
            let result = yield model.mysql.insert(doc)
            console.log("record ", model.name, docId, ' as ', result._id)
            yield Promise.all(refs.map(item => { // 保存映射关系
                item.mysqlid = result._id
                return PKModel.insert(item)
            }))
        }
    })}))
}
promises.then(() => { // 更新关联记录
    if (!config.migrate.relation) return Promise.resolve()
    console.log('update relation...')
    return co(function* () {
        let data = yield PKModel.query().exec()
        let map = {}
        data.forEach(item => {
            if (item.field || item.refid) return
            !map[item.model] && Object.assign(map, {[item.model]: {}})
            Object.assign(map[item.model], {[item.objectid]: item})
        })
        yield Promise.all(data.map(item => {
            if (!item.field || !item.refid || !item.refmodel) return
            let value = (map[item.refmodel] && map[item.refmodel][item.refid]) ? map[item.refmodel][item.refid].mysqlid : null
            console.log('update', item.model, {_id: item.mysqlid}, {[item.field]: value})
            return models[item.model].mysql.update({_id: item.mysqlid}, {[item.field]: value})
        }))
        if (config.migrate.special) {
            console.log('update Role menus&branches...')
            let model = models['Role']
            let roles = yield model.mysql.query().exec()
            yield Promise.all(roles.map(item => {
                let menus = item.menus.map(id => {
                    return map['Menu'][id] ? map['Menu'][id].mysqlid : id
                })
                let branches = item.branches.map(id => {
                    return map['Branch'][id] ? map['Branch'][id].mysqlid : id
                })
                console.log('update', 'Role', {_id: item._id}, {menus: JSON.stringify(menus), branches: JSON.stringify(branches)})
                return model.mysql.update({_id: item._id}, {menus, branches})
            }))
        }
    })
}).then(() => {
    console.log('migrate done!')
    mongoose.disconnect()
    mysql.disconnect()
}).catch((err) => {
    console.log(err)
    mongoose.disconnect()
    mysql.disconnect()
})
