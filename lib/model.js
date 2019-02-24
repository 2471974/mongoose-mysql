'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schema = require('./util/schema');

var _schema2 = _interopRequireDefault(_schema);

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _document = require('./document');

var _document2 = _interopRequireDefault(_document);

var _query = require('./query');

var _query2 = _interopRequireDefault(_query);

var _aggregate = require('./aggregate');

var _aggregate2 = _interopRequireDefault(_aggregate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * 静态模型
 */
class Model extends _document2.default {

  static mapping() {
    if (!this.$mapping) {
      this.$mapping = _schema2.default.mapping(this.$schema().fields, this.$collection());
    }
    return this.$mapping;
  }

  static count(conditions, callback) {
    if (callback) {
      return this.query().where(conditions).count().exec(callback);
    }
    return this.query().where(conditions).count();
  }

  static new(doc) {
    let schema = this.$model().$schema();
    let cls = class extends this.$model() {};
    let instance = new cls(doc);
    let virtuals = Object.assign({}, schema.virtuals);
    for (let key in schema.fields) {
      if (typeof schema.fields[key].set === 'undefined') continue;
      Object.assign(virtuals, { [key]: new VirtualType(key).set(schema.fields[key].set) });
    }
    for (let name in virtuals) {
      let vt = virtuals[name];
      // Proxy可以监听动态属性，暂不需要
      Object.defineProperty(instance, name, {
        get() {
          return vt.getter.bind(this)();
        },
        set(val) {
          return vt.setter.bind(this)(val);
        }
      });
    }
    return instance;
  }

  static find(conditions, projection, options, callback) {
    if (typeof projection === 'function') {
      callback = projection;
      projection = options = null;
    } else if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    let query = this.query();
    conditions && query.where(conditions);
    projection && query.select(projection);
    options && query.options(options);
    return callback ? query.exec(callback) : query;
  }

  static findOne(conditions, projection, options, callback) {
    if (typeof projection === 'function') {
      callback = projection;
      projection = options = null;
    } else if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    options = Object.assign({}, options ? options : {}, { multi: false });
    return this.find(conditions, projection, options, callback);
  }

  static query(options) {
    return new _query2.default(this.$model(), options);
  }

  static aggregate(options, callback) {
    if (!(options instanceof Array)) {
      options = [].concat(arguments);
      callback = null;
    }
    return new _aggregate2.default(options, this.$model()).exec(callback);
  }

  static findByIdAndUpdate(id, update, options, callback) {
    if (Object.keys(update).filter(key => {
      return key.indexOf('$') === 0;
    }).length === 0 && typeof update !== 'undefined') {
      return this.query().loadById(id).then(doc => {
        doc = function walk(da, db) {
          for (let key in db) {
            let value = db[key];
            if (Object.prototype.toString.call(value) === '[object Object]') {
              value = walk(da[key], value);
            }
            da[key] = value;
          }
          return da;
        }(doc, update);
        return doc.save(callback);
      });
    } else {
      return this.findOneAndUpdate({ _id: id }, update, options, callback);
    }
  }

  static findOneAndUpdate(conditions, update, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    options = Object.assign({}, options || {}, { multi: false, new: true });
    return this.update(conditions, update, options, callback);
  }

  /**
   * 仅处理第一级节点，暂不支持子级操作
   * 数据操作会破坏数组下标，可能会导致一些奇怪的问题
   */
  static rebuildArray(ids, doc) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      let autoIndex = new Date().getTime();
      for (let key in doc) {
        let action = key.toLowerCase(),
            obj = doc[key],
            result = null;
        let field = Object.keys(obj).shift();
        switch (action) {
          case '$push':
            let data = obj[field],
                queries = [];
            if (Object.keys(data).shift().toLowerCase() === '$each') {
              // 多值处理
              data = data[Object.keys(data).shift()];
            } else {
              data = [data];
            }
            data.forEach(function (doc) {
              _schema2.default.insert(_this2.$schema().fields[field].type, doc, _schema2.default.table(_this2.$collection(), field), _schema2.default.index(field, autoIndex++)).forEach(function (query) {
                ids.forEach(function (id) {
                  queries.push({
                    sql: query.sql, data: [id].concat(...query.data.slice(1))
                  });
                });
              });
            });
            yield _index2.default.Promise.all(queries.map(function (query) {
              return _index2.default.connection.query(query.sql, query.data);
            }));
            break;
          case '$pull':
            // 单值和条件
            let conditions = {},
                parent = null,
                tableName = _schema2.default.table(_this2.$collection(), field);
            if (Object.prototype.toString.call(obj[field]) === '[object Object]') {
              if (Object.keys(obj[field]).filter(function (key) {
                return key.indexOf('$') === 0;
              }).length === 0) {
                for (let f in obj[field]) {
                  // 纯文档方式
                  conditions[_schema2.default.index(field, '$', f)] = obj[field][f];
                }
              } else {
                // 含操作指令
                conditions = obj[field];
                parent = field;
              }
            } else {
              conditions[field] = obj[field];
            }
            let query = _this2.query().buildWhere(conditions, parent);
            query.where = ['`autoId` in (', [].concat(ids).fill('?').join(', '), ') and (', query.where, ')'].join('');
            query.sql = ['delete from `', tableName, '` where ', query.where].join('');
            query.data = [].concat(ids, query.data);
            return _index2.default.connection.query(query.sql, query.data);
        }
        if (result !== null) delete doc[key];
      }
      return doc;
    })();
  }

  static update(condition, doc, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }
    options = Object.assign({
      upsert: false, // 如果查询记录不存在则直接插入
      multi: false, // 更新全部匹配到的文档
      overwrite: false, // 覆盖模式，默认为局部更新
      new: false, // 返回更新后的文档
      select: null // 返回文档的字段
    }, options || {});
    return this.query().options(options).where(condition).distinct('_id').exec().then(ids => {
      if (!options.multi) ids = ids ? [ids] : []; // 单记录更新，转成数组处理
      if (ids.length === 0) {
        // 没有匹配记录
        if (options.upsert) {
          // 执行插入
          return this.insert(doc, callback);
        } else {
          // 返回受影响条数
          if (callback) return callback(null, ids.length);
          return _index2.default.Promise.resolve(ids.length);
        }
      }
      if (options.overwrite) {
        // 覆盖模式
        let promise = this.removeById(ids); // 删除原记录
        ids.forEach(id => {
          // 插入新记录
          promise = promise.then(() => {
            this.insert(Object.assign({ _id: id }, doc));
          });
        });
        return promise.then(() => {
          // 返回插入记录行数
          if (callback) return callback(null, ids.length);
          return _index2.default.Promise.resolve(ids.length);
        });
      }
      // 局部更新模式
      return this.rebuildArray(ids, doc).then(doc => {
        if (Object.keys(doc).length < 1) {
          // 无待更新数据
          if (options.new) {
            return this.findById(options.multi ? ids : ids.shift(), options.select, callback);
          } else {
            if (callback) return callback(null, ids.length);
            return _index2.default.Promise.resolve(ids.length);
          }
        }
        if (Object.keys(doc).filter(key => {
          return key.indexOf('$') === 0;
        }).length === 0) {
          doc = { '$set': doc // 增加更新标识
          };
        }
        let mapping = this.mapping();
        let queries = [],
            tables = _schema2.default.update(doc, mapping.mappings);
        let tableName = Object.keys(mapping.tables).shift();
        for (let index in mapping.tables) {
          let table = tables[index];
          if (!table) continue;
          let sql = [];
          sql.push('update `', index, '` set ', table.fields.join(', '));
          sql.push(' where ', index === tableName ? '_id' : 'autoId');
          sql.push(' in (', [].concat(ids).fill('?').join(', '), ')');
          queries.push(_index2.default.connection.query(sql.join(''), table.data.concat(ids)));
        }
        return _index2.default.Promise.all(queries).then(result => {
          if (options.new) {
            return this.findById(options.multi ? ids : ids.shift(), options.select, callback);
          } else {
            if (callback) return callback(null, ids.length);
            return _index2.default.Promise.resolve(ids.length);
          }
        });
      });
    }).catch(error => {
      if (callback) return callback(error);
      return _index2.default.Promise.reject(error);
    });
  }

  static remove(condition, callback) {
    return this.query().where(condition).distinct('_id').exec().then(result => {
      if (result.length === 0) {
        if (callback) return callback(null, result.length);
        return _index2.default.Promise.resolve(result.length);
      }
      return this.removeById(result, callback);
    }).catch(error => {
      if (callback) return callback(error);
      return _index2.default.Promise.reject(error);
    });
  }

  static removeById(id, callback) {
    if (Object.prototype.toString.call(id) === '[object Object]') id = id._id;
    let queries = [],
        ids = id instanceof Array ? id : [id];
    let tables = this.mapping().tables;
    let tableName = Object.keys(tables)[0]; // 主表
    for (let table in tables) {
      let sql = [];
      sql.push('delete from `', table, '` where ', table === tableName ? '`_id`' : '`autoId`');
      sql.push(' in (', [].concat(ids).fill('?').join(', '), ')');
      queries.push({ sql: sql.join(''), data: ids });
    }
    let query = queries.shift();
    let promise = _index2.default.connection.query(query.sql, query.data); // 删除主文档
    queries.forEach(query => {
      // 删除子文档
      promise = promise.then(result => {
        return new _index2.default.Promise((resolve, reject) => {
          _index2.default.connection.query(query.sql, query.data).then(() => {
            resolve(result); // 保留主文档执行结果
          }).catch(error => reject(error));
        });
      });
    });
    return promise.then(result => {
      if (callback) return callback(null, result.affectedRows);
      return _index2.default.Promise.resolve(result.affectedRows);
    });
  }

  static tables(fields, mapping) {
    mapping || (mapping = this.mapping());
    if (!fields) return mapping.tables;
    let isExclude = false;
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      let doc = {};
      fields.split(' ').forEach(item => {
        item = item.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        if (item.indexOf('-') === 0) {
          isExclude = true;
          Object.assign(doc, { [item.substring(1)]: -1 });
        } else if (item.indexOf('+') === 0) {
          Object.assign(doc, { [item.substring(1)]: 1 });
        } else if (item !== '') {
          Object.assign(doc, { [item]: 1 });
        }
      });
      fields = doc;
    } else {
      for (let index in fields) {
        if (fields[index] !== -1) continue;
        isExclude = true;
        break;
      }
    }
    if (Object.keys(fields).length === 0) return mapping.tables;
    let tables = [];
    for (let field in fields) {
      let item = mapping.mappings[field];
      if (!item) throw new Error('can not mapping field with name ' + field);
      tables[item.table] || (tables[item.table] = []);
      if (isExclude) {
        if (fields[field] === -1) tables[item.table].push(item.field);
      } else {
        if (fields[field] !== -1) tables[item.table].push(item.field);
      }
    }
    let tableName = Object.keys(mapping.tables)[0]; // 主表
    let result = {};
    for (let index in mapping.tables) {
      if (typeof tables[index] === 'undefined') {
        if (isExclude) Object.assign(result, { [index]: mapping.tables[index] });
        continue;
      }
      let table = mapping.tables[index];
      Object.assign(result, { [index]: {
          columns: table.columns.filter(item => {
            if (isExclude) {
              return tables[index].indexOf(item) === -1;
            } else {
              return tables[index].indexOf(item) !== -1;
            }
          }),
          maps: table.maps,
          isArray: table.isArray
        } });
      if (index === tableName) {
        result[index].columns.indexOf('_id') === -1 && result[index].columns.unshift('_id');
      } else {
        result[index].columns.indexOf('autoIndex') === -1 && result[index].columns.unshift('autoIndex');
        result[index].columns.indexOf('autoId') === -1 && result[index].columns.unshift('autoId');
      }
    }
    return result;
  }

  static findById(id, fields, callback) {
    if (Object.prototype.toString.call(id) === '[object Object]') id = id._id;
    return this.findOne({ _id: id }, fields, null, callback);
  }

  static insert(doc, callback) {
    let queries = _schema2.default.insert(this.$schema().fields, doc, this.$collection());
    let query = queries.shift();
    let promise = _index2.default.connection.query(query.sql, query.data); // 插入主文档
    queries.forEach(query => {
      // 插入子文档
      promise = promise.then(result => {
        return new _index2.default.Promise((resolve, reject) => {
          query.data[0] = result.insertId;
          _index2.default.connection.query(query.sql, query.data).then(() => {
            resolve(result); // 保留主文档执行结果
          }).catch(error => reject(error));
        });
      });
    });
    return promise.then(result => {
      return this.findById(result.insertId, callback);
    });
  }

  static ddl(withDrop) {
    return _schema2.default.ddl(this.$schema().fields, this.$collection(), withDrop);
  }

  static rebuildArrays(id, field, datas) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      if (!id) return null;
      let sql = ['delete from `', _schema2.default.table(_this3.$collection(), field), '` where `autoId` = ?'];
      yield _index2.default.connection.query(sql.join(''), [id]);
      let tables = _this3.mapping().tables;
      let tablePrefix = _schema2.default.table(_this3.$collection(), field, '');
      for (let table in tables) {
        if (table.indexOf(tablePrefix) !== 0) continue;
        yield _index2.default.connection.query(['delete from `', table, '` where `autoId` = ?'].join(''), [id]);
      }
      let doc = { [field]: datas };
      let queries = _schema2.default.insert(_this3.$schema().fields, doc, _this3.$collection());
      queries.shift(); // 剔除主表写入
      queries.map(function (query) {
        query.data[0] = id;
        return _index2.default.connection.query(query.sql, query.data);
      });
      return _index2.default.Promise.all(queries);
    })();
  }

  static save(doc, callback) {
    doc = doc instanceof _document2.default ? doc : this.new(doc);
    return doc.validate({ default: typeof doc._id === 'undefined' }, callback).then(doc => {
      doc.doPre('save'); // update 和 insert方法内暂未进行校验
      if (typeof doc._id === 'undefined') return this.insert(doc, callback);
      let data = {},
          promises = _index2.default.Promise.resolve();
      let tables = this.mapping().tables;
      (function walk(obj, prefix) {
        for (let key in obj) {
          let skey = _schema2.default.index(prefix, key),
              value = obj[key],
              table = tables[_schema2.default.table(this.$collection(), key)];
          if (Object.prototype.toString.call(value) === '[object Object]') {
            walk.bind(this)(value, key);
          } else if (value instanceof Array && table && table.isArray) {
            if (prefix) {
              // console.log('Model.save():' + key, 'sub document's array save is not supportted')
              continue;
            }
            promises = promises.then(() => {
              return this.rebuildArrays(doc._id, key, value);
            });
          } else {
            if (obj.isModified(key)) Object.assign(data, { [skey]: value });
          }
        }
      }).bind(this)(doc);
      return promises.then(() => {
        return this.update({ _id: doc._id }, data, { upsert: true, new: true }, callback);
      });
    });
  }

  // ----------------实例方法开始的地方------------------------
  doPre(method) {
    let pres = this.$schema().pres;
    if (typeof pres[method] === 'undefined') return;
    let index = 0,
        _this = this;
    (function next() {
      if (index >= pres[method].length) return;
      pres[method][index++].bind(_this)(next);
    })(index);
  }

  doPost(method, obj) {
    // 暂不支持
  }

  deny(model, path, message, replaces) {
    replaces.forEach(item => {
      message = message.replace(item.regexp, item.replacement);
    });
    throw new Error('ValidationError: ' + model + ' validation failed: ' + path + ':', message);
  }

  validate(options, callback) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      if (typeof options === 'function') {
        callback = options;
        options = null;
      }
      options = Object.assign({ default: false }, options || {});
      _this4.doPre('validate');
      let fields = _this4.$schema().fields;
      try {
        for (let field in fields) {
          let item = fields[field];
          if (options.default && typeof item.default != 'undefined' && typeof _this4[field] === 'undefined') {
            if (item.default === Date.now) {
              _this4[field] = new Date();
            } else if (typeof item.default === 'function') {
              _this4[field] = item.default();
            } else {
              _this4[field] = item.default;
            }
          }
          if (typeof item.required != 'undefined') {
            if (!_this4[field]) _this4.deny(_this4.$name(), field, _index2.default.Error.messages.general.required, [{ regexp: '{PATH}', replacement: field }, { regexp: '{VALUE}', replacement: _this4[field] }]);
          }
          if (typeof item.min != 'undefined') {
            if (_this4[field] < item.min) _this4.deny(_this4.$name(), field, _index2.default.Error.messages.Number.min, [{ regexp: '{PATH}', replacement: field }, { regexp: '{VALUE}', replacement: _this4[field] }, { regexp: '{MIN}', replacement: item.min }]);
          }
          if (typeof item.max != 'undefined') {
            if (_this4[field] > item.max) _this4.deny(_this4.$name(), field, _index2.default.Error.messages.Number.max, [{ regexp: '{PATH}', replacement: field }, { regexp: '{VALUE}', replacement: _this4[field] }, { regexp: '{MAX}', replacement: item.max }]);
          }
          if (typeof item.enum != 'undefined') {
            if (item.enum.indexOf(_this4[field]) === -1) _this4.deny(_this4.$name(), field, _index2.default.Error.messages.String.enum, [{ regexp: '{PATH}', replacement: field }, { regexp: '{VALUE}', replacement: _this4[field] }]);
          }
        }
        return _this4;
      } catch (e) {
        if (callback) return callback(e);
        throw e;
      }
    })();
  }

  save(callback) {
    return this.$model().save(this, callback);
  }

  remove(callback) {
    return this.$model().removeById(this._id);
  }

}

exports.default = Model;