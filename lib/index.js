'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _schema2 = require('./schema');

var _schema3 = _interopRequireDefault(_schema2);

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _connection = require('./connection');

var _connection2 = _interopRequireDefault(_connection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Mongoose = function () {
  function Mongoose() {
    _classCallCheck(this, Mongoose);

    this.Schema = _schema3.default;
    this.Promise = Promise;
    this.$collections = {}; // 集合与模型名称的映射
    this.$models = {}; // 模型名称与模型类的映射
  }

  _createClass(Mongoose, [{
    key: 'connect',
    value: function connect(config) {
      this.connection = new _connection2.default();
      this.connection.open(config);
    }
  }, {
    key: 'disconnect',
    value: function disconnect() {
      this.connection.close();
    }
  }, {
    key: 'modelByName',
    value: function modelByName(name) {
      return this.$models[name];
    }
  }, {
    key: 'modelByCollection',
    value: function modelByCollection(name) {
      return this.$models[this.$collections[name]];
    }
  }, {
    key: 'model',
    value: function model(_name, _schema) {
      var instance = this;
      if (!(_schema instanceof _schema3.default)) _schema = new _schema3.default(_schema, { collection: _name });
      var _collection = _schema.options.collection;
      var model = function (_Model) {
        _inherits(model, _Model);

        function model() {
          _classCallCheck(this, model);

          return _possibleConstructorReturn(this, (model.__proto__ || Object.getPrototypeOf(model)).apply(this, arguments));
        }

        _createClass(model, [{
          key: 'model',
          value: function model() {
            return instance.$models[_name];
          }
        }], [{
          key: 'name',
          value: function name() {
            return _name;
          }
        }, {
          key: 'schema',
          value: function schema() {
            return _schema;
          }
        }, {
          key: 'collection',
          value: function collection() {
            return _collection;
          }
        }, {
          key: 'model',
          value: function model() {
            return instance.$models[_name];
          }
        }]);

        return model;
      }(_model2.default);
      this.$collections[_collection] = _name;
      this.$models[_name] = model;
      return model;
    }
  }]);

  return Mongoose;
}();

exports.default = new Mongoose();