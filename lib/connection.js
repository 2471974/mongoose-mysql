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
  constructor() {}
  open(config) {
    return new _index2.default.Promise((resolve, reject) => {
      this.connection = _mysql2.default.createConnection(config);
      this.connection.connect(error => error ? reject(error) : resolve());
    });
  }
  close() {
    return new _index2.default.Promise((resolve, reject) => {
      this.connection.end(error => error ? reject(error) : resolve());
    });
  }
  query() {
    return new _index2.default.Promise((resolve, reject) => {
      let params = Array.from(arguments);
      params.push((error, result) => error ? reject(error) : resolve(result));
      this.connection.query(...params);
    });
  }
  beginTransaction() {
    return new _index2.default.Promise((resolve, reject) => {
      let params = Array.from(arguments);
      params.push(error => error ? reject(error) : resolve());
      this.connection.beginTransaction(...params);
    });
  }
  commit() {
    return new _index2.default.Promise((resolve, reject) => {
      let params = Array.from(arguments);
      params.push(error => error ? reject(error) : resolve());
      this.connection.commit(...params);
    });
  }
  rollback() {
    return new _index2.default.Promise((resolve, reject) => {
      let params = Array.from(arguments);
      params.push(error => error ? reject(error) : resolve());
      this.connection.rollback(...params);
    });
  }
}

exports.default = Connection;