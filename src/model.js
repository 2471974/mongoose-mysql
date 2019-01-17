import Schema from "./schema";
import SchemaUtil from './util/schema'
import mongoose from './index'

class Model {

  constructor (name, schema) {
    this._name = name
    this._schema = schema instanceof Schema ? schema : new Schema(schema, {
      collection: name
    })
  }

  name () {
    return this._name
  }

  schema () {
    return this._schema
  }

  table () {
    return this.schema().options.collection
  }

  column () {
    return this.schema().fields
  }

  findById (id, callback) {
    console.log(arguments)
    callback(null, id)
  }

  save (callback) {
    let queries = SchemaUtil.insert(this.column(), this, this.table())
    let query = queries.shift()
    mongoose.connection.beginTransaction()
    mongoose.connection.query(query.sql, query.data, (error, result) => {
      if (error) {
        callback && callback(error)
        mongoose.connection.rollback()
        return mongoose.Promise.reject(error)
      }
      Object.assign(this, {_id: result.insertId})
      queries.forEach(query => {
        query.data[0] = this._id
        mongoose.connection.query(query.sql, query.data, (error, result) => {
          if (error) {
            callback && callback(error)
            mongoose.connection.rollback()
            return mongoose.Promise.reject(error)
          }
        })
      })
    })
    mongoose.connection.commit()
    return this.findById(this._id, callback)
  }

  ddl (withDrop) {
    return SchemaUtil.ddl(this.table(), this.column(), withDrop)
  }

}

export default Model