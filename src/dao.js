import Schema from "./schema";
import SchemaUtil from './util/schema'

class Dao {
  constructor (name, schema) {
    this.name = name
    this.schema = schema instanceof Schema ? schema : new Schema(schema, {
      collection: name
    })
  }

  save (callback) {
    callback()
  }

  ddl (withDrop) {
    return SchemaUtil.ddl(this.schema.options.collection, this.schema.fields, withDrop)
  }

}

export default Dao