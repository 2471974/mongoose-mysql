import SchemaUtil from './util/schema'
import mongoose from './index'
import Document from './document'
import Query from './query'
import Aggregate from './aggregate'

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

  static count (conditions, callback) {
    if (callback) {
      return this.query().where(conditions).count().exec(callback)
    }
    return this.query().where(conditions).count()
  }

  static new (doc) {
    let schema = this.model().schema()
    let cls = class extends this.model() {}
    let instance = new cls(doc)
    let virtuals = Object.assign({}, schema.virtuals)
    for (let key in schema.fields) {
      if (typeof schema.fields[key].set === 'undefined') continue
      Object.assign(virtuals, {[key]: new VirtualType(key).set(schema.fields[key].set)})
    }
    for (let name in virtuals) {
      let vt = virtuals[name]
      // Proxy可以监听动态属性，暂不需要
      Object.defineProperty(instance, name, {
        get () {
          return vt.getter.bind(this)()
        },
        set (val) {
          return vt.setter.bind(this)(val)
        }
      })
    }
    return instance
  }

  static find (conditions, projection, options, callback) {
    if (typeof projection === 'function') {
      callback = projection
      projection = options = null
    } else if (typeof options === 'function') {
      callback = options
      options = null
    }
    let query = this.query()
    conditions && query.where(conditions)
    projection && query.select(projection)
    options && query.options(options)
    return callback ? query.exec(callback) : query
  }

  static findOne (conditions, projection, options, callback) {
    if (typeof projection === 'function') {
      callback = projection
      projection = options = null
    } else if (typeof options === 'function') {
      callback = options
      options = null
    }
    options = Object.assign({}, options ? options : {}, {multi: false})
    return this.find(conditions, projection, options, callback)
  }

  static query (options) {
    return new Query(this.model(), options)
  }

  static aggregate (options, callback) {
    if (!(options instanceof Array)) {
      options = [].concat(arguments)
      callback = null
    }
    return new Aggregate(options, this.model()).exec(callback)
  }

  static findByIdAndUpdate (id, update, options, callback) {
    return this.findOneAndUpdate({_id: id}, update, options, callback)
  }

  static findOneAndUpdate (conditions, update, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = null
    }
    options = Object.assign({}, options || {}, {multi: false, new: true})
    return this.update(conditions, update, options, callback)
  }

  static update (condition, doc, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = null
    }
    options = Object.assign({
      upsert: false, // 如果查询记录不存在则直接插入
      multi: false, // 更新全部匹配到的文档
      overwrite: false, // 覆盖模式，默认为局部更新
      new: false, // 返回更新后的文档
      select: null // 返回文档的字段
    }, options || {})
    return this.query().options(options).where(condition).distinct('_id').exec().then(ids => {
      if (!options.multi) ids = ids ? [ids] : [] // 单记录更新，转成数组处理
      if (ids.length === 0) { // 没有匹配记录
        if (options.upsert) { // 执行插入
          return this.insert(doc, callback)
        } else { // 返回受影响条数
          if (callback) return callback(null, ids.length)
          return mongoose.Promise.resolve(ids.length)
        }
      }
      if (options.overwrite) { // 覆盖模式
        let promise = this.removeById(ids) // 删除原记录
        ids.forEach(id => { // 插入新记录
          promise = promise.then(() => {this.insert(Object.assign({_id: id}, doc))})
        })
        return promise.then(() => { // 返回插入记录行数
          if (callback) return callback(null, ids.length)
          return mongoose.Promise.resolve(ids.length)
        })
      } else { // 局部更新模式
        if (Object.keys(doc).filter(key => {return key.indexOf('$') === 0}).length === 0) {
          doc = {'$set': doc} // 增加更新标识
        }
      }
      let mapping = this.mapping()
      let queries = [], tables = SchemaUtil.update(doc, mapping.mappings)
      let tableName = Object.keys(mapping.tables).shift()
      for (let index in mapping.tables) {
        let table = tables[index]
        if (!table) continue
        let sql = []
        sql.push('update `', index, '` set ', table.fields.join(', '))
        sql.push(' where ', index === tableName ? '_id' : 'autoId')
        sql.push(' in (', [].concat(ids).fill('?').join(', '), ')')
        queries.push(mongoose.connection.query(sql.join(''), table.data.concat(ids)))
      }
      return mongoose.connection.beginTransaction().then(() => { // 启用事务
        return mongoose.Promise.all(queries)
      }).then(result => { // 提交事务
        return mongoose.connection.commit()
      }).catch(error => {
        if (callback) return callback(error)
        mongoose.connection.rollback() // 回滚事务
        return mongoose.Promise.reject(error)
      }).then(result => {
        if (options.new) {
          return this.findById(options.multi ? ids : ids.shift(), options.select, callback)
        } else {
          if (callback) return callback(null, ids.length)
          return mongoose.Promise.resolve(ids.length)
        }
      })
    }).catch(error => {
      if (callback) return callback(error)
      return mongoose.Promise.reject(error)
    })
  }

  static remove(condition, callback) {
    return this.query().where(condition).distinct('_id').exec().then(result => {
      if (result.length === 0) {
        if (callback) return callback(null, result.length)
        return mongoose.Promise.resolve(result.length)
      }
      return this.removeById(result, callback)
    }).catch(error => {
      if (callback) return callback(error)
      return mongoose.Promise.reject(error)
    })
  }

  static removeById (id, callback) {
    if (Object.prototype.toString.call(id) === '[object Object]') id = id._id
    let queries = [], ids = id instanceof Array ? id : [id]
    let tables = this.mapping().tables
    let tableName = Object.keys(tables)[0] // 主表
    for (let table in tables) {
      let sql = []
      sql.push('delete from `', table, '` where ', table === tableName ? '`_id`' : '`autoId`')
      sql.push(' in (', [].concat(ids).fill('?').join(', '), ')')
      queries.push({sql: sql.join(''), data: ids})
    }
    let query = queries.shift()
    let promise = mongoose.connection.beginTransaction().then(() => { // 启用事务
      return mongoose.connection.query(query.sql, query.data) // 删除主文档
    })
    queries.forEach(query => { // 删除子文档
      promise = promise.then(result => {
        return new mongoose.Promise((resolve, reject) => {
          mongoose.connection.query(query.sql, query.data).then(() => {
            resolve(result) // 保留主文档执行结果
          }).catch(error => reject(error))
        })
      })
    })
    return promise.then(result => { // 提交事务
      return new mongoose.Promise((resolve, reject) => {
        mongoose.connection.commit().then(() => {
          resolve(result) // 保留主文档执行结果
        }).catch(error => reject(error))
      })
    }).catch(error => {
      if (callback) return callback(error)
      mongoose.connection.rollback() // 回滚事务
      return mongoose.Promise.reject(error)
    }).then(result => {
      if (callback) return callback(null, result.affectedRows)
      return mongoose.Promise.resolve(result.affectedRows)
    })
  }

  static tables(fields, mapping) {
    mapping || (mapping = this.mapping())
    if (!fields) return mapping.tables
    let isExclude = false
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      let doc = {}
      fields.split(' ').forEach(item => {
        item = item.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
        if (item.indexOf('-') === 0) {
          isExclude = true
          Object.assign(doc, {[item.substring(1)]: -1})
        } else if (item.indexOf('+') === 0) {
          Object.assign(doc, {[item.substring(1)]: 1})
        } else if(item !== '') {
          Object.assign(doc, {[item]: 1})
        }
      })
      fields = doc
    } else {
      for (let index in fields) {
        if (fields[index] !== -1) continue
        isExclude = true
        break 
      }
    }
    if (Object.keys(fields).length === 0) return mapping.tables
    let tables = []
    for (let field in fields) {
      let item = mapping.mappings[field]
      if (!item) throw new Error('can not mapping field with name ' + field)
      tables[item.table] || (tables[item.table] = [])
      if (isExclude) {
        if (fields[field] === -1) tables[item.table].push(item.field)
      } else {
        if (fields[field] !== -1) tables[item.table].push(item.field)
      }
    }
    let tableName = Object.keys(mapping.tables)[0] // 主表
    let result = {}
    for (let index in mapping.tables) {
      if (typeof tables[index] === 'undefined') {
        if (isExclude) Object.assign(result, {[index]: mapping.tables[index]})
        continue
      }
      let table = mapping.tables[index]
      Object.assign(result, {[index]: {
        columns: table.columns.filter(item => {
          if (isExclude) {
            return tables[index].indexOf(item) === -1
          } else {
            return tables[index].indexOf(item) !== -1
          }
        }),
        maps: table.maps,
        isArray: table.isArray
      }})
      if (index === tableName) {
        result[index].columns.indexOf('_id') === -1 && result[index].columns.unshift('_id')
      } else {
        result[index].columns.indexOf('autoIndex') === -1 && result[index].columns.unshift('autoIndex')
        result[index].columns.indexOf('autoId') === -1 && result[index].columns.unshift('autoId')
      }
    }
    return result
  }

  static findById (id, fields, callback) {
    if (Object.prototype.toString.call(id) === '[object Object]') id = id._id
    return this.findOne({_id: id}, fields, null, callback)
  }

  static insert (doc, callback) {
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
      if (callback) return callback(error)
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

  static save (doc, callback) {
    doc = doc instanceof Document ? doc : this.new(doc)
    return doc.validate(null, callback).then(doc => {
      doc.doPre('save') // update 和 insert方法内暂未进行校验
      if (typeof doc._id === 'undefined') return this.insert(doc, callback)
      let data = {}
      for (let key in doc) {
        if (doc.isModified(key)) Object.assign(data, {[key]: doc[key]})
      }
      return this.update({_id: doc._id}, data, {upsert: true, new: true}, callback)
    })
  }

  // ----------------实例方法开始的地方------------------------
  doPre(method) {
    let pres = this.schema().pres
    if (typeof pres[method] === 'undefined') return
    let index = 0, _this = this;
    (function next () {
      if (index >= pres[method].length) return
      pres[method][index++].bind(_this)(next)
    })(index)
  }

  doPost(method, obj) {
    // 暂不支持
  }

  deny (model, path, message, replaces) {
    replaces.forEach(item => {message = message.replace(item.regexp, item.replacement)})
    throw new Error('ValidationError: ' + model + ' validation failed: ' + path + ':', message)
  }

  async validate(optional, callback) {
    this.doPre('validate')
    let fields = this.schema().fields
    try {
      for (let field in fields) {
        let item = fields[field]
        if (typeof item.required != 'undefined') {
          if (!this[field]) this.deny(this.name(), field, mongoose.Error.messages.general.required, [
            {regexp: '{PATH}', replacement: field},
            {regexp: '{VALUE}', replacement: this[field]}
          ])
        }
        if (typeof item.min != 'undefined') {
          if (this[field] < item.min) this.deny(this.name(), field, mongoose.Error.messages.Number.min, [
            {regexp: '{PATH}', replacement: field},
            {regexp: '{VALUE}', replacement: this[field]},
            {regexp: '{MIN}', replacement: item.min}
          ])
        }
        if (typeof item.max != 'undefined') {
          if (this[field] > item.max) this.deny(this.name(), field, mongoose.Error.messages.Number.max, [
            {regexp: '{PATH}', replacement: field},
            {regexp: '{VALUE}', replacement: this[field]},
            {regexp: '{MAX}', replacement: item.max}
          ])
        }
        if (typeof item.enum != 'undefined') {
          if (item.enum.indexOf(this[field]) === -1) this.deny(this.name(), field, mongoose.Error.messages.String.enum, [
            {regexp: '{PATH}', replacement: field},
            {regexp: '{VALUE}', replacement: this[field]}
          ])
        }
      }
      return this
    } catch (e) {
      if (callback) return callback(e)
      throw e
    }
  }

  save (callback) {
    return this.model().save(this, callback)
  }

  remove (callback) {
    return this.model().removeById(this._id)
  }

}

export default Model