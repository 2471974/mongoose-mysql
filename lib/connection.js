'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Connection = function () {
  function Connection() {
    _classCallCheck(this, Connection);
  }

  _createClass(Connection, [{
    key: 'open',
    value: function open(config) {
      var _this = this;

      return new _index2.default.Promise(function (resolve, reject) {
        _this.connection = _mysql2.default.createConnection(config);
        _this.connection.connect(function (error) {
          return error ? reject(error) : resolve();
        });
      });
    }
  }, {
    key: 'close',
    value: function close() {
      var _this2 = this;

      return new _index2.default.Promise(function (resolve, reject) {
        _this2.connection.end(function (error) {
          return error ? reject(error) : resolve();
        });
      });
    }
  }, {
    key: 'query',
    value: function query() {
      var _arguments = arguments,
          _this3 = this;

      return new _index2.default.Promise(function (resolve, reject) {
        var _connection;

        var params = Array.from(_arguments);
        params.push(function (error, result) {
          return error ? reject(error) : resolve(result);
        });
        (_connection = _this3.connection).query.apply(_connection, _toConsumableArray(params));
      });
    }
  }, {
    key: 'beginTransaction',
    value: function beginTransaction() {
      var _arguments2 = arguments,
          _this4 = this;

      return new _index2.default.Promise(function (resolve, reject) {
        var _connection2;

        var params = Array.from(_arguments2);
        params.push(function (error) {
          return error ? reject(error) : resolve();
        });
        (_connection2 = _this4.connection).beginTransaction.apply(_connection2, _toConsumableArray(params));
      });
    }
  }, {
    key: 'commit',
    value: function commit() {
      var _arguments3 = arguments,
          _this5 = this;

      return new _index2.default.Promise(function (resolve, reject) {
        var _connection3;

        var params = Array.from(_arguments3);
        params.push(function (error) {
          return error ? reject(error) : resolve();
        });
        (_connection3 = _this5.connection).commit.apply(_connection3, _toConsumableArray(params));
      });
    }
  }, {
    key: 'rollback',
    value: function rollback() {
      var _arguments4 = arguments,
          _this6 = this;

      return new _index2.default.Promise(function (resolve, reject) {
        var _connection4;

        var params = Array.from(_arguments4);
        params.push(function (error) {
          return error ? reject(error) : resolve();
        });
        (_connection4 = _this6.connection).rollback.apply(_connection4, _toConsumableArray(params));
      });
    }
  }]);

  return Connection;
}();

exports.default = Connection;