"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Schema = function () {
  function Schema(fields, options) {
    _classCallCheck(this, Schema);

    this.fields = fields;
    this.options = options || {};
  }

  _createClass(Schema, [{
    key: "plugin",
    value: function plugin(params) {}
  }]);

  return Schema;
}();

Schema.Types = function () {
  function _class() {
    _classCallCheck(this, _class);
  }

  return _class;
}();

Schema.Types.ObjectId = function () {
  function _class2() {
    _classCallCheck(this, _class2);
  }

  return _class2;
}();

exports.default = Schema;