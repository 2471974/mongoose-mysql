import mysql from 'mysql'
import mongoose from './index'

class Connection {
  constructor () {}
  open (config) {
    return new mongoose.Promise((resolve, reject) => {
      this.connection = mysql.createConnection(config)
      this.connection.connect(error => error ? reject(error) : resolve())
    })
  }
  close () {
    return new mongoose.Promise((resolve, reject) => {
      this.connection.end(error => error ? reject(error) : resolve())
    })
  }
  query () {
    return new mongoose.Promise((resolve, reject) => {
      let params = Array.from(arguments)
      params.push((error, result) => error ? reject(error) : resolve(result))
      this.connection.query(...params)
    })
  }
  beginTransaction () {
    if (!mongoose.withTransaction) return mongoose.Promise.resolve()
    return new mongoose.Promise((resolve, reject) => {
      let params = Array.from(arguments)
      params.push(error => error ? reject(error) : resolve())
      this.connection.beginTransaction(...params)
    })
  }
  commit () {
    if (!mongoose.withTransaction) return mongoose.Promise.resolve()
    return new mongoose.Promise((resolve, reject) => {
      let params = Array.from(arguments)
      params.push(error => error ? reject(error) : resolve())
      this.connection.commit(...params)
    })
  }
  rollback () {
    if (!mongoose.withTransaction) return mongoose.Promise.resolve()
    return new mongoose.Promise((resolve, reject) => {
      let params = Array.from(arguments)
      params.push(error => error ? reject(error) : resolve())
      this.connection.rollback(...params)
    })
  }
}

export default Connection
