import SchemaUtil from './util/schema'

class Schema {

  constructor (fields, options) {
    this.fields = SchemaUtil.optimize(fields)
    this.options = options || {}
  }

  plugin (params) {

  }

}

Schema.Types = class {
  constructor () {}
}

Schema.Types.ObjectId = class { // 替换主键类型
  constructor () {}
}

Schema.Formatters = class {
  constructor () {}
}

Schema.Formatters.Stringify = class { // JSON字符串
  constructor () {}
}

export default Schema
