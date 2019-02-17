'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class Query {

  constructor(model) {
    this.$model = model;
    this.$query = {
      distinct: null,
      select: null,
      where: {},
      order: {},
      skip: -1,
      limit: -1,
      populate: []
    };
    this.mapping = model.mapping();
  }

  /**
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
        order = { order: 1 };
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

  count(callback) {
    let sql = [],
        distinct = this.$query.distinct ? this.$query.distinct : '_id';
    sql.push('select count(distinct ', this.mapField(distinct), ') as ct from ');
    let tables = Object.keys(this.mapping.tables);
    let table = tables.shift();
    sql.push('`', table, '`');
    tables.forEach(element => {
      sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`');
    });
    let { where, data } = this.buildWhere(this.$query.where);
    where && sql.push(' where ', where);
    return _index2.default.connection.query(sql.join(''), data).then(result => {
      callback && callback(null, result[0].ct);
      return _index2.default.Promise.resolve(result);
    });
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
            data.push('%' + value.toString() + '%');
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
    if (!mapping) throw field + ' can not be mapped';
    return ['`', mapping.table, '`.`', mapping.field, '`'].join('');
  }

  exec(callback) {
    let sql = [],
        distinct = this.$query.distinct ? this.$query.distinct : '_id';
    sql.push('select distinct ', this.mapField(distinct), ' from ');
    let tables = Object.keys(this.mapping.tables);
    let table = tables.shift();
    sql.push('`', table, '`');
    tables.forEach(element => {
      sql.push(' left join `', element, '` on `', element, '`.`autoId` = `', table, '`.`_id`');
    });
    let { where, data } = this.buildWhere(this.$query.where);
    where && sql.push(' where ', where);
    let order = this.buildOrder(this.$query.order);
    order && sql.push(' order by ', order);
    if (this.$query.limit > 0) {
      sql.push(' limit ');
      this.$query.skip > -1 && sql.push(this.$query.skip, ', ');
      sql.push(this.$query.limit);
    }
    return _index2.default.connection.query(sql.join(''), data).then(result => {
      let distinct = this.$query.distinct ? this.$query.distinct : '_id';
      let field = this.mapping.mappings[distinct].field;
      result = result.map(element => element[field]);
      if (!this.$query.distinct) {
        return this.$model.findById(result, this.$query.select).then(result => {
          return this.fillPopulate(result, this.$query.populate, callback);
        });
      }
      callback && callback(null, result);
      return _index2.default.Promise.resolve(result);
    });
  }

  fillPopulate(data, populate, callback) {
    var _this = this;

    return _asyncToGenerator(function* () {
      if (!populate || populate.length === 0) {
        callback && callback(null, data);
        return _index2.default.Promise.resolve(data);
      }
      let idMap = {}; // 构造待查询映射
      populate.forEach(function (item) {
        return Object.assign(idMap, { [item.path]: Object.assign({}, item, { ids: [], data: {} }) });
      });
      data.forEach(function (item) {
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
        let model = _index2.default.modelByName(map.model ? map.model : _this.$model.schema().fields[index].ref);
        let result = yield model.findById(ids, map.select);
        result.forEach(function (item) {
          map.data[item._id] = item;
        });
      }
      data.forEach(function (item) {
        // 填充记录
        for (let index in idMap) {
          let map = idMap[index];
          Object.assign(item, { [map.path]: map.data[item[index]] });
        }
      });
      callback && callback(null, data);
      return _index2.default.Promise.resolve(data);
    })();
  }

  cursor() {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      // TODO:
      let result = yield _this2.exec();
      return result[Symbol.iterator]();
    })();
  }
}

exports.default = Query;