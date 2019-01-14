import mysql from 'mysql'
import Schema from './schema'
import Dao from './dao'

class Mongoose {

  constructor () {}

  // connect (uri, opts) {
  //   throw 'TODO: convert uri to mysql'
  // }

  connect (config) {
    this.connection = mysql.createConnection(config)
    this.connection.connect()
  }

  model (name, schema) {
    return class extends Dao {
      constructor () {
        super(name, schema)
      }
    }
  }

}

Mongoose.Schema = Schema
Mongoose.Promise = Promise

export default new Mongoose()
