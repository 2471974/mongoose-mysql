'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * 仅支持单个集合的一次性聚合操作
 * 1.子文档数组默认按照unwind方式进行查询，忽略查询语句中的unwind指令
 * 2.不支持多个集合的聚合查询，使用lookup指令会抛出异常
 * 3.合并管道进行单次查询，不支持二次聚合（可能与业务预期结果不一致）
 */
var Aggregate = function () {
  function Aggregate(options, model) {
    _classCallCheck(this, Aggregate);

    this.$options = options;
    this.$model = model;
    this.mapping = model.mapping();
  }

  _createClass(Aggregate, [{
    key: 'options',
    value: function options() {
      var options = {};
      for (var index in this.$options) {
        options = Object.assign(options[index] || {}, this.$options[index]);
      }
      return options;
    }
  }, {
    key: 'buildProject',
    value: function buildProject(project, mappings) {
      var result = {};
      for (var index in project) {
        var value = project[index];
        if (value === 1) {
          value = index;
        } else if (value === 0) {
          continue;
        } else if (value.indexOf('$') === 0) {
          value = value.substring(1);
        }
        var mapping = mappings[value];
        Object.assign(result, _defineProperty({}, index, ["`", mapping.table, "`.`", mapping.field, "` as '", result.replace("'", ""), "'"].join('')));
      }
      return result;
    }
  }, {
    key: 'exec',
    value: function exec(callback) {
      var options = this.options(),
          query = this.$model.query();
      var project = this.buildProject(options.$project, this.mapping.mappings);
      var sql = ["select ", Object.keys(project).length > 0 ? Object.values(project) : "*", " from "];
      var tables = Object.keys(this.mapping.tables);
      var table = tables.shift();
      sql.push('`', table, '`');
      tables.forEach(function (element) {
        sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`');
      });

      var _query$buildWhere = query.buildWhere(options.$match || {}),
          where = _query$buildWhere.where,
          data = _query$buildWhere.data;

      where && sql.push(' where ', where);
      var order = query.buildOrder(options.$sort || {});
      order && sql.push(' order by ', order);
      if (options.$limit && options.$limit > 0) {
        sql.push(' limit ');
        options.$skip && options.$skip > -1 && sql.push(options.$skip, ', ');
        sql.push(options.$limit);
      }
      console.log(sql.join(''), data);
      return _index2.default.connection.query(sql.join(''), data).then(function (result) {
        callback && callback(null, result);
        return _index2.default.Promise.resolve(result);
      });
    }
  }]);

  return Aggregate;
}();

exports.default = Aggregate;