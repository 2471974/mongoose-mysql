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
      this.pool = mysql.createPool(config)
      this.trigger('open', [])
      resolve()
    })
  }
  close () {
    return new mongoose.Promise((resolve, reject) => {
      this.pool.end(error => {
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
      this.pool.query(...params)
    })
  }
  getConnection (callback) {
    return new mongoose.Promise((resolve, reject) => {
      this.pool.getConnection((error, result) => {
        if (callback) return callback(error, result)
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }
}

export default Connection
