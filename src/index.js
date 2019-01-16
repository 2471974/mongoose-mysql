import mysql from 'mysql'
import Schema from './schema'
import Model from './model'

class Mongoose {

  constructor () {
    this.Schema = Schema
    this.Promise = Promise
  }

  // connect (uri, opts) {
  //   throw 'TODO: convert uri to mysql'
  // }

  connect (config) {
    this.connection = mysql.createConnection(config)
    this.connection.connect()
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
