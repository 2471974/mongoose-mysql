'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Query = function () {
  function Query(model) {
    _classCallCheck(this, Query);

    this.$model = model;
    this.$query = {
      distinct: null,
      select: [],
      where: {},
      order: {},
      skip: -1,
      limit: -1,
      populate: []
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
      this.$query.select = fields;
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
      if (!(options instanceof Array)) options = [options];
      this.$query.populate = options.map(function (item) {
        return Object.prototype.toString.call(item) === '[object Object]' ? item : { path: item };
      });
      return this;
    }
  }, {
    key: 'count',
    value: function count(callback) {
      var sql = [],
          distinct = this.$query.distinct ? this.$query.distinct : '_id';
      sql.push('select count(distinct ', this.mapField(distinct), ') as ct from ');
      var tables = Object.keys(this.mapping.tables);
      var table = tables.shift();
      sql.push('`', table, '`');
      tables.forEach(function (element) {
        sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`');
      });

      var _buildWhere = this.buildWhere(this.$query.where),
          where = _buildWhere.where,
          data = _buildWhere.data;

      where && sql.push(' where ', where);
      return _index2.default.connection.query(sql.join(''), data).then(function (result) {
        callback && callback(null, result[0].ct);
        return _index2.default.Promise.resolve(result);
      });
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
          case '$nin':
            where.push(_this.mapField(parent) + ' not in (' + [].concat(value).fill('?').join(', ') + ')');
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
          case '$regex':
            where.push(_this.mapField(parent) + ' like ?');
            data.push('%' + value.toString() + '%');
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
            if (value instanceof RegExp) {
              where.push(_this.mapField(key) + ' like ?');
              data.push('%' + value.toString() + '%');
            } else {
              where.push(_this.mapField(key) + ' = ?');
              data.push(value);
            }
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
      var _this2 = this;

      var sql = [],
          distinct = this.$query.distinct ? this.$query.distinct : '_id';
      sql.push('select distinct ', this.mapField(distinct), ' from ');
      var tables = Object.keys(this.mapping.tables);
      var table = tables.shift();
      sql.push('`', table, '`');
      tables.forEach(function (element) {
        sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`');
      });

      var _buildWhere2 = this.buildWhere(this.$query.where),
          where = _buildWhere2.where,
          data = _buildWhere2.data;

      where && sql.push(' where ', where);
      var order = this.buildOrder(this.$query.order);
      order && sql.push(' order by ', order);
      if (this.$query.limit > 0) {
        sql.push(' limit ');
        this.$query.skip > -1 && sql.push(this.$query.skip, ', ');
        sql.push(this.$query.limit);
      }
      return _index2.default.connection.query(sql.join(''), data).then(function (result) {
        var distinct = _this2.$query.distinct ? _this2.$query.distinct : '_id';
        var field = _this2.mapping.mappings[distinct].field;
        result = result.map(function (element) {
          return element[field];
        });
        if (!_this2.$query.distinct) {
          return _this2.$model.findById(result, _this2.$query.select).then(function (result) {
            return _this2.fillPopulate(result, _this2.$query.populate, callback);
          });
        }
        callback && callback(null, result);
        return _index2.default.Promise.resolve(result);
      });
    }
  }, {
    key: 'fillPopulate',
    value: async function fillPopulate(data, populate, callback) {
      var _this3 = this;

      if (!populate || populate.length === 0) {
        callback && callback(null, data);
        return _index2.default.Promise.resolve(data);
      }
      var idMap = {}; // 构造待查询映射
      populate.forEach(function (item) {
        return Object.assign(idMap, _defineProperty({}, item.path, Object.assign({}, item, { ids: [], data: {} })));
      });
      data.forEach(function (item) {
        // 获取待查询主键
        for (var index in idMap) {
          idMap[index].ids.push(item[index]);
        }
      });

      var _loop2 = async function _loop2(index) {
        // 执行查询
        var map = idMap[index];
        var ids = Array.from(new Set(map.ids)).filter(function (item) {
          return item > 0;
        });
        if (ids.length === 0) return 'continue';
        var model = _index2.default.modelByName(map.model ? map.model : _this3.$model.schema().fields[index].ref);
        var result = await model.findById(ids, map.select);
        result.forEach(function (item) {
          map.data[item._id] = item;
        });
      };

      for (var index in idMap) {
        var _ret2 = await _loop2(index);

        if (_ret2 === 'continue') continue;
      }
      data.forEach(function (item) {
        // 填充记录
        for (var index in idMap) {
          var _map = idMap[index];
          Object.assign(item, _defineProperty({}, _map.path, _map.data[item[index]]));
        }
      });
      callback && callback(null, data);
      return _index2.default.Promise.resolve(data);
    }
  }, {
    key: 'cursor',
    value: async function cursor() {
      var result = await this.exec();
      return result[Symbol.iterator]();
    }
  }]);

  return Query;
}();

exports.default = Query;