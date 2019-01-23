import mongoose from './index'
/**
 * 子文档数组默认按照unwind方式进行查询，忽略查询语句中的unwind指令
 */
class Aggregate {
  constructor (options, model) {
    this.options = options
    this.$model = model
    this.mapping = model.mapping()
    let query = model.query()
    this.$query = {
      buildWhere: query.buildWhere,
      buildOrder: query.buildOrder,
      mapField (field) {return '`' + field + '`'}
    }
    this.$tableIndex = 0
  }

  tableName () {
    return 't_' + ++this.$tableIndex
  }

  buildProject (project, prefix) {
    let result = {}
    if (!project) return result
    for (let index in project) {
      let value = project[index]
      if (Object.prototype.toString.call(value) === '[object Object]') {
        let fn = Object.keys(value)[0].toUpperCase()
        value = Object.values(value)[0].substring(1)
        switch (fn) {
          case '$DAYOFWEEK':value = 'DAYOFWEEK(`' + value + '`)';break;
          case '$WEEKDAY':value = 'WEEKDAY(`' + value + '`)';break;
          case '$DAYOFMONTH':value = 'DAYOFMONTH(`' + value + '`)';break;
          case '$DAYOFYEAR':value = 'DAYOFYEAR(`' + value + '`)';break;
          case '$MONTH':value = 'MONTH(`' + value + '`)';break;
          case '$QUARTER':value = 'QUARTER(`' + value + '`)';break;
          case '$WEEK':value = 'WEEK(`' + value + '`)';break;
          case '$YEAR':value = 'YEAR(`' + value + '`)';break;
          case '$HOUR':value = 'HOUR(`' + value + '`)';break;
          case '$MINUTE':value = 'MINUTE(`' + value + '`)';break;
          case '$SECOND':value = 'SECOND(`' + value + '`)';break;
          default:
            throw 'unsupported convert function ' + fn + ' on field ' + index
        }
      } else if (value === 1) {
        value = '`' + index + '`'
      } else if (value === 0) {
        continue
      } else if (value.indexOf('$') === 0) {
        value = '`' + value.substring(1) + '`'
      }
      prefix && (index = prefix + '.' + index)
      Object.assign(result, {[index]: value + " as '" + index.replace("'", "") + "'"})
    }
    return result
  }

