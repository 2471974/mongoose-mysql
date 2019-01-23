'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
  }

  _createClass(Aggregate, [{
    key: 'buildProject',
    value: function buildProject(project) {
      var result = [];
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
        result.push(value + " as '" + index.replace("'", "") + "'");
      }
      return result;
    }
  }, {
    key: 'baseQuery',
    value: function baseQuery(mapping) {
      var project = [];
      for (var index in mapping.mappings) {
        var item = mapping.mappings[index];
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
      var project = this.buildProject(options.$project);
      var sql = ["select ", project.length > 0 ? project.join(', ') : "*", " from "];
      sql.push("(", subquery, ")");
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
  }, {
    key: 'buildGroup',
    value: function buildGroup(group, subquery, data) {
      if (!group) return { subquery: subquery, data: data };
      var sql = [];
      return { sql: sql, data: data };
    }
  }, {
    key: 'buildLookup',
    value: function buildLookup(lookup, subquery) {
      if (!lookup) return subquery;
      return sql.join('');
    }
  }, {
    key: 'exec',
    value: function exec(callback) {
      var _this = this;

      var sql = this.baseQuery(this.mapping),
          data = [];
      sql = this.buildLookup(sql);
      this.options.forEach(function (option) {
        var result = _this.buildQuery(option, sql, data);
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