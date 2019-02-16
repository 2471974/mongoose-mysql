import SchemaUtil from './util/schema'
// TODO:
class Schema {

  constructor (fields, options) {
    this.fields = SchemaUtil.optimizeObject(fields)
    this.options = options || {}
  }

  get methods() {
    return {}
  }

  set methods(data) {
  }

  get statics() {
    return {}
  }

  set statics(data) {
  }

  plugin (options) {

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
