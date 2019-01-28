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

/**
 * 静态模型
 */
class Model extends _document2.default {

  static mapping() {
    if (!this.$mapping) {
      this.$mapping = _schema2.default.mapping(this.schema().fields, this.collection());
    }
    return this.$mapping;
  }

  static new(doc) {
    return new (this.model())(doc);
  }

  static query() {
    return new _query2.default(this.model());
  }

  static aggregate(options, callback) {
    if (!(options instanceof Array)) {
      options = [].concat(arguments);
      callback = null;
    }
    return new _aggregate2.default(options, this.model()).exec(callback);
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
    return this.query().where(condition).distinct('_id').exec().then(ids => {
      if (ids.length === 0) {
        // 没有匹配记录
        if (options.upsert) {
          // 执行插入
          return this.save(doc, callback);
        } else {
          // 返回受影响条数
          callback && callback(null, ids.length);
          return _index2.default.Promise.resolve(ids.length);
        }
      }
      if (!options.multi) ids = [ids[0]]; // 单记录更新
      if (options.overwrite) {
        // 覆盖模式
        let promise = this.removeById(ids); // 删除原记录
        ids.forEach(id => {
          // 插入新记录
          promise = promise.then(() => {
            this.save(Object.assign({ _id: id }, doc));
          });
        });
        return promise.then(() => {
          // 返回插入记录行数
          callback && callback(null, ids.length);
          return _index2.default.Promise.resolve(ids.length);
        });
      } else {
        // 局部更新模式
        if (Object.keys(doc).filter(key => {
          return key.indexOf('$') === 0;
        }).length === 0) {
          doc = { '$set': doc // 增加更新标识
          };
        }
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
        console.log(sql.join(''));
        queries.push(_index2.default.connection.query(sql.join(''), table.data.concat(ids)));
      }
      return _index2.default.connection.beginTransaction().then(() => {
        // 启用事务
        return _index2.default.Promise.all(queries);
      }).then(result => {
        // 提交事务
        return _index2.default.connection.commit();
      }).catch(error => {
        callback && callback(error);
        _index2.default.connection.rollback(); // 回滚事务
        return _index2.default.Promise.reject(error);
      }).then(result => {
        if (options.new) {
          return this.findById(options.multi ? ids : ids.shift(), options.select, callback);
        } else {
          callback && callback(null, ids.length);
          return _index2.default.Promise.resolve(ids.length);
        }
      });
    }).catch(error => {
      callback && callback(error);
      return _index2.default.Promise.reject(error);
    });
  }

  static remove(condition, callback) {
    return this.query().where(condition).distinct('_id').exec().then(result => {
      if (result.length === 0) {
        callback && callback(null, result.length);
        return _index2.default.Promise.resolve(result.length);
      }
      return this.removeById(result, callback);
    }).catch(error => {
      callback && callback(error);
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
    let promise = _index2.default.connection.beginTransaction().then(() => {
      // 启用事务
      return _index2.default.connection.query(query.sql, query.data); // 删除主文档
    });
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
      // 提交事务
      return new _index2.default.Promise((resolve, reject) => {
        _index2.default.connection.commit().then(() => {
          resolve(result); // 保留主文档执行结果
        }).catch(error => reject(error));
      });
    }).catch(error => {
      callback && callback(error);
      _index2.default.connection.rollback(); // 回滚事务
      return _index2.default.Promise.reject(error);
    }).then(result => {
      callback && callback(null, result.affectedRows);
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
      if (!item) throw 'can not mapping field with name ' + field;
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
    if (typeof fields === 'function') {
      callback = fields;
      fields = null;
    }
    if (Object.prototype.toString.call(id) === '[object Object]') id = id._id;
    let mapping = this.mapping();
    let tableName = Object.keys(mapping.tables)[0]; // 主表
    let tables = this.tables(fields, mapping),
        queries = [],
        ids = id instanceof Array ? id : [id];
    for (let table in tables) {
      let sql = [];
      sql.push('select ', tables[table].columns.map(item => {
        return '`' + item + '`';
      }).join(', '));
      sql.push(' from `', table, '` where ', table === tableName ? '`_id`' : '`autoId`');
      sql.push(' in (', [].concat(ids).fill('?').join(', '), ')');
      if (table !== tableName) sql.push(' order by `autoIndex` asc');
      queries.push(_index2.default.connection.query(sql.join(''), ids));
    }
    return _index2.default.Promise.all(queries).then(results => {
      let data = [];
      ids.forEach(id => {
        let rindex = 0,
            doc = null;
        for (let index in tables) {
          let table = tables[index],
              result = results[rindex++];
          if (index === tableName) {
            // 主文档查询结果
            result = result.filter(item => {
              return id === item._id;
            });
            if (result.length === 0) {
              // 主文档记录不存在
              break;
            } else {
              doc = Object.assign({}, result[0]);
              table.maps.forEach(map => doc = map(doc));
              continue;
            }
          } else {
            result = result.filter(item => {
              return id === item.autoId;
            });
          }
          if (result.length < 1) continue; // 子文档不存在
          result.forEach(item => {
            item = Object.assign({}, item);
            (function extend(data, keyIndex) {
              let key = keyIndex.shift();
              if (keyIndex.length > 0) {
                if (keyIndex.length === 1 && table.isArray) {
                  typeof data[key] === 'undefined' && (data[key] = []);
                }
                if (typeof data[key] !== 'undefined') {
                  extend(data[key], keyIndex);
                }
              } else {
                item._id = _schema2.default.index(item.autoId, item.autoIndex);
                table.maps.forEach(map => item = map(item));
                data[key] = item;
              }
            })(doc, item.autoIndex.split('.'));
          });
        }
        if (doc !== null) data.push(this.new(doc));
      });
      if (!(id instanceof Array)) data = data.length > 0 ? data[0] : data;
      callback && callback(null, data);
      return _index2.default.Promise.resolve(data);
    }).catch(error => {
      callback && callback(error);
      return _index2.default.Promise.reject(error);
    });
  }

  static save(doc, callback) {
    let queries = _schema2.default.insert(this.schema().fields, doc, this.collection());
    let query = queries.shift();
    let promise = _index2.default.connection.beginTransaction().then(() => {
      // 启用事务
      return _index2.default.connection.query(query.sql, query.data); // 插入主文档
    });
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
    promise.then(result => {
      // 提交事务
      return new _index2.default.Promise((resolve, reject) => {
        _index2.default.connection.commit().then(() => {
          resolve(result); // 保留主文档执行结果
        }).catch(error => reject(error));
      });
    }).catch(error => {
      callback && callback(error);
      _index2.default.connection.rollback(); // 回滚事务
      return _index2.default.Promise.reject(error);
    });
    return promise.then(result => {
      return this.findById(result.insertId, callback);
    });
  }

  static ddl(withDrop) {
    return _schema2.default.ddl(this.schema().fields, this.collection(), withDrop);
  }

}

exports.default = Model;