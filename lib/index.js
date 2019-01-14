'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _mysql = require('mysql');

var _mysql2 = _interopRequireDefault(_mysql);

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

var _dao = require('./dao');

var _dao2 = _interopRequireDefault(_dao);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Mongoose = function () {
  function Mongoose() {
    _classCallCheck(this, Mongoose);
  }

  // connect (uri, opts) {
  //   throw 'TODO: convert uri to mysql'
  // }

  _createClass(Mongoose, [{
    key: 'connect',
    value: function connect(config) {
      this.connection = _mysql2.default.createConnection(config);
      this.connection.connect();
    }
  }, {
    key: 'model',
    value: function model(name, schema) {
      return function (_Dao) {
        _inherits(_class, _Dao);

        function _class() {
          _classCallCheck(this, _class);

          return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, name, schema));
        }

        return _class;
      }(_dao2.default);
    }
  }]);

  return Mongoose;
}();

Mongoose.Schema = _schema2.default;
Mongoose.Promise = Promise;

exports.default = new Mongoose();