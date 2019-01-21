import SchemaUtil from './util/schema'
import mongoose from './index'
import Document from './document'
import Query from './query'

/**
 * 静态模型
 */
class Model extends Document {

  static mapping() {
    if (!this.$mapping) {
      this.$mapping = SchemaUtil.mapping(this.schema().fields, this.collection())
    }
    return this.$mapping
  }

  static new (doc) {
    return new (this.model())(doc)
  }

  static query () {
    return new Query(this.model())
  }

  static findById (id, fields, callback) {
    if (typeof fields === 'function') {
      callback = fields
      fields = null
    }
    if (Object.prototype.toString.call(id) === '[object Object]') id = id._id
    let mapping = this.mapping()
    let tableName = Object.keys(mapping.tables)[0] // 主表
    let selectFields = {} // 自定义查询字段
    Array.from(new Set(fields ? fields : [])).map(item => {return mapping.mappings[item]}).forEach(item => {
      selectFields[item.table] || (selectFields[item.table] = [])
      selectFields[item.table].push(item.field)
    })
    let tables = {} // 带查询数据表
    if (Object.keys(selectFields).length === 0) {
      tables = Object.assign({}, mapping.tables)
    } else {
      for (let index in mapping.tables) {
        if (typeof selectFields[index] === 'undefined') continue
        if (index === tableName) {
          selectFields[index].indexOf('_id') === -1 && selectFields[index].unshift('_id')
        } else {
          selectFields[index].indexOf('autoIndex') === -1 && selectFields[index].unshift('autoIndex')
          selectFields[index].indexOf('autoId') === -1 && selectFields[index].unshift('autoId')
        }
        let table = mapping.tables[index]
        Object.assign(tables, {[index]: {
          columns: table.columns.filter(item => {return selectFields[index].indexOf(item) !== -1}),
          maps: table.maps,
          isArray: table.isArray
        }})
      }
    }
    let queries = [], ids = id instanceof Array ? id : [id]
    for (let table in tables) {
      let sql = []
      sql.push('select ', tables[table].columns.map(item => {return '`' + item + '`'}).join(', '))
      sql.push(' from `', table, '` where ', table === tableName ? '`_id`' : '`autoId`')
      sql.push(' in (', [].concat(ids).fill('?').join(', '), ')')
      if (table !== tableName) sql.push(' order by `autoIndex` asc')
      queries.push(mongoose.connection.query(sql.join(''), ids))
    }
    return mongoose.Promise.all(queries).then(results => {
      let data = []
      ids.forEach(id => {
        let rindex = 0, doc = null
        for (let index in tables) {
          let table = tables[index], result = results[rindex++]
          if (index === tableName) { // 主文档查询结果
            result = result.filter(item => {return id === item._id})
            if (result.length === 0) { // 主文档记录不存在
              break
            } else {
              doc = Object.assign({}, result[0])
              table.maps.forEach(map => doc = map(doc))
              continue
            }
          } else {
            result = result.filter(item => {return id === item.autoId})
          }
          if (result.length < 1) continue // 子文档不存在
          result.forEach(item => {
            item = Object.assign({}, item);
            (function extend(data, keyIndex) {
              let key = keyIndex.shift()
              if (keyIndex.length > 0) {
                if (keyIndex.length === 1 && table.isArray) {
                  typeof data[key] === 'undefined' && (data[key] = [])
                }
                if (typeof data[key] !== 'undefined') {
                  extend(data[key], keyIndex)
                }
              } else {
                item._id = SchemaUtil.index(item.autoId, item.autoIndex)
                table.maps.forEach(map => item = map(item))
                data[key] = item
              }
            })(doc, item.autoIndex.split('.'))
          })
        }
        if (doc !== null) data.push(this.new(doc))
      })
      if (!(id instanceof Array)) data = data.length > 0 ? data[0] : data
      callback && callback(null, data)
      return mongoose.Promise.resolve(data)
    }).catch(error => {
      callback && callback(error)
      return mongoose.Promise.reject(error)
    })
  }

  static save (doc, callback) {
    let queries = SchemaUtil.insert(this.schema().fields, doc, this.collection())
    let query = queries.shift()
    let promise = mongoose.connection.beginTransaction().then(() => { // 启用事务
      return mongoose.connection.query(query.sql, query.data) // 插入主文档
    })
    queries.forEach(query => { // 插入子文档
      promise = promise.then(result => {
        return new mongoose.Promise((resolve, reject) => {
          query.data[0] = result.insertId
          mongoose.connection.query(query.sql, query.data).then(() => {
            resolve(result) // 保留主文档执行结果
          }).catch(error => reject(error))
        })
      })
    })
    promise.then(result => { // 提交事务
      return new mongoose.Promise((resolve, reject) => {
        mongoose.connection.commit().then(() => {
          resolve(result) // 保留主文档执行结果
        }).catch(error => reject(error))
      })
    }).catch(error => {
      callback && callback(error)
      mongoose.connection.rollback() // 回滚事务
      return mongoose.Promise.reject(error)
    })
    return promise.then(result => {
      return this.findById(result.insertId, callback)
    })
  }

  static ddl (withDrop) {
    return SchemaUtil.ddl(this.schema().fields, this.collection(), withDrop)
  }

}

export default Model