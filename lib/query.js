'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Query = function () {
  function Query(model) {
    _classCallCheck(this, Query);

    this.$model = model;
    this.$query = {
      distinct: '_id',
      select: [],
      where: {},
      sort: {},
      skip: -1,
      limit: -1,
      populate: {}
    };
    this.mapping = model.mapping();
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
      var _$query$select;

      (_$query$select = this.$query.select).push.apply(_$query$select, _toConsumableArray(fields.split(' ').map(function (item) {
        return item.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
      })));
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
    key: 'buildWhere',
    value: function buildWhere(condition, parent) {
      var _this = this;

      if (Object.keys(condition).length === 0) return { where: null, data: [] };
      var where = [],
          data = [];

      var _loop = function _loop(key) {
        var value = condition[key];
        if (Object.prototype.toString.call(value) === '[object Object]') {
          var result = _this.buildWhere(value, key);
          if (!result.where) return 'continue';
          where.push('(' + result.where + ')');
          data.push.apply(data, _toConsumableArray(result.data));
          return 'continue';
        }
        var lkey = key.toLowerCase();
        switch (lkey) {
          case '$in':
            where.push(_this.mapField(parent) + ' in (' + [].concat(value).fill('?').join(', ') + ')');
            data.push.apply(data, _toConsumableArray(value));
            break;
          case '$exists':
            where.push(_this.mapField(parent) + (value ? ' is not null' : ' is null'));
            break;
          case '$ne':
            where.push(_this.mapField(parent) + ' != ?');
            data.push(value);
            break;
          case '$gte':
            where.push(_this.mapField(parent) + ' >= ?');
            data.push(value);
            break;
          case '$gt':
            where.push(_this.mapField(parent) + ' > ?');
            data.push(value);
            break;
          case '$lte':
            where.push(_this.mapField(parent) + ' <= ?');
            data.push(value);
            break;
          case '$lt':
            where.push(_this.mapField(parent) + ' < ?');
            data.push(value);
            break;
          case '$and':
          case '$or':
            var children = [];
            value.forEach(function (element) {
              var result = _this.buildWhere(element, key);
              if (!result.where) return;
              children.push(result.where);
              data.push.apply(data, _toConsumableArray(result.data));
            });
            children.length > 0 && where.push('(' + children.join(key === '$and' ? ' and ' : ' or ') + ')');
            break;
          default:
            where.push(_this.mapField(key) + ' = ?');
            data.push(value);
        }
      };

      for (var key in condition) {
        var _ret = _loop(key);

        if (_ret === 'continue') continue;
      }
      return { where: where.join(' and '), data: data };
    }
  }, {
    key: 'buildOrder',
    value: function buildOrder(order) {
      if (Object.keys(order).length === 0) return null;
      var orders = [];
      for (var field in order) {
        orders.push(this.mapField(field) + ' ' + (order[field] === -1 ? 'desc' : 'asc'));
      }
      return orders.join(', ');
    }
  }, {
    key: 'mapField',
    value: function mapField(field) {
      var mapping = this.mapping.mappings[field];
      if (!mapping) throw field + ' can not be mapped';
      return ['`', mapping.table, '`.`', mapping.field, '`'].join('');
    }
  }, {
    key: 'exec',
    value: function exec(callback) {
      var sql = [];
      sql.push('select distinct ', this.mapField(this.$query.distinct), ' from ');
      var tables = Object.keys(this.mapping.columns);
      var table = tables.shift();
      sql.push('`', table, '`');
      tables.forEach(function (element) {
        sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`');
      });

      var _buildWhere = this.buildWhere(this.$query.where),
          where = _buildWhere.where,
          data = _buildWhere.data;

      where && sql.push(' where ', where);
      var order = this.buildOrder(this.$query.order);
      order && sql.push(' order by ', order);
      if (this.$query.limit > 0) {
        sql.push(' limit ');
        this.$query.skip > -1 && sql.push(this.$query.skip, ', ');
        sql.push(this.$query.limit);
      }
      return _index2.default.connection.query(sql.join(''), data).then(function (result) {
        console.log(sql.join(''), result);
      });
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