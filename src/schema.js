class Schema {

  constructor (fields, options) {
    this.fields = fields
    this.options = options || {}
  }

  plugin (params) {

  }

}

Schema.Types = class {
  constructor () {}
}

Schema.Types.ObjectId = class {
  constructor () {}
}

export default Schema
