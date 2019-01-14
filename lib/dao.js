"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _schema = require("./schema");

var _schema2 = _interopRequireDefault(_schema);

var _schema3 = require("./util/schema");

var _schema4 = _interopRequireDefault(_schema3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Dao = function () {
  function Dao(name, schema) {
    _classCallCheck(this, Dao);

    this.name = name;
    this.schema = schema instanceof _schema2.default ? schema : new _schema2.default(schema, {
      collection: name
    });
  }

  _createClass(Dao, [{
    key: "save",
    value: function save(callback) {
      callback();
    }
  }, {
    key: "ddl",
    value: function ddl(withDrop) {
      return _schema4.default.ddl(this.schema.options.collection, this.schema.fields, withDrop);
    }
  }]);

  return Dao;
}();

exports.default = Dao;