  baseQuery (mapping, prefix) {
    let project = []
    for (let index in mapping.mappings) {
      let item = mapping.mappings[index]
      prefix && (index = prefix + '.' + index)
      project.push(["`", item.table, "`.`", item.field, "` as '", index.replace("'", ""), "'"].join(''))
    }
    let sql = ["select ", project.join(', '), " from "]
    let tables = Object.keys(mapping.tables)
    let table = tables.shift()
    sql.push('`', table, '`')
    tables.forEach(element => {
      sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`')
    })
    return sql.join('')
  }

  buildQuery (options, subquery, data) {
    subquery = this.buildLookup(options.$lookup, subquery)
    let project = this.buildProject(options.$project)
    let sql = ["select ", Object.keys(project).length > 0 ? Object.values(project).join(', ') : "*"]
    sql.push( " from (", subquery, ") as `", this.tableName(), "`")
    let result = this.$query.buildWhere(options.$match || {})
    result.where && sql.push(' where ', result.where)
    data.push(...result.data)
    let order = this.$query.buildOrder(options.$sort || {})
    order && sql.push(' order by ', order)
    if (options.$limit && options.$limit > 0) {
      sql.push(' limit ')
      options.$skip && options.$skip > -1 && sql.push(options.$skip, ', ')
      sql.push(options.$limit)
    }
    return this.buildGroup(options.$group, sql.join(''), data)
  }

  /**
   * 构造功能函数的判断条件，与buildWhere的格式相反
   */
  buildCondition (condition) {
    if (Object.keys(condition).length === 0) return {where: null, data: []}
    let where = [], data = []
    for (let key in condition) {
      let value = condition[key]
      let lkey = key.toLowerCase()
      switch (lkey) {
        case '$ne':
          where.push('`' + value[0].substring(1) + '` != ?')
          data.push(value[1])
          break
        case '$gte':
          where.push('`' + value[0].substring(1) + '` >= ?')
          data.push(value[1])
          break
        case '$gt':
          where.push('`' + value[0].substring(1) + '` > ?')
          data.push(value[1])
          break
        case '$lte':
          where.push('`' + value[0].substring(1) + '` <= ?')
          data.push(value[1])
          break
        case '$lt':
          where.push('`' + value[0].substring(1) + '` < ?')
          data.push(value[1])
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
          if (value instanceof RegExp) {
            where.push(this.mapField(key) + ' like ?')
            data.push('%' + value.toString() + '%')
          } else {
            where.push(this.mapField(key) + ' = ?')
            data.push(value)
          }
      }
    }
    return {where: where.join(' and '), data}
  }

  buildGroup (group, subquery, data) {
    if (!group) return {sql: subquery, data}
    let sql = [], project = this.buildProject(group._id, '_id')
    let groupKeys = Object.keys(project)
    for (let key in group) {
      if (key === '_id') continue
      let value = group[key]
      let fn = Object.keys(value)[0].toLowerCase()
      value = Object.values(value)[0]
      switch (fn) {
        case '$sum':
        case '$max':
        case '$min':
        case '$avg':
          let fnName = fn.substring(1)
          if (Object.prototype.toString.call(value) === '[object Object]') { // 功能
            fn = Object.keys(value)[0].toLowerCase()
            value = Object.values(value)[0]
            switch (fn) {
              case '$add':
                value = fnName + '(' + value.map(item => {
                  return item.toString().indexOf('$') === 0 ? ('`' + item.substring(1) + '`') : item
                }).join('+') + ')'
                break
              case '$cond':
                let result = this.buildCondition(value[0])
                value = fnName + '(if(' + result.where + ', ' + value[1] + ', ' + value[2] + '))'
                break
              default:throw 'unsupported group sub function ' + fn + ' on field ' + key
            }
          } else if(value.toString().indexOf('$') === 0) { // 字段
            value = fnName + '(`' + value.substring(1) + '`)'
          } else { // 数值
            value = fnName + '(' + value + ')'
          }
          break;
        case '$first': // MySQL always return the first record in grouping
          value = '`' + value.substring(1) + '`'
          break
        default:throw 'unsupported group function ' + fn + ' on field ' + key
      }
      Object.assign(project, {[key]: value + " as '" + key.replace("'", "") + "'"})
    }
    sql.push('select ', Object.keys(project).length > 0 ? Object.values(project).join(', ') : '*')
    sql.push(' from (', subquery, ') as `', this.tableName(), '`')
    if (groupKeys.length > 0) {
      sql.push(' group by ', groupKeys.map(key => {return '`' + key + '`'}).join(', '))
    }
    return {sql: sql.join(''), data}
  }

  buildLookup(lookup, subquery) {
    if (!lookup) return subquery
    let model = mongoose.modelByCollection(lookup.from)
    let ta = this.tableName(), tb = this.tableName()
    let sql = ['select * from (', subquery, ') as `', ta, '` left join (']
    sql.push(this.baseQuery(model.mapping(), lookup.as), ') as `', tb, '` on ')
    sql.push('`', ta, '`.`', lookup.localField, '` = `', tb, '`.`', lookup.as, '.', lookup.foreignField, '`')
    return sql.join('')
  }

  exec (callback) {
    let sql = this.baseQuery(this.mapping), data = []
    this.options.forEach(option => {
      let result = this.buildQuery(option, sql, data)
      sql = result.sql
      data = result.data
    })
    console.log(sql, data)
    return mongoose.connection.query(sql, data).then(result => {
      callback && callback(null, result)
      return mongoose.Promise.resolve(result)
    })
  }
}

export default Aggregate
