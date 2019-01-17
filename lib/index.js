'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

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

    this.Schema = _schema2.default;
    this.Promise = Promise;
  }

  // connect (uri, opts) {
  //   throw 'TODO: convert uri to mysql'
  // }

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
    key: 'query',
    value: function query() {
      this.connection.query.call(arguments);
    }
  }, {
    key: 'model',
    value: function model(name, schema) {
      return function (_Model) {
        _inherits(_class, _Model);

        function _class(data) {
          _classCallCheck(this, _class);

          var _this = _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, name, schema));

          Object.assign(_this, data);
          return _this;
        }

        return _class;
      }(_model2.default);
    }
  }]);

  return Mongoose;
}();

exports.default = new Mongoose();