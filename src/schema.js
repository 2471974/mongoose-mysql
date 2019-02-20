import SchemaUtil from './util/schema'
import mongoose from './index'
// TODO:
class Schema {

  constructor (fields, options) {
    this.fields = SchemaUtil.optimizeObject(fields)
    this.options = options || {}
    this.plugins = []
    let _this = this
    this.methods = new Proxy({}, {
      set (obj, prop, value) {
        mongoose.debug && console.log('Schema.methods.set()', arguments)
        return _this.method(prop, value)
      }
    })
    this.statics = new Proxy({}, {
      set (obj, prop, value) {
        mongoose.debug && console.log('Schema.statics.set()', arguments)
        return _this.static(prop, value)
      }
    })
  }

  static (name, fn) {
    mongoose.debug && console.log('Schema.static()', arguments)
    Schema[name] = fn
    return this
  }

  method (name, fn) {
    mongoose.debug && console.log('Schema.method()', arguments)
    this[name] = fn
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

  virtual (name) {
    return {
      get (callback) {

      },
      set (callback) {

      }
    }
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
