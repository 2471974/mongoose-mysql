import SchemaUtil from './util/schema'
import mongoose from './index'
// TODO:
class Schema {

  constructor (fields, options) {
    this.fields = SchemaUtil.optimizeObject(fields)
    this.options = options || {}
    this.plugins = []
    this.methods = {}
    this.statics = {}
    this.virtuals = {}
    this.virtual('id').get(function () {return this._id})
  }

  static (name, fn) {
    mongoose.debug && console.log('Schema.static()', arguments)
    Object.assign(this.statics, {[name]: fn})
    return this
  }

  method (name, fn) {
    mongoose.debug && console.log('Schema.method()', arguments)
    Object.assign(this.methods, {[name]: fn})
    return this
  }

  index (options) {
    mongoose.debug && console.log('Schema.index()', arguments)
    return this
  }

  add (obj, prefix) {
    mongoose.debug && console.log('Schema.add()', arguments)
    Object.assign(this.fields, SchemaUtil.optimizeObject(obj))
    return this
  }

  eachPath (fn) {
    mongoose.debug && console.log('Schema.eachPath()', arguments)
    Object.keys(this.fields).forEach(key => fn(key, this.fields[key]))
    return this
  }

  plugin (fn, opts) {
    if (typeof fn !== 'function') {
      throw new Error('First param to `schema.plugin()` must be a function, ' +
        'got "' + (typeof fn) + '"');
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

  pre (action, callback) {

  }

  virtual (name, options) {
    return this.virtuals[name] = new VirtualType(name, options)
  }

}

/**
 * getter和setter的值必须是动态的传统函数，以便通过apply、call、bind改变this指向。
 * 箭头函数的this是静态的，默认绑定在此函数作用域中了，不可更改。
 */
class VirtualType {
  constructor (name, options) {
    this.name = name
    this.options = options
    this.getter = function () {
      return this[name]
    }
    this.setter = function (val) {
      this[name] = val
    }
  }
  get (fn) {
    this.getter = fn
  }
  set (fn) {
    this.setter = fn
  }
}

Schema.Types = class {
  constructor () {}
}

Schema.Types.ObjectId = class { // 替换主键类型
  constructor () {}
}

Schema.Formatter = class {
  constructor () {}
}

Schema.Formatter.Stringify = class { // JSON字符串
  constructor () {}
}

export default Schema
