import Schema from "./schema";
import SchemaUtil from './util/schema'
import mongoose from './index'

class Model {

  constructor (name, schema) {
    this._name = name
    this._schema = schema instanceof Schema ? schema : new Schema(schema, {
      collection: name
    })
  }

  name () {
    return this._name
  }

  schema () {
    return this._schema
  }

  table () {
    return this.schema().options.collection
  }

  column () {
    return this.schema().fields
  }

  findById (id, callback) {
    let queries = SchemaUtil.document(this.column(), this.table())
    return mongoose.Promise.all(queries.map(query => {
      return mongoose.connection.query(query.sql, [id])
    })).then(results => {
      console.log(results)
      let data = null
      for (let index in results) {
        let query = queries[index], result = results[index]
        if (query.keyIndex.length === 0) { // 主文档
          // TODO:数据不存在的情况
        }
      }
      callback && callback(null, data)
      return mongoose.Promise.resolve(data)
    }).catch(error => {
      callback && callback(error)
      return mongoose.Promise.reject(error)
    })
  }

  save (callback) {
    let queries = SchemaUtil.insert(this.column(), this, this.table())
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

  ddl (withDrop) {
    return SchemaUtil.ddl(this.table(), this.column(), withDrop)
  }

}

export default Model