'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Connection {
  constructor() {
    this.listeners = {}; // 执行后回调：method => {'type': 'on|once', 'called': bool, callback: function () {}}
  }

  on(action, callback) {
    typeof this.listeners[action] === 'undefined' && (this.listeners[action] = []);
    this.listeners[action].push({ type: 'on', called: false, callback });
  }

  once(action, callback) {
    typeof this.listeners[action] === 'undefined' && (this.listeners[action] = []);
    this.listeners[action].push({ type: 'once', called: false, callback });
  }

  collection(name) {
    return _index2.default.modelByCollection(name);
  }

  trigger(action, args) {
    if (typeof this.listeners[action] === 'undefined') return;
    this.listeners[action].forEach(item => {
      if (item.type === 'once' && item.called) return;
      item.called = true;
      item.callback(...args);
    });
  }

  open(config) {
    return new _index2.default.Promise((resolve, reject) => {
      this.pool = _mysql2.default.createPool(config);
      this.trigger('open', []);
      resolve();
    });
  }
  close() {
    return new _index2.default.Promise((resolve, reject) => {
      this.pool.end(error => {
        if (error) {
          this.trigger('error', [error]);
          reject(error);
        } else {
          this.trigger('close', []);
          resolve();
        }
      });
    });
  }
  query() {
    return new _index2.default.Promise((resolve, reject) => {
      let params = Array.from(arguments);
      params.push((error, result) => {
        if (error) {
          this.trigger('error', [error]);
          reject(error);
        } else {
          this.trigger('query', [result]);
          resolve(result);
        }
      });
      this.pool.query(...params);
    });
  }
  getConnection(callback) {
    return new _index2.default.Promise((resolve, reject) => {
      this.pool.getConnection((error, result) => {
        if (callback) return callback(error, result);
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}

exports.default = Connection;