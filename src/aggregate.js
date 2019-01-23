import mongoose from './index'
/**
 * 仅支持单个集合的聚合操作
 * 1.子文档数组默认按照unwind方式进行查询，忽略查询语句中的unwind指令
 * 2.不支持多个集合的聚合查询，使用lookup指令会抛出异常
 * 3.二次聚合以子查询方式进行，可对调用方式进行适当优化
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
  }

  buildProject (project) {
    let result = []
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
      result.push(value + " as '" + index.replace("'", "") + "'")
    }
    return result
  }

  baseQuery (mapping) {
    let project = []
    for (let index in mapping.mappings) {
      let item = mapping.mappings[index]
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
    let project = this.buildProject(options.$project)
    let sql = ["select ", project.length > 0 ? project.join(', ') : "*", " from "]
    sql.push("(", subquery, ")")
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

  buildGroup (group, subquery, data) {
    if (!group) return {subquery, data}
    let sql = []
    return {sql, data}
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
