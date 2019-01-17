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
      var queries = _schema4.default.document(this.column(), this.table());
      return _index2.default.Promise.all(queries.map(function (query) {
        return _index2.default.connection.query(query.sql, [id]);
      })).then(function (results) {
        results.forEach(function (result, index) {
          queries[index].result = result;
        });
        callback || callback(null, queries);
        return _index2.default.Promise.resolve(queries);
      }).catch(function (error) {
        callback || callback(error);
        return _index2.default.Promise.reject(error);
      });
    }
  }, {
    key: 'save',
    value: function save(callback) {
      var _this = this;

      var queries = _schema4.default.insert(this.column(), this, this.table());
      var query = queries.shift();
      var promise = _index2.default.connection.beginTransaction().then(function () {
        // 启用事务
        return _index2.default.connection.query(query.sql, query.data); // 插入主文档
      });
      queries.forEach(function (query) {
        // 插入子文档
        promise = promise.then(function (result) {
          return new _index2.default.Promise(function (resolve, reject) {
            query.data[0] = result.insertId;
            _index2.default.connection.query(query.sql, query.data).then(function () {
              resolve(result); // 保留主文档执行结果
            }).catch(function (error) {
              return reject(error);
            });
          });
        });
      });
      promise.then(function (result) {
        // 提交事务
        return new _index2.default.Promise(function (resolve, reject) {
          _index2.default.connection.commit().then(function () {
            resolve(result); // 保留主文档执行结果
          }).catch(function (error) {
            return reject(error);
          });
        });
      }).catch(function (error) {
        callback && callback(error);
        _index2.default.connection.rollback(); // 回滚事务
        return _index2.default.Promise.reject(error);
      });
      return promise.then(function (result) {
        return _this.findById(result.insertId, callback);
      });
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