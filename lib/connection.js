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
      this.connection = _mysql2.default.createConnection(config);
      this.connection.connect(error => {
        if (error) {
          this.trigger('error', [error]);
          reject(error);
        } else {
          this.trigger('open', []);
          resolve();
        }
      });
    });
  }
  close() {
    return new _index2.default.Promise((resolve, reject) => {
      this.connection.end(error => {
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
      this.connection.query(...params);
    });
  }
  beginTransaction() {
    if (!_index2.default.withTransaction) return _index2.default.Promise.resolve();
    return new _index2.default.Promise((resolve, reject) => {
      let params = Array.from(arguments);
      params.push(error => {
        if (error) {
          this.trigger('error', [error]);
          reject(error);
        } else {
          this.trigger('beginTransaction', []);
          resolve();
        }
      });
      this.connection.beginTransaction(...params);
    });
  }
  commit() {
    if (!_index2.default.withTransaction) return _index2.default.Promise.resolve();
    return new _index2.default.Promise((resolve, reject) => {
      let params = Array.from(arguments);
      params.push(error => {
        if (error) {
          this.trigger('error', [error]);
          reject(error);
        } else {
          this.trigger('commit', []);
          resolve();
        }
      });
      this.connection.commit(...params);
    });
  }
  rollback() {
    if (!_index2.default.withTransaction) return _index2.default.Promise.resolve();
    return new _index2.default.Promise((resolve, reject) => {
      let params = Array.from(arguments);
      params.push(error => {
        if (error) {
          this.trigger('error', [error]);
          reject(error);
        } else {
          this.trigger('rollback', []);
          resolve();
        }
      });
      this.connection.rollback(...params);
    });
  }
}

exports.default = Connection;