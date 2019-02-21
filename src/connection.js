import mysql from 'mysql'
import mongoose from './index'

class Connection {
  constructor () {
    this.listeners = {} // 执行后回调：method => {'type': 'on|once', 'called': bool, callback: function () {}}
  }

  on (action, callback) {
    typeof this.listeners[action] === 'undefined' && (this.listeners[action] = [])
    this.listeners[action].push({type: 'on', called: false, callback})
  }

  once (action, callback) {
    typeof this.listeners[action] === 'undefined' && (this.listeners[action] = [])
    this.listeners[action].push({type: 'once', called: false, callback})
  }

  collection (name) {
    return mongoose.modelByCollection(name)
  }

  trigger (action, args) {
    if (typeof this.listeners[action] === 'undefined') return
    this.listeners[action].forEach(item => {
      if (item.type === 'once' && item.called) return
      item.called = true
      item.callback(...args)
    })
  }

  open (config) {
    return new mongoose.Promise((resolve, reject) => {
      this.connection = mysql.createConnection(config)
      this.connection.connect(error => {
        if (error) {
          this.trigger('error', [error])
          reject(error)
        } else {
          this.trigger('open', [])
          resolve()
        }
      })
    })
  }
  close () {
    return new mongoose.Promise((resolve, reject) => {
      this.connection.end(error => {
        if (error) {
          this.trigger('error', [error])
          reject(error)
        } else {
          this.trigger('close', [])
          resolve()
        }
      })
    })
  }
  query () {
    return new mongoose.Promise((resolve, reject) => {
      let params = Array.from(arguments)
      params.push((error, result) => {
        if (error) {
          this.trigger('error', [error])
          reject(error)
        } else {
          this.trigger('query', [result])
          resolve(result)
        }
      })
      this.connection.query(...params)
    })
  }
  beginTransaction () {
    if (!mongoose.withTransaction) return mongoose.Promise.resolve()
    return new mongoose.Promise((resolve, reject) => {
      let params = Array.from(arguments)
      params.push(error => {
        if (error) {
          this.trigger('error', [error])
          reject(error)
        } else {
          this.trigger('beginTransaction', [])
          resolve()
        }
      })
      this.connection.beginTransaction(...params)
    })
  }
  commit () {
    if (!mongoose.withTransaction) return mongoose.Promise.resolve()
    return new mongoose.Promise((resolve, reject) => {
      let params = Array.from(arguments)
      params.push(error => {
        if (error) {
          this.trigger('error', [error])
          reject(error)
        } else {
          this.trigger('commit', [])
          resolve()
        }
      })
      this.connection.commit(...params)
    })
  }
  rollback () {
    if (!mongoose.withTransaction) return mongoose.Promise.resolve()
    return new mongoose.Promise((resolve, reject) => {
      let params = Array.from(arguments)
      params.push(error => {
        if (error) {
          this.trigger('error', [error])
          reject(error)
        } else {
          this.trigger('rollback', [])
          resolve()
        }
      })
      this.connection.rollback(...params)
    })
  }
}

export default Connection
