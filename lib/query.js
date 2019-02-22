'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

var _schema = require('./util/schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class Query {

  constructor(model, options) {
    this.$model = model;
    this.$query = {
      lean: true, // 是否返回Document对象
      count: null,
      distinct: null,
      select: null,
      where: {},
      order: {},
      skip: -1,
      limit: -1,
      populate: []
    };
    this.options(options);
    this.mapping = model.mapping();
  }

  options(opts) {
    this.$options = Object.assign({ multi: true, debug: false }, opts || {});
    return this;
  }

  /**
   * yield和await会调用实例的then方法，不需要手动执行exec方法
   * @see(https://github.com/Automattic/mongoose/issues/2297)
   */
  then(resolve, reject) {
    this.exec().then(resolve, reject);
  }

  distinct(field) {
    this.$query.distinct = field;
    return this;
  }

  select(fields) {
    this.$query.select = fields;
    return this;
  }

  where(condition) {
    this.$query.where = condition;
    return this;
  }

  sort(order) {
    if (Object.prototype.toString.call(order) === '[object Object]') {
      for (let field in order) {
        order[field] = order[field] === 1 ? 1 : -1;
      }
    } else {
      if (order.indexOf('-') === 0) {
        order = { [order.substr(1)]: -1 };
      } else if (order.indexOf('+') === 0) {
        order = { [order.substr(1)]: 1 };
      } else {
        order = { [order]: 1 };
      }
    }
    this.$query.order = order;
    return this;
  }

  skip(skip) {
    this.$query.skip = skip;
    return this;
  }

  limit(limit) {
    this.$query.limit = limit;
    return this;
  }

  populate(options) {
    if (!(options instanceof Array)) options = [options];
    this.$query.populate = options.map(item => {
      return Object.prototype.toString.call(item) === '[object Object]' ? item : { path: item };
    });
    return this;
  }

  buildWhere(condition, parent) {
    if (Object.keys(condition).length === 0) return { where: null, data: [] };
    let where = [],
        data = [];
    for (let key in condition) {
      let value = condition[key];
      if (Object.prototype.toString.call(value) === '[object Object]') {
        let result = this.buildWhere(value, key);
        if (!result.where) continue;
        where.push('(' + result.where + ')');
        data.push(...result.data);
        continue;
      }
      let lkey = key.toLowerCase();
      switch (lkey) {
        case '$all': // 数组匹配查询
        case '$in':
          where.push(this.mapField(parent) + ' in (' + [].concat(value).fill('?').join(', ') + ')');
          data.push(...value);
          break;
        case '$nin':
          where.push(this.mapField(parent) + ' not in (' + [].concat(value).fill('?').join(', ') + ')');
          data.push(...value);
          break;
        case '$exists':
          where.push(this.mapField(parent) + (value ? ' is not null' : ' is null'));
          break;
        case '$ne':
          where.push(this.mapField(parent) + ' != ?');
          data.push(value);
          break;
        case '$gte':
          where.push(this.mapField(parent) + ' >= ?');
          data.push(value);
          break;
        case '$gt':
          where.push(this.mapField(parent) + ' > ?');
          data.push(value);
          break;
        case '$lte':
          where.push(this.mapField(parent) + ' <= ?');
          data.push(value);
          break;
        case '$lt':
          where.push(this.mapField(parent) + ' < ?');
          data.push(value);
          break;
        case '$regex':
          where.push(this.mapField(parent) + ' like ?');
          data.push('%' + value.toString() + '%');
          break;
        case '$and':
        case '$or':
          let children = [];
          value.forEach(element => {
            let result = this.buildWhere(element, key);
            if (!result.where) return;
            children.push(result.where);
            data.push(...result.data);
          });
          children.length > 0 && where.push('(' + children.join(key === '$and' ? ' and ' : ' or ') + ')');
          break;
        default:
          if (value instanceof RegExp) {
            where.push(this.mapField(key) + ' like ?');
            data.push('%' + value.toString().replace(/(^\/)|(\/$)/gm, '') + '%');
          } else {
            where.push(this.mapField(key) + ' = ?');
            data.push(value);
          }
      }
    }
    return { where: where.join(' and '), data };
  }

  buildOrder(order) {
    if (Object.keys(order).length === 0) return null;
    let orders = [];
    for (let field in order) {
      orders.push(this.mapField(field) + ' ' + (order[field] === -1 ? 'desc' : 'asc'));
    }
    return orders.join(', ');
  }

  mapField(field) {
    let mapping = this.mapping.mappings[field];
    if (!mapping) {
      throw new Error(this.$model.$name() + '.' + field + ' can not be mapped ' + JSON.stringify(this.$query));
    }
    return ['`', mapping.table, '`.`', mapping.field, '`'].join('');
  }

  count(name) {
    this.$query.count = name || 'ct';
    return this;
  }

  lean(lean) {
    this.$query.lean = lean;
    return this;
  }

  exec(callback) {
    let sql = [],
        distinct = this.$query.distinct ? this.$query.distinct : '_id';
    let tables = Object.keys(this.mapping.tables);
    let table = tables.shift();
    if (this.$query.count) {
      sql.push('select count(distinct ', this.mapField(distinct), ') as ', this.$query.count, ' from ');
    } else {
      sql.push('select distinct ', this.mapField(distinct), ' from ');
    }
    sql.push('`', table, '`');
    tables.forEach(element => {
      sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`');
    });
    let { where, data } = this.buildWhere(this.$query.where);
    where && sql.push(' where ', where);
    if (this.$query.count) {
      this.$options.debug && console.log(sql.join(''), data);
      return _index2.default.connection.query(sql.join(''), data).then(result => {
        if (callback) return callback(null, result[0].ct);
        return _index2.default.Promise.resolve(result[0].ct);
      });
    }
    let order = this.buildOrder(this.$query.order);
    order && sql.push(' order by ', order);
    if (this.$query.limit > 0) {
      sql.push(' limit ');
      this.$query.skip > -1 && sql.push(this.$query.skip, ', ');
      sql.push(this.$query.limit);
    }
    this.$options.debug && console.log(sql.join(''), data);
    return _index2.default.connection.query(sql.join(''), data).then(result => {
      let distinct = this.$query.distinct ? this.$query.distinct : '_id';
      let field = this.mapping.mappings[distinct].field;
      result = result.map(element => element[field]);
      !this.$options.multi && (result = result.shift());
      if (!this.$query.distinct) {
        return this.loadById(result, this.$query.select).then(result => {
          return this.fillPopulate(result, this.$query.populate).then(result => {
            if (result && !this.$query.lean) {
              result = result instanceof Array ? result.map(item => {
                return item.lean();
              }) : result.lean();
            }
            return callback ? callback(null, result) : _index2.default.Promise.resolve(result);
          }).catch(error => {
            return callback ? callback(error) : _index2.default.Promise.reject(error);
          });
        });
      }
      if (callback) return callback(null, result);
      return _index2.default.Promise.resolve(result);
    });
  }

  fillPopulate(data, populate, callback) {
    var _this = this;

    return _asyncToGenerator(function* () {
      let res = data instanceof Array ? data : [data];
      if (!populate || populate.length === 0 || !data || res.length < 1) {
        if (callback) return callback(null, data);
        return _index2.default.Promise.resolve(data);
      }
      let idMap = {}; // 构造待查询映射
      populate.forEach(function (item) {
        return Object.assign(idMap, { [item.path]: Object.assign({}, item, { ids: [], data: {} }) });
      });
      res.forEach(function (item) {
        // 获取待查询主键
        for (let index in idMap) {
          idMap[index].ids.push(item[index]);
        }
      });
      for (let index in idMap) {
        // 执行查询
        let map = idMap[index];
        let ids = Array.from(new Set(map.ids)).filter(function (item) {
          return item > 0;
        });
        if (ids.length === 0) continue;
        let model = _index2.default.modelByName(map.model ? map.model : _this.$model.$schema().fields[index].ref);
        let result = yield model.query().loadById(ids, map.select);
        result.forEach(function (item) {
          map.data[item._id] = item;
        });
      }
      res.forEach(function (item) {
        // 填充记录
        for (let index in idMap) {
          let map = idMap[index];
          Object.assign(item, { [map.path]: map.data[item[index]] });
        }
      });
      if (callback) return callback(null, data instanceof Array ? res : res[0]);
      return _index2.default.Promise.resolve(data instanceof Array ? res : res[0]);
    })();
  }

  cursor() {
    return new Cursor(this);
  }

  /**
   * 根据一个或多个ID加载数据记录，不受查询参数影响
   */
  loadById(id, fields, callback) {
    if (typeof fields === 'function') {
      callback = fields;
      fields = null;
    }
    if (Object.prototype.toString.call(id) === '[object Object]') id = id._id;
    let ids = id instanceof Array ? id : [id];
    if (!id || ids.length < 1) {
      return _index2.default.Promise.resolve(id instanceof Array ? [] : null);
    }
    let mapping = this.$model.mapping();
    let tableName = Object.keys(mapping.tables)[0]; // 主表
    let queries = [],
        tables = this.$model.tables(fields, mapping);
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
                if (data instanceof Array) {
                  data.push(item); // 这种方式可能导致autoIndex与数组下标不一致
                } else {
                  data[key] = item;
                }
              }
            })(doc, item.autoIndex.split('.'));
          });
        }
        if (doc !== null) data.push(this.$model.new(doc));
      });
      if (!(id instanceof Array)) data = data.length > 0 ? data[0] : data;
      if (callback) return callback(null, data);
      return _index2.default.Promise.resolve(data);
    }).catch(error => {
      if (callback) return callback(error);
      return _index2.default.Promise.reject(error);
    });
  }

}

class Cursor {
  constructor(query) {
    this.skip = query.$query.skip;
    this.limit = query.$query.limit;
    this.skip < 0 && (this.skip = 0);
    this.limit > 0 && (this.limit += this.skip);
    this.query = query.options({ multi: false });
  }

  next() {
    if (this.limit > 0 && this.skip >= this.limit) return null;
    this.query.skip(this.skip++);
    this.query.limit(1);
    return this.query.exec();
  }

}

exports.default = Query;