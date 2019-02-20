'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schema = require('./util/schema');

var _schema2 = _interopRequireDefault(_schema);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO:
class Schema {

  constructor(fields, options) {
    this.fields = _schema2.default.optimizeObject(fields);
    this.options = options || {};
    this.plugins = [];
    this.methods = {};
    this.statics = {};
    this.virtuals = {};
    this.virtual('id').get(() => {
      return this._id;
    });
  }

  static(name, fn) {
    _index2.default.debug && console.log('Schema.static()', arguments);
    Object.assign(this.statics, { [name]: fn });
    return this;
  }

  method(name, fn) {
    _index2.default.debug && console.log('Schema.method()', arguments);
    Object.assign(this.methods, { [name]: fn });
    return this;
  }

  index(options) {
    _index2.default.debug && console.log('Schema.index()', arguments);
    return this;
  }

  add(obj, prefix) {
    _index2.default.debug && console.log('Schema.add()', arguments);
    Object.assign(this.fields, _schema2.default.optimizeObject(obj));
    return this;
  }

  eachPath(fn) {
    _index2.default.debug && console.log('Schema.eachPath()', arguments);
    Object.keys(this.fields).forEach(key => fn(key, this.fields[key]));
    return this;
  }

  plugin(fn, opts) {
    if (typeof fn !== 'function') {
      throw new Error('First param to `schema.plugin()` must be a function, ' + 'got "' + typeof fn + '"');
    }
    if (opts && opts.deduplicate) {
      for (let i = 0; i < this.plugins.length; ++i) {
        if (this.plugins[i].fn === fn) {
          return this;
        }
      }
    }
    this.plugins.push({ fn: fn, opts: opts });
    fn(this, opts);
    return this;
  }

  pre(action, callback) {}

  virtual(name, options) {
    return this.virtuals[name] = new VirtualType(name, options);
  }

}

class VirtualType {
  constructor(name, options) {
    this.name = name;
    this.options = options;
    this.getter = () => {
      return this[name];
    };
    this.getter = val => {
      this[name] = val;
    };
  }
  get(fn) {
    this.getter = fn;
  }
  set(fn) {
    this.setter = fn;
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