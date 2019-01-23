import mongoose from './index'
/**
 * 仅支持单个集合的一次性聚合操作
 * 1.子文档数组默认按照unwind方式进行查询，忽略查询语句中的unwind指令
 * 2.不支持多个集合的聚合查询，使用lookup指令会抛出异常
 * 3.合并管道进行单次查询，不支持二次聚合（可能与业务预期结果不一致）
 */
class Aggregate {
  constructor (options, model) {
    this.$options = options
    this.$model = model
    this.mapping = model.mapping()
  }

  options () {
    let options = {}
    for (let index in this.$options) {
      options = Object.assign(options[index] || {}, this.$options[index])
    }
    return options
  }

  buildProject (project, mappings) {
    let result = {}
    for (let index in project) {
      let value = project[index]
      if (value === 1) {
        value = index
      } else if (value === 0) {
        continue
      } else if (value.indexOf('$') === 0) {
        value = value.substring(1)
      }
      let mapping = mappings[value]
      Object.assign(result, {[index]: [
        "`", mapping.table, "`.`", mapping.field, "` as '", result.replace("'", ""), "'"
      ].join('')})
    }
    return result
  }

  exec (callback) {
    let options = this.options(), query = this.$model.query()
    let project = this.buildProject(options.$project, this.mapping.mappings)
    let sql = ["select ", Object.keys(project).length > 0 ? Object.values(project) : "*", " from "]
    let tables = Object.keys(this.mapping.tables)
    let table = tables.shift()
    sql.push('`', table, '`')
    tables.forEach(element => {
      sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`')
    })
    let {where, data} = query.buildWhere(options.$match || {})
    where && sql.push(' where ', where)
    let order = query.buildOrder(options.$sort || {})
    order && sql.push(' order by ', order)
    if (options.$limit && options.$limit > 0) {
      sql.push(' limit ')
      options.$skip && options.$skip > -1 && sql.push(options.$skip, ', ')
      sql.push(options.$limit)
    }
    console.log(sql.join(''), data)
    return mongoose.connection.query(sql.join(''), data).then(result => {
      callback && callback(null, result)
      return mongoose.Promise.resolve(result)
    })
  }
}

export default Aggregate
