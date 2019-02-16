'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schema = require('./util/schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO:
class Schema {

  constructor(fields, options) {
    this.fields = _schema2.default.optimizeObject(fields);
    this.options = options || {};
  }

  get methods() {
    return {};
  }

  set methods(data) {}

  get statics() {
    return {};
  }

  set statics(data) {}

  plugin(options) {}

  pre(action, callback) {}

  virtual(name) {
    return {
      get(callback) {},
      set(callback) {}
    };
  }

}

Schema.Types = class {
  constructor() {}
};

Schema.Types.ObjectId = class {
  // 替换主键类型
  constructor() {}
};

Schema.Formatter = class {
  constructor() {}
};

Schema.Formatter.Stringify = class {
  // JSON字符串
  constructor() {}
};

exports.default = Schema;