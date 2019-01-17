'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Connection = function () {
  function Connection() {
    _classCallCheck(this, Connection);
  }

  _createClass(Connection, [{
    key: 'open',
    value: function open(config) {
      this.connection = _mysql2.default.createConnection(config);
      this.connection.connect();
    }
  }, {
    key: 'close',
    value: function close() {
      this.connection.end();
    }
  }, {
    key: 'query',
    value: function query() {
      var _connection;

      (_connection = this.connection).query.apply(_connection, arguments);
    }
  }, {
    key: 'beginTransaction',
    value: function beginTransaction() {
      var _connection2;

      (_connection2 = this.connection).beginTransaction.apply(_connection2, arguments);
    }
  }, {
    key: 'commit',
    value: function commit() {
      var _connection3;

      (_connection3 = this.connection).commit.apply(_connection3, arguments);
    }
  }, {
    key: 'rollback',
    value: function rollback() {
      var _connection4;

      (_connection4 = this.connection).rollback.apply(_connection4, arguments);
    }
  }]);

  return Connection;
}();

exports.default = Connection;