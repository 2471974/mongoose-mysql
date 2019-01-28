'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

var _model = require('./model');

var _model2 = _interopRequireDefault(_model);

var _connection = require('./connection');

var _connection2 = _interopRequireDefault(_connection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Mongoose {

  constructor() {
    this.Schema = _schema2.default;
    this.Promise = Promise;
    this.$collections = {}; // 集合与模型名称的映射
    this.$models = {}; // 模型名称与模型类的映射
  }

  connect(config) {
    this.connection = new _connection2.default();
    this.connection.open(config);
  }

  disconnect() {
    this.connection.close();
  }

  modelByName(name) {
    return this.$models[name];
  }

  modelByCollection(name) {
    return this.$models[this.$collections[name]];
  }

  model(name, schema) {
    let instance = this;
    if (!(schema instanceof _schema2.default)) schema = new _schema2.default(schema, { collection: name });
    let collection = schema.options.collection;
    let model = class extends _model2.default {
      static name() {
        return name;
      }
      static schema() {
        return schema;
      }
      static collection() {
        return collection;
      }
      static model() {
        return instance.$models[name];
      }
      model() {
        return instance.$models[name];
      }
    };
    this.$collections[collection] = name;
    this.$models[name] = model;
    return model;
  }

}

exports.default = new Mongoose();