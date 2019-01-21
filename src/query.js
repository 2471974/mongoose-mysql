import mongoose from './index'

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
    this.mapping = model.mapping()
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

  buildWhere (condition, parent) {
    if (Object.keys(condition).length === 0) return {where: null, data: []}
    let where = [], data = []
    for (let key in condition) {
      let value = condition[key]
      if (Object.prototype.toString.call(value) === '[object Object]') {
        let result = this.buildWhere(value, key)
        if (!result.where) continue
        where.push('(' + result.where + ')')
        data.push(...result.data)
        continue
      }
      let lkey = key.toLowerCase()
      switch (lkey) {
        case '$in':
          where.push(this.mapField(parent) + ' in (' + [].concat(value).fill('?').join(', ') + ')')
          data.push(...value)
          break
        case '$exists':
          where.push(this.mapField(parent) +  (value ? ' is not null' : ' is null'))
          break
        case '$ne':
          where.push(this.mapField(parent) + ' != ?')
          data.push(value)
          break
        case '$gte':
          where.push(this.mapField(parent) + ' >= ?')
          data.push(value)
          break
        case '$gt':
          where.push(this.mapField(parent) + ' > ?')
          data.push(value)
          break
        case '$lte':
          where.push(this.mapField(parent) + ' <= ?')
          data.push(value)
          break
        case '$lt':
          where.push(this.mapField(parent) + ' < ?')
          data.push(value)
          break
        case '$and':
        case '$or':
          let children = []
          value.forEach(element => {
            let result = this.buildWhere(element, key)
            if (!result.where) return
            children.push(result.where)
            data.push(...result.data)
          })
          children.length > 0 && where.push('(' + children.join(key === '$and' ? ' and ' : ' or ') + ')')
          break
        default:
          where.push(this.mapField(key) + ' = ?')
          data.push(value)
      }
    }
    return {where: where.join(' and '), data}
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
      sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`')
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
    return mongoose.connection.query(sql.join(''), data).then(result => {
      console.log(sql.join(''), result)
    })
  }

  cursor () {
    return [][Symbol.iterator]()
  }
}

export default Query
