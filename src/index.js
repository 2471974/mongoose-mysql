import Schema from './schema'
import Model from './model'
import Connection from './connection'
import Error from './error'

class Mongoose {

  constructor () {
    this.Schema = Schema
    this.Promise = Promise
    this.$collections = {} // 集合与模型名称的映射
    this.$models = {} // 模型名称与模型类的映射
    this.withTransaction = true // 启用事务
    this.Error = Error
    this.connection = new Connection()
    this.Types = Schema.Types
    this.debug = false
  }

  connect (config) {
    this.connection.open(config)
  }

  disconnect () {
    this.connection.close()
  }

  modelByName (name) {
    return this.$models[name]
  }

  modelByCollection (name) {
    return this.$models[this.$collections[name]]
  }

  model (name, schema) {
    let instance = this
    if (!(schema instanceof Schema)) schema = new Schema(schema)
    schema.options.collection || Object.assign(schema.options, {collection: name.toLowerCase() + 's'})
    let collection = schema.options.collection
    let model = class extends Model {
      $name () {return name}
      $schema () {return schema}
      $collection () {return collection}
      $model () {return instance.$models[name]}
      static $name () {return name}
      static $schema () {return schema}
      static $collection () {return collection}
      static $model () {return instance.$models[name]}
    }
    Object.assign(model, schema.statics)
    Object.assign(model.prototype, schema.methods)
    this.$collections[collection] = name
    this.$models[name] = model
    return model
  }

}

export default new Mongoose()
