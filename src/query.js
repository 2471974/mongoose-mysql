import SchemaUtil from './util/schema'

class Query {

  constructor (model) {
    this.$model = model
    this.$query = {
      distinct: '_id',
      select: [],
      where: {},
      sort: {},
      skip: -1,
      limit: -1,
      populate: {}
    }
    this.mapping = SchemaUtil.mapping(this.$model.schema().fields, this.$model.collection())
  }

  distinct (field) {
    this.$query.distinct = field
    return this
  }

  select (fields) {
    this.$query.select.push(...fields.split(' ').map(item => {return item.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')}))
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

  buildWhere (condition) {
    return {where: null, data: []}
  }

  buildOrder (order) {
    if (Object.keys(order).length === 0) return null
    let orders = []
    for (let field in order) {
      orders.push(this.mapField(field) + ' ' + (order[field] === -1 ? 'desc' : 'asc'))
    }
    return orders.join(', ')
  }

  mapField (field) {
    let mapping = this.mapping.mappings[field]
    if (!mapping) throw field + ' can not be mapped'
    return ['`', mapping.table, '`.`', mapping.field, '`'].join('')
  }

  exec (callback) {
    let sql = []
    sql.push('select distinct ',  this.mapField(this.$query.distinct), ' from ')
    let tables = Object.keys(this.mapping.columns)
    let table = tables.shift()
    sql.push('`', table, '`')
    tables.forEach(element => {
      sql.push(' left join `', element, '` on `', element, '`.`_id` = `', table, '`.`_id`')
    })
    let {where, data} = this.buildWhere(this.$query.where)
    where && sql.push(' where ', where)
    let order = this.buildOrder(this.$query.order)
    order && sql.push(' order by ', order)
    if (this.$query.limit > 0) {
      sql.push(' limit ')
      this.$query.skip > -1 && sql.push(this.$query.skip, ', ')
      sql.push(this.$query.limit)
    }
    callback && callback(sql.join(''), data)
  }

  cursor () {
    return [][Symbol.iterator]()
  }
}

export default Query
