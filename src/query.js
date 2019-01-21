import SchemaUtil from './util/schema'

class Query {

  constructor (model) {
    this.$model = model
    this.$query = {}
  }

  distinct (field) {
    this.$query.distinct = field
    return this
  }

  select (fields) {
    this.$query.select || (this.$query.select = new Set())
    fields.split(' ').forEach(item => {
      item = item.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
      item && this.$query.select.add(item)
    })
    return this
  }

  where (condition) {
    this.$query.where = condition
    return this
  }

  sort (order) {
    if (Object.prototype.toString.call(order) === '[object Object]') {
      for (let field in order) {
        order[field] = order[field] === 1 ? 1 : -1
      }
    } else {
      if (order.indexof('-') === 0) {
        order = {[order.substr(1)]: -1}
      } else if (order.indexof('+') === 0) {
        order = {[order.substr(1)]: 1}
      } else {
        order = {order: 1}
      }
    }
    this.$query.order = order
    return this
  }

  skip (skip) {
    this.$query.skip = skip
    return this
  }

  limit (limit) {
    this.$query.limit = limit
    return this
  }

  populate (options) {
    this.$query.populate = options
    return this
  }

  count (callback) {
    callback && callback()
  }

  exec (callback) {
    let mapping = SchemaUtil.mapping(this.$model.schema().fields, this.$model.collection())
    callback && callback(mapping)
  }

  cursor () {
    return [][Symbol.iterator]()
  }
}

export default Query
