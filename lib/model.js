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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    key: 'new',
    value: function _new(doc) {
      return new (this.model())(doc);
    }
  }, {
    key: 'findById',
    value: function findById(id, callback) {
      var queries = _schema2.default.document(this.schema().fields, this.collection());
      var _this = this;
      return _index2.default.Promise.all(queries.map(function (query) {
        return _index2.default.connection.query(query.sql, [id]);
      })).then(function (results) {
        var doc = null;

        var _loop = function _loop(index) {
          var query = queries[index],
              result = results[index];
          if (query.keyIndex.length === 0) {
            // 主文档
            if (result.length < 1) return 'break'; // 主文档不存在
            doc = Object.assign({}, result[0]);
            query.mappings.forEach(function (mapping) {
              return doc = mapping(doc);
            });
            return 'continue';
          }
          if (result.length < 1) return 'continue'; // 子文档不存在
          result.forEach(function (item) {
            item = Object.assign({}, item);
            var keyIndex = item.autoIndex;
            try {
              keyIndex = keyIndex.split('.').slice(1);
            } catch (e) {
              // Babel转换异常处理，理论上不会走到这一步
              keyIndex = query.keyIndex;
            }
            (function extend(data, keyIndex) {
              var key = keyIndex.shift();
              if (keyIndex.length > 0) {
                if (keyIndex.length === 1 && query.isArray) {
                  typeof data[key] === 'undefined' && (data[key] = []);
                }
                if (typeof data[key] !== 'undefined') {
                  extend(data[key], keyIndex);
                }
              } else {
                item._id = item.autoId + item.autoIndex;
                query.mappings.forEach(function (mapping) {
                  return item = mapping(item);
                });
                data[key] = item;
              }
            })(doc, keyIndex);
          });
        };

        _loop2: for (var index in results) {
          var _ret = _loop(index);

          switch (_ret) {
            case 'break':
              break _loop2;

            case 'continue':
              continue;}
        }

        doc = _this.new(doc);
        callback && callback(null, doc);
        return _index2.default.Promise.resolve(doc);
      }).catch(function (error) {
        callback && callback(error);
        return _index2.default.Promise.reject(error);
      });
    }
  }, {
    key: 'save',
    value: function save(doc, callback) {
      var _this3 = this;

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
        return _this3.findById(result.insertId, callback);
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