"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

    this.options = options;
    this.$model = model;
    this.mapping = model.mapping();
  }

  _createClass(Aggregate, [{
    key: "options",
    value: function options() {
      var options = {};
      for (var index in this.options) {
        options = Object.assign(options[index] || {}, this.options[index]);
      }
      return options;
    }
  }, {
    key: "exec",
    value: function exec(callback) {}
  }]);

  return Aggregate;
}();

exports.default = Aggregate;