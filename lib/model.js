'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

var _schema3 = require('./util/schema');

var _schema4 = _interopRequireDefault(_schema3);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Model = function () {
  function Model(name, schema) {
    _classCallCheck(this, Model);

    this._name = name;
    this._schema = schema instanceof _schema2.default ? schema : new _schema2.default(schema, {
      collection: name
    });
  }

  _createClass(Model, [{
    key: 'name',
    value: function name() {
      return this._name;
    }
  }, {
    key: 'schema',
    value: function schema() {
      return this._schema;
    }
  }, {
    key: 'table',
    value: function table() {
      return this.schema().options.collection;
    }
  }, {
    key: 'column',
    value: function column() {
      return this.schema().fields;
    }
  }, {
    key: 'findById',
    value: function findById(id, callback) {
      console.log(arguments);
      callback(null, id);
    }
  }, {
    key: 'save',
    value: function save(callback) {
      var _this = this;

      var queries = _schema4.default.insert(this.column(), this, this.table());
      var query = queries.shift();
      _index2.default.connection.beginTransaction();
      _index2.default.connection.query(query.sql, query.data, function (error, result) {
        if (error) {
          callback && callback(error);
          _index2.default.connection.rollback();
          return _index2.default.Promise.reject(error);
        }
        Object.assign(_this, { _id: result.insertId });
        queries.forEach(function (query) {
          query.data[0] = _this._id;
          _index2.default.connection.query(query.sql, query.data, function (error, result) {
            if (error) {
              callback && callback(error);
              _index2.default.connection.rollback();
              return _index2.default.Promise.reject(error);
            }
          });
        });
      });
      _index2.default.connection.commit();
      return this.findById(this._id, callback);
    }
  }, {
    key: 'ddl',
    value: function ddl(withDrop) {
      return _schema4.default.ddl(this.table(), this.column(), withDrop);
    }
  }]);

  return Model;
}();

exports.default = Model;