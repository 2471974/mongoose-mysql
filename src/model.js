import Schema from "./schema";
import SchemaUtil from './util/schema'

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

  save (callback) {
    callback()
  }

  ddl (withDrop) {
    return SchemaUtil.ddl(this.schema().options.collection, this.schema().fields, withDrop)
  }

}

export default Model