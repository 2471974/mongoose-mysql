import Schema from './schema'
import Model from './model'
import Connection from './connection';

class Mongoose {

  constructor () {
    this.Schema = Schema
    this.Promise = Promise
  }

  connect (config) {
    this.connection = new Connection()
    this.connection.open(config)
  }

  disconnect () {
    this.connection.close()
  }

  model (name, schema) {
    return class extends Model {
      constructor (data) {
        super(name, schema)
        Object.assign(this, data)
      }
    }
  }

}

export default new Mongoose()
