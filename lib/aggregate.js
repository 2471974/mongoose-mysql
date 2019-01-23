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

/**
 * 子文档数组默认按照unwind方式进行查询，忽略查询语句中的unwind指令
 */
var Aggregate = function () {
  function Aggregate(options, model) {
    _classCallCheck(this, Aggregate);

    this.options = options;
    this.$model = model;
    this.mapping = model.mapping();
    var query = model.query();
    this.$query = {
      buildWhere: query.buildWhere,
      buildOrder: query.buildOrder,
      mapField: function mapField(field) {
        return '`' + field + '`';
      }
    };
    this.$tableIndex = 0;
  }

  _createClass(Aggregate, [{
    key: 'tableName',
    value: function tableName() {
      return 't_' + ++this.$tableIndex;
    }
  }, {
    key: 'buildProject',
    value: function buildProject(project, prefix) {
      var result = {};
      if (!project) return result;
      for (var index in project) {
        var value = project[index];
        if (Object.prototype.toString.call(value) === '[object Object]') {
          var fn = Object.keys(value)[0].toUpperCase();
          value = Object.values(value)[0].substring(1);
          switch (fn) {
            case '$DAYOFWEEK':
              value = 'DAYOFWEEK(`' + value + '`)';break;
            case '$WEEKDAY':
              value = 'WEEKDAY(`' + value + '`)';break;
            case '$DAYOFMONTH':
              value = 'DAYOFMONTH(`' + value + '`)';break;
            case '$DAYOFYEAR':
              value = 'DAYOFYEAR(`' + value + '`)';break;
            case '$MONTH':
              value = 'MONTH(`' + value + '`)';break;
            case '$QUARTER':
              value = 'QUARTER(`' + value + '`)';break;
            case '$WEEK':
              value = 'WEEK(`' + value + '`)';break;
            case '$YEAR':
              value = 'YEAR(`' + value + '`)';break;
            case '$HOUR':
              value = 'HOUR(`' + value + '`)';break;
            case '$MINUTE':
              value = 'MINUTE(`' + value + '`)';break;
            case '$SECOND':
              value = 'SECOND(`' + value + '`)';break;
            default:
              throw 'unsupported convert function ' + fn + ' on field ' + index;
          }
        } else if (value === 1) {
          value = '`' + index + '`';
        } else if (value === 0) {
          continue;
        } else if (value.indexOf('$') === 0) {
          value = '`' + value.substring(1) + '`';
        }
        prefix && (index = prefix + '.' + index);
        Object.assign(result, _defineProperty({}, index, value + " as '" + index.replace("'", "") + "'"));
      }
      return result;
    }
  }, {
    key: 'baseQuery',
    value: function baseQuery(mapping, prefix) {
      var project = [];
      for (var index in mapping.mappings) {
        var item = mapping.mappings[index];
        prefix && (index = prefix + '.' + index);
        project.push(["`", item.table, "`.`", item.field, "` as '", index.replace("'", ""), "'"].join(''));
      }
      var sql = ["select ", project.join(', '), " from "];
      var tables = Object.keys(mapping.tables);
      var table = tables.shift();
      sql.push('`', table, '`');
      tables.forEach(function (element) {
        sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`');
      });
      return sql.join('');
    }
  }, {
    key: 'buildQuery',
    value: function buildQuery(options, subquery, data) {
      subquery = this.buildLookup(options.$lookup, subquery);
      var project = this.buildProject(options.$project);
      var sql = ["select ", Object.keys(project).length > 0 ? Object.values(project).join(', ') : "*"];
      sql.push(" from (", subquery, ") as `", this.tableName(), "`");
      var result = this.$query.buildWhere(options.$match || {});
      result.where && sql.push(' where ', result.where);
      data.push.apply(data, _toConsumableArray(result.data));
      var order = this.$query.buildOrder(options.$sort || {});
      order && sql.push(' order by ', order);
      if (options.$limit && options.$limit > 0) {
        sql.push(' limit ');
        options.$skip && options.$skip > -1 && sql.push(options.$skip, ', ');
        sql.push(options.$limit);
      }
      return this.buildGroup(options.$group, sql.join(''), data);
    }

    /**
     * 构造功能函数的判断条件，与buildWhere的格式相反
     */

  }, {
    key: 'buildCondition',
    value: function buildCondition(condition) {
      var _this = this;

      if (Object.keys(condition).length === 0) return { where: null, data: [] };
      var where = [],
          data = [];

      var _loop = function _loop(key) {
        var value = condition[key];
        var lkey = key.toLowerCase();
        switch (lkey) {
          case '$ne':
            where.push('`' + value[0].substring(1) + '` != ?');
            data.push(value[1]);
            break;
          case '$gte':
            where.push('`' + value[0].substring(1) + '` >= ?');
            data.push(value[1]);
            break;
          case '$gt':
            where.push('`' + value[0].substring(1) + '` > ?');
            data.push(value[1]);
            break;
          case '$lte':
            where.push('`' + value[0].substring(1) + '` <= ?');
            data.push(value[1]);
            break;
          case '$lt':
            where.push('`' + value[0].substring(1) + '` < ?');
            data.push(value[1]);
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
        _loop(key);
      }
      return { where: where.join(' and '), data: data };
    }
  }, {
    key: 'buildGroup',
    value: function buildGroup(group, subquery, data) {
      if (!group) return { sql: subquery, data: data };
      var sql = [],
          project = this.buildProject(group._id, '_id');
      var groupKeys = Object.keys(project);
      for (var key in group) {
        if (key === '_id') continue;
        var _value = group[key];
        var fn = Object.keys(_value)[0].toLowerCase();
        _value = Object.values(_value)[0];
        switch (fn) {
          case '$sum':
          case '$max':
          case '$min':
          case '$avg':
            var fnName = fn.substring(1);
            if (Object.prototype.toString.call(_value) === '[object Object]') {
              // 功能
              fn = Object.keys(_value)[0].toLowerCase();
              _value = Object.values(_value)[0];
              switch (fn) {
                case '$add':
                  _value = fnName + '(' + _value.map(function (item) {
                    return item.toString().indexOf('$') === 0 ? '`' + item.substring(1) + '`' : item;
                  }).join('+') + ')';
                  break;
                case '$cond':
                  var result = this.buildCondition(_value[0]);
                  _value = fnName + '(if(' + result.where + ', ' + _value[1] + ', ' + _value[2] + '))';
                  break;
                default:
                  throw 'unsupported group sub function ' + fn + ' on field ' + key;
              }
            } else if (_value.toString().indexOf('$') === 0) {
              // 字段
              _value = fnName + '(`' + _value.substring(1) + '`)';
            } else {
              // 数值
              _value = fnName + '(' + _value + ')';
            }
            break;
          case '$first':
            // MySQL always return the first record in grouping
            _value = '`' + _value.substring(1) + '`';
            break;
          default:
            throw 'unsupported group function ' + fn + ' on field ' + key;
        }
        Object.assign(project, _defineProperty({}, key, _value + " as '" + key.replace("'", "") + "'"));
      }
      sql.push('select ', Object.keys(project).length > 0 ? Object.values(project).join(', ') : '*');
      sql.push(' from (', subquery, ') as `', this.tableName(), '`');
      if (groupKeys.length > 0) {
        sql.push(' group by ', groupKeys.map(function (key) {
          return '`' + key + '`';
        }).join(', '));
      }
      return { sql: sql.join(''), data: data };
    }
  }, {
    key: 'buildLookup',
    value: function buildLookup(lookup, subquery) {
      if (!lookup) return subquery;
      var model = _index2.default.modelByCollection(lookup.from);
      var ta = this.tableName(),
          tb = this.tableName();
      var sql = ['select * from (', subquery, ') as `', ta, '` left join ('];
      sql.push(this.baseQuery(model.mapping(), lookup.as), ') as `', tb, '` on ');
      sql.push('`', ta, '`.`', lookup.localField, '` = `', tb, '`.`', lookup.as, '.', lookup.foreignField, '`');
      return sql.join('');
    }
  }, {
    key: 'exec',
    value: function exec(callback) {
      var _this2 = this;

      var sql = this.baseQuery(this.mapping),
          data = [];
      this.options.forEach(function (option) {
        var result = _this2.buildQuery(option, sql, data);
        sql = result.sql;
        data = result.data;
      });
      console.log(sql, data);
      return _index2.default.connection.query(sql, data).then(function (result) {
        callback && callback(null, result);
        return _index2.default.Promise.resolve(result);
      });
    }
  }]);

  return Aggregate;
}();

exports.default = Aggregate;