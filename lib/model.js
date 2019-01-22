'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _schema = require('./util/schema');

var _schema2 = _interopRequireDefault(_schema);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _document = require('./document');

var _document2 = _interopRequireDefault(_document);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * 静态模型
 */
var Model = function (_Document) {
  _inherits(Model, _Document);

  function Model() {
    _classCallCheck(this, Model);

    return _possibleConstructorReturn(this, (Model.__proto__ || Object.getPrototypeOf(Model)).apply(this, arguments));
  }

  _createClass(Model, null, [{
    key: 'mapping',
    value: function mapping() {
      if (!this.$mapping) {
        this.$mapping = _schema2.default.mapping(this.schema().fields, this.collection());
      }
      return this.$mapping;
    }
  }, {
    key: 'new',
    value: function _new(doc) {
      return new (this.model())(doc);
    }
  }, {
    key: 'query',
    value: function query() {
      return new _query2.default(this.model());
    }
  }, {
    key: 'remove',
    value: function remove(condition, callback) {
      var _this2 = this;

      return this.query().where(condition).distinct('_id').exec().then(function (result) {
        if (result.length === 0) {
          callback && callback(null, result.length);
          return _index2.default.Promise.resolve(result.length);
        }
        return _this2.removeById(result, callback);
      }).catch(function (error) {
        return _index2.default.Promise.reject(error);
      });
    }
  }, {
    key: 'removeById',
    value: function removeById(id, callback) {
      if (Object.prototype.toString.call(id) === '[object Object]') id = id._id;
      var queries = [],
          ids = id instanceof Array ? id : [id];
      var tables = this.mapping().tables;
      var tableName = Object.keys(tables)[0]; // 主表
      for (var table in tables) {
        var sql = [];
        sql.push('delete from `', table, '` where ', table === tableName ? '`_id`' : '`autoId`');
        sql.push(' in (', [].concat(ids).fill('?').join(', '), ')');
        queries.push({ sql: sql.join(''), data: ids });
      }
      var query = queries.shift();
      var promise = _index2.default.connection.beginTransaction().then(function () {
        // 启用事务
        return _index2.default.connection.query(query.sql, query.data); // 删除主文档
      });
      queries.forEach(function (query) {
        // 删除子文档
        promise = promise.then(function (result) {
          return new _index2.default.Promise(function (resolve, reject) {
            _index2.default.connection.query(query.sql, query.data).then(function () {
              resolve(result); // 保留主文档执行结果
            }).catch(function (error) {
              return reject(error);
            });
          });
        });
      });
      return promise.then(function (result) {
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
      }).then(function (result) {
        callback && callback(null, result.affectedRows);
        return _index2.default.Promise.resolve(result.affectedRows);
      });
    }
  }, {
    key: 'findById',
    value: function findById(id, fields, callback) {
      var _this3 = this;

      if (typeof fields === 'function') {
        callback = fields;
        fields = null;
      }
      if (Object.prototype.toString.call(id) === '[object Object]') id = id._id;
      var mapping = this.mapping();
      var tableName = Object.keys(mapping.tables)[0]; // 主表
      var selectFields = {}; // 自定义查询字段
      Array.from(new Set(fields ? fields : [])).map(function (item) {
        return mapping.mappings[item];
      }).forEach(function (item) {
        selectFields[item.table] || (selectFields[item.table] = []);
        selectFields[item.table].push(item.field);
      });
      var tables = {}; // 带查询数据表
      if (Object.keys(selectFields).length === 0) {
        tables = Object.assign({}, mapping.tables);
      } else {
        var _loop = function _loop(index) {
          if (typeof selectFields[index] === 'undefined') return 'continue';
          if (index === tableName) {
            selectFields[index].indexOf('_id') === -1 && selectFields[index].unshift('_id');
          } else {
            selectFields[index].indexOf('autoIndex') === -1 && selectFields[index].unshift('autoIndex');
            selectFields[index].indexOf('autoId') === -1 && selectFields[index].unshift('autoId');
          }
          var table = mapping.tables[index];
          Object.assign(tables, _defineProperty({}, index, {
            columns: table.columns.filter(function (item) {
              return selectFields[index].indexOf(item) !== -1;
            }),
            maps: table.maps,
            isArray: table.isArray
          }));
        };

        for (var index in mapping.tables) {
          var _ret = _loop(index);

          if (_ret === 'continue') continue;
        }
      }
      var queries = [],
          ids = id instanceof Array ? id : [id];
      for (var table in tables) {
        var sql = [];
        sql.push('select ', tables[table].columns.map(function (item) {
          return '`' + item + '`';
        }).join(', '));
        sql.push(' from `', table, '` where ', table === tableName ? '`_id`' : '`autoId`');
        sql.push(' in (', [].concat(ids).fill('?').join(', '), ')');
        if (table !== tableName) sql.push(' order by `autoIndex` asc');
        queries.push(_index2.default.connection.query(sql.join(''), ids));
      }
      return _index2.default.Promise.all(queries).then(function (results) {
        var data = [];
        ids.forEach(function (id) {
          var rindex = 0,
              doc = null;

          var _loop2 = function _loop2(index) {
            var table = tables[index],
                result = results[rindex++];
            if (index === tableName) {
              // 主文档查询结果
              result = result.filter(function (item) {
                return id === item._id;
              });
              if (result.length === 0) {
                // 主文档记录不存在
                return 'break';
              } else {
                doc = Object.assign({}, result[0]);
                table.maps.forEach(function (map) {
                  return doc = map(doc);
                });
                return 'continue';
              }
            } else {
              result = result.filter(function (item) {
                return id === item.autoId;
              });
            }
            if (result.length < 1) return 'continue'; // 子文档不存在
            result.forEach(function (item) {
              item = Object.assign({}, item);
              (function extend(data, keyIndex) {
                var key = keyIndex.shift();
                if (keyIndex.length > 0) {
                  if (keyIndex.length === 1 && table.isArray) {
                    typeof data[key] === 'undefined' && (data[key] = []);
                  }
                  if (typeof data[key] !== 'undefined') {
                    extend(data[key], keyIndex);
                  }
                } else {
                  item._id = _schema2.default.index(item.autoId, item.autoIndex);
                  table.maps.forEach(function (map) {
                    return item = map(item);
                  });
                  data[key] = item;
                }
              })(doc, item.autoIndex.split('.'));
            });
          };

          _loop3: for (var index in tables) {
            var _ret2 = _loop2(index);

            switch (_ret2) {
              case 'break':
                break _loop3;

              case 'continue':
                continue;}
          }

          if (doc !== null) data.push(_this3.new(doc));
        });
        if (!(id instanceof Array)) data = data.length > 0 ? data[0] : data;
        callback && callback(null, data);
        return _index2.default.Promise.resolve(data);
      }).catch(function (error) {
        callback && callback(error);
        return _index2.default.Promise.reject(error);
      });
    }
  }, {
    key: 'save',
    value: function save(doc, callback) {
      var _this4 = this;

      var queries = _schema2.default.insert(this.schema().fields, doc, this.collection());
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
        return _this4.findById(result.insertId, callback);
      });
    }
  }, {
    key: 'ddl',
    value: function ddl(withDrop) {
      return _schema2.default.ddl(this.schema().fields, this.collection(), withDrop);
    }
  }]);

  return Model;
}(_document2.default);

exports.default = Model;