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
      this.$mapping = SchemaUtil.mapping(this.$schema().fields, this.$collection())
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
    let schema = this.$model().$schema()
    let cls = class extends this.$model() {}
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
    return new Query(this.$model(), options)
  }

  static aggregate (options, callback) {
    if (!(options instanceof Array)) {
      options = [].concat(arguments)
      callback = null
    }
    return new Aggregate(options, this.$model()).exec(callback)
  }

  static findByIdAndUpdate (id, update, options, callback) {
    if (Object.keys(update).filter(key => {return key.indexOf('$') === 0}).length === 0 && typeof update !== 'undefined') {
      return this.query().loadById(id).then(doc => {
        doc = (function walk(da, db) {
          for (let key in db) {
            let value = db[key]
            if(Object.prototype.toString.call(value) === '[object Object]') {
              value = walk(da[key], value)
            }
            da[key] = value
          }
          return da
        })(doc, update)
        return doc.save(callback)
      })
    } else {
      return this.findOneAndUpdate({_id: id}, update, options, callback)
    }
  }

  static findOneAndUpdate (conditions, update, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = null
    }
    options = Object.assign({}, options || {}, {multi: false, new: true})
    return this.update(conditions, update, options, callback)
  }

  /**
   * 仅处理第一级节点，暂不支持子级操作
   * 数据操作会破坏数组下标，可能会导致一些奇怪的问题
   */
  static async rebuildArray(ids, doc) {
    let autoIndex = new Date().getTime()
    for (let key in doc) {
      let action = key.toLowerCase(), obj = doc[key], result = null
      let field = Object.keys(obj).shift()
      switch (action) {
        case '$push':
          let data = obj[field], queries = []
          if (Object.keys(data).shift().toLowerCase() === '$each') { // 多值处理
            data = data[Object.keys(data).shift()]
          } else {
            data = [data]
          }
          data.forEach(doc => {
            SchemaUtil.insert(
              this.$schema().fields[field].type, doc,
              SchemaUtil.table(this.$collection(), field),
              SchemaUtil.index(field, autoIndex++)
            ).forEach(query => {
              ids.forEach(id => {
                queries.push({
                  sql: query.sql, data: [id].concat(...query.data.slice(1))
                })
              })
            })
          })
          await mongoose.Promise.all(queries.map(query => {
            return mongoose.connection.query(query.sql, query.data)
          }))
          break
        case '$pull': // 单值和条件
          let conditions = {}, parent = null, tableName = SchemaUtil.table(this.$collection(), field)
          if (Object.prototype.toString.call(obj[field]) === '[object Object]') {
            if (Object.keys(obj[field]).filter(key => {return key.indexOf('$') === 0}).length === 0) {
              for (let f in obj[field]) { // 纯文档方式
                conditions[SchemaUtil.index(field, '$', f)] = obj[field][f]
              }
            } else { // 含操作指令
              conditions = obj[field]
              parent = field
            }
          } else {
            conditions[field] = obj[field]
          }
          let query = this.query().buildWhere(conditions, parent)
          query.where = ['`autoId` in (', [].concat(ids).fill('?').join(', '), ') and (', query.where, ')'].join('')
          query.sql = ['delete from `', tableName, '` where ', query.where].join('')
          query.data = [].concat(ids, query.data)
          return mongoose.connection.query(query.sql, query.data)
      }
      if (result !== null) delete doc[key]
    }
    return doc
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
      }
      // 局部更新模式
      return this.rebuildArray(ids, doc).then(doc => {
        if (Object.keys(doc).length < 1) { // 无待更新数据
          if (options.new) {
            return this.findById(options.multi ? ids : ids.shift(), options.select, callback)
          } else {
            if (callback) return callback(null, ids.length)
            return mongoose.Promise.resolve(ids.length)
          }
        }
        if (Object.keys(doc).filter(key => {return key.indexOf('$') === 0}).length === 0) {
          doc = {'$set': doc} // 增加更新标识
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
        return mongoose.Promise.all(queries).then(result => {
          if (options.new) {
            return this.findById(options.multi ? ids : ids.shift(), options.select, callback)
          } else {
            if (callback) return callback(null, ids.length)
            return mongoose.Promise.resolve(ids.length)
          }
        })
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
    let promise = mongoose.connection.query(query.sql, query.data) // 删除主文档
    queries.forEach(query => { // 删除子文档
      promise = promise.then(result => {
        return new mongoose.Promise((resolve, reject) => {
          mongoose.connection.query(query.sql, query.data).then(() => {
            resolve(result) // 保留主文档执行结果
          }).catch(error => reject(error))
        })
      })
    })
    return promise.then(result => {
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
    let queries = SchemaUtil.insert(this.$schema().fields, doc, this.$collection())
    let query = queries.shift()
    let promise = mongoose.connection.query(query.sql, query.data) // 插入主文档
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
    return promise.then(result => {
      return this.findById(result.insertId, callback)
    })
  }

  static ddl (withDrop) {
    return SchemaUtil.ddl(this.$schema().fields, this.$collection(), withDrop)
  }

  static async rebuildArrays(id, field, datas) {
    if (!id) return null
    let sql = ['delete from `', SchemaUtil.table(this.$collection(), field), '` where `autoId` = ?']
    await mongoose.connection.query(sql.join(''), [id])
    let doc = {[field]: datas}
    let queries = SchemaUtil.insert(this.$schema().fields, doc, this.$collection())
    queries.shift() // 剔除主表写入
    queries.map(query => {
      query.data[0] = id
      return mongoose.connection.query(query.sql, query.data)
    })
    return mongoose.Promise.all(queries)
  }

  static save (doc, callback) {
    doc = doc instanceof Document ? doc : this.new(doc)
    return doc.validate({default: typeof doc._id === 'undefined'}, callback).then(doc => {
      doc.doPre('save') // update 和 insert方法内暂未进行校验
      if (typeof doc._id === 'undefined') return this.insert(doc, callback)
      let data = {}, promises = mongoose.Promise.resolve();
      (function walk (obj, prefix) {
        for (let key in obj) {
          let skey = SchemaUtil.index(prefix, key), value = obj[key]
          if(Object.prototype.toString.call(value) === '[object Object]') {
            walk.bind(this)(value, key)
          } else if (value instanceof Array) {
            if (prefix) {
              // console.log('Model.save():' + key, 'sub document's array save is not supportted')
              continue
            }
            promises = promises.then(() => {return this.rebuildArrays(this._id, key, value)})
          } else {
            if (obj.isModified(key)) Object.assign(data, {[skey]: value})
          }
        }
      }).bind(this)(doc)
      return promises.then(() => {
        return this.update({_id: doc._id}, data, {upsert: true, new: true}, callback)
      })
    })
  }

  // ----------------实例方法开始的地方------------------------
  doPre(method) {
    let pres = this.$schema().pres
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

  async validate(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    options = Object.assign({default: false}, options || {})
    this.doPre('validate')
    let fields = this.$schema().fields
    try {
      for (let field in fields) {
        let item = fields[field]
        if (options.default && typeof item.default != 'undefined' && typeof this[field] === 'undefined') {
          this[field] = item.default
        }
        if (typeof item.required != 'undefined') {
          if (!this[field]) this.deny(this.$name(), field, mongoose.Error.messages.general.required, [
            {regexp: '{PATH}', replacement: field},
            {regexp: '{VALUE}', replacement: this[field]}
          ])
        }
        if (typeof item.min != 'undefined') {
          if (this[field] < item.min) this.deny(this.$name(), field, mongoose.Error.messages.Number.min, [
            {regexp: '{PATH}', replacement: field},
            {regexp: '{VALUE}', replacement: this[field]},
            {regexp: '{MIN}', replacement: item.min}
          ])
        }
        if (typeof item.max != 'undefined') {
          if (this[field] > item.max) this.deny(this.$name(), field, mongoose.Error.messages.Number.max, [
            {regexp: '{PATH}', replacement: field},
            {regexp: '{VALUE}', replacement: this[field]},
            {regexp: '{MAX}', replacement: item.max}
          ])
        }
        if (typeof item.enum != 'undefined') {
          if (item.enum.indexOf(this[field]) === -1) this.deny(this.$name(), field, mongoose.Error.messages.String.enum, [
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
    return this.$model().save(this, callback)
  }

  remove (callback) {
    return this.$model().removeById(this._id)
  }

}

export default Model