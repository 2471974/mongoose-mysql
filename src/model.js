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

  save (callback) {
    let queries = SchemaUtil.insert(this.column(), this, this.table())
    let query = queries.shift()
    mongoose.query(query.sql, query.data, (error, result) => {
      console.log(error, result)
    })
    callback()
  }

  ddl (withDrop) {
    return SchemaUtil.ddl(this.table(), this.column(), withDrop)
  }

}

export default Model