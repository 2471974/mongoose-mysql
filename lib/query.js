'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _schema = require('./util/schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Query = function () {
  function Query(model) {
    _classCallCheck(this, Query);

    this.$model = model;
    this.$query = {};
  }

  _createClass(Query, [{
    key: 'distinct',
    value: function distinct(field) {
      this.$query.distinct = field;
      return this;
    }
  }, {
    key: 'select',
    value: function select(fields) {
      var _this = this;

      this.$query.select || (this.$query.select = new Set());
      fields.split(' ').forEach(function (item) {
        item = item.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        item && _this.$query.select.add(item);
      });
      return this;
    }
  }, {
    key: 'where',
    value: function where(condition) {
      this.$query.where = condition;
      return this;
    }
  }, {
    key: 'sort',
    value: function sort(order) {
      if (Object.prototype.toString.call(order) === '[object Object]') {
        for (var field in order) {
          order[field] = order[field] === 1 ? 1 : -1;
        }
      } else {
        if (order.indexof('-') === 0) {
          order = _defineProperty({}, order.substr(1), -1);
        } else if (order.indexof('+') === 0) {
          order = _defineProperty({}, order.substr(1), 1);
        } else {
          order = { order: 1 };
        }
      }
      this.$query.order = order;
      return this;
    }
  }, {
    key: 'skip',
    value: function skip(_skip) {
      this.$query.skip = _skip;
      return this;
    }
  }, {
    key: 'limit',
    value: function limit(_limit) {
      this.$query.limit = _limit;
      return this;
    }
  }, {
    key: 'populate',
    value: function populate(options) {
      this.$query.populate = options;
      return this;
    }
  }, {
    key: 'count',
    value: function count(callback) {
      callback && callback();
    }
  }, {
    key: 'exec',
    value: function exec(callback) {
      var mapping = _schema2.default.mapping(this.$model.schema().fields, this.$model.collection());
      callback && callback(mapping);
    }
  }, {
    key: 'cursor',
    value: function cursor() {
      return [][Symbol.iterator]();
    }
  }]);

  return Query;
}();

exports.default = Query;