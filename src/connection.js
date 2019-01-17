import mysql from 'mysql'

class Connection {
  constructor () {}
  open (config) {
    this.connection = mysql.createConnection(config)
    this.connection.connect()
  }
  close () {
    this.connection.end()
  }
  query () {
    this.connection.query(...arguments)
  }
  beginTransaction () {
    this.connection.beginTransaction(...arguments)
  }
  commit () {
    this.connection.commit(...arguments)
  }
  rollback () {
    this.connection.rollback(...arguments)
  }
}

export default Connection
