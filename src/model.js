import SchemaUtil from './util/schema'
import mongoose from './index'
import Document from './document'

/**
 * 静态模型
 */
class Model extends Document {
  static new (doc) {
    return new (this.model())(doc)
  }

  static findById (id, callback) {
    let queries = SchemaUtil.document(this.schema().fields, this.collection())
    let _this = this
    return mongoose.Promise.all(queries.map(query => {
      return mongoose.connection.query(query.sql, [id])
    })).then(results => {
      let doc = null
      for (let index in results) {
        let query = queries[index], result = results[index]
        if (query.keyIndex.length === 0) { // 主文档
          if (result.length < 1) break // 主文档不存在
          doc = Object.assign({}, result[0])
          query.mappings.forEach(mapping => doc = mapping(doc))
          continue
        }
        if (result.length < 1) continue // 子文档不存在
        result.forEach(item => {
          let keyIndex = item.autoIndex
          try {
            keyIndex = keyIndex.split('.').slice(1)
          } catch (e) { // Babel转换异常处理，理论上不会走到这一步
            keyIndex = query.keyIndex
          }
          (function extend(data, keyIndex) {
            let key = keyIndex.shift()
            if (keyIndex.length > 0) {
              if (keyIndex.length === 1 && query.isArray) {
                typeof data[key] === 'undefined' && (data[key] = [])
              }
              if (typeof data[key] !== 'undefined') {
                extend(data[key], keyIndex)
              }
            } else {
              item._id = item.autoId + item.autoIndex
              query.mappings.forEach(mapping => item = mapping(item))
              data[key] = Object.assign({}, item)
            }
          })(doc, keyIndex)
        })
      }
      doc = _this.new(doc)
      callback && callback(null, doc)
      return mongoose.Promise.resolve(doc)
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