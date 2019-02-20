'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schema = require('../schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  glueTable: '-',
  glueIndex: '.',
  table() {
    return Array.prototype.join.call(arguments, this.glueTable).toLowerCase();
  },
  index() {
    let args = Array.prototype.filter.call(arguments, item => {
      if (typeof item === 'undefined') return false;
      if (item === '') return false;
      return true;
    });
    return args.join(this.glueIndex);
  },
  fieldsArrayType(fields) {
    if (fields instanceof Array) {
      if (fields.length < 1) throw 'schema has empty array field';
      if (fields.length > 1) throw 'schema has array field, but length greater than 1';
      fields = fields[0].type;
    }
    return fields;
  },
  update(data, mappings, parent) {
    let result = {};
    for (let key in data) {
      let value = data[key];
      if (key.indexOf('$') === 0) {
        let r = this.update(value, mappings, key);
        for (let index in r) {
          if (result[index]) {
            result[index].fields.push(...r[index].fields);
            result[index].data.push(...r[index].data);
          } else {
            result[index] = r[index];
          }
        }
        continue;
      }
      let lparent = parent.toLowerCase(),
          lkey = mappings[key];
      if (!lkey) throw 'can not mapping ' + key;
      let table = result[lkey.table] || (result[lkey.table] = { fields: [], data: [] });
      switch (lparent) {
        case '$inc':
          table.fields.push('`' + lkey.field + '`=`' + lkey.field + '` + ?');
          table.data.push(value);
          break;
        case '$set':
          table.fields.push('`' + lkey.field + '`=?');
          table.data.push(lkey.map ? lkey.map(value) : value);
          break;
        case '$unset':
          table.fields.push('`' + lkey.field + '`=null');
          break;
        default:
          throw 'update operation ' + parent + ' is not supportted on field with name ' + key;
      }
    }
    return result;
  },
  insert(fields, data, tableName, autoIndex) {
    fields = this.fieldsArrayType(fields);
    let result = [],
        columns = [],
        values = [];
    if (typeof autoIndex !== 'undefined') {
      columns.push('autoId', 'autoIndex');
      values.push(undefined, autoIndex);
    } else if (Object.prototype.toString.call(fields) === '[object Object]') {
      if (Object.keys(fields).indexOf('_id') === -1) {
        fields = Object.assign({ _id: { type: _schema2.default.Types.ObjectId } }, fields);
      }
      if (Object.keys(data).indexOf('_id') === -1) {
        data = Object.assign({ _id: null }, data);
      }
    }
    tableName = this.table(tableName);
    autoIndex = this.index(autoIndex);
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      fields = { value: { type: fields } };
      data = { value: data };
    }
    for (let field in fields) {
      let dataValue = data[field];
      if (typeof dataValue === 'undefined') continue;
      let value = fields[field];
      let dataType = Object.prototype.toString.call(value.type);
      switch (dataType) {
        case '[object Array]':
        case '[object Object]':
          if (typeof value.formatter !== 'undefined' && value.formatter instanceof _schema2.default.Formatter.Stringify) {
            columns.push(field);
            values.push(JSON.stringify(dataValue));
          } else {
            if (Object.prototype.toString.call(dataValue) !== dataType) break;
            if (dataType === '[object Object]') {
              result.push(...this.insert(value.type, dataValue, this.table(tableName, field), this.index(autoIndex, field)));
            } else {
              dataValue.forEach((element, index) => {
                result.push(...this.insert(value.type, element, this.table(tableName, field), this.index(autoIndex, field, index)));
              });
            }
          }
          break;
        default:
          columns.push(field);
          values.push(dataValue);
      }
    }
    let sql = [];
    sql.push("insert into `", tableName, "` (");
    sql.push(columns.map(item => '`' + item + '`').join(','));
    sql.push(") values (", [].concat(columns).fill('?').join(','), ")");
    result.unshift({ sql: sql.join(''), data: values });
    return result;
  },
  mapping(fields, tableName, autoIndex) {
    let isArray = fields instanceof Array;
    fields = this.fieldsArrayType(fields);
    tableName = this.table(tableName);
    autoIndex = this.index(autoIndex);
    let result = { tables: {}, mappings: {} },
        columns = [],
        mappings = {},
        maps = [];
    if (autoIndex !== '') {
      columns.push('autoId', 'autoIndex');
    } else {
      columns.push('_id');
      Object.assign(mappings, { [this.index(autoIndex, '_id')]: { table: tableName, field: '_id' } });
    }
    if (Object.prototype.toString.call(fields) === '[object Object]') {
      for (let field in fields) {
        let value = fields[field];
        let dataType = Object.prototype.toString.call(value.type);
        switch (dataType) {
          case '[object Array]':
          case '[object Object]':
            if (typeof value.formatter !== 'undefined' && value.formatter instanceof _schema2.default.Formatter.Stringify) {
              columns.push(field);
              maps.push(data => {
                if (typeof data[field] === 'undefined') return data;
                data[field] = JSON.parse(data[field]);
                return data;
              });
              Object.assign(mappings, { [this.index(autoIndex, field)]: { table: tableName, field, map: data => {
                    return JSON.stringify(data);
                  } } });
            } else {
              let r = this.mapping(value.type, this.table(tableName, field), dataType === '[object Object]' ? this.index(autoIndex, field) : this.index(autoIndex, field, '$'));
              Object.assign(result.tables, r.tables);
              Object.assign(result.mappings, r.mappings);
            }
            break;
          default:
            columns.push(field);
            Object.assign(mappings, { [this.index(autoIndex, field)]: { table: tableName, field } });
        }
      }
    } else {
      columns.push('value');
      Object.assign(mappings, { [autoIndex]: { table: tableName, field: 'value' } });
      maps.push(data => {
        return data.value;
      });
    }
    result.tables = Object.assign({ [tableName]: { columns, maps, isArray } }, result.tables);
    result.mappings = Object.assign(mappings, result.mappings);
    return result;
  },
  optimizeType(fields) {
    let dataType = Object.prototype.toString.call(fields);
    switch (dataType) {
      case '[object Array]':
        return { type: this.optimizeArray(fields) };
      case '[object Object]':
        if (this.isTypeObject(fields)) {
          fields.type = this.optimizeType(fields.type).type;
          return fields;
        }
        fields = { type: this.optimizeObject(fields) };
        if (typeof fields.type.id !== 'undefined') {
          fields.type._id = fields.type.id;
          delete fields.type.id;
        }
        if (typeof fields.type._id !== 'undefined') {
          fields._id = fields.type._id.type;
          delete fields.type._id;
        }
        return fields;
      default:
        return { type: fields };
    }
  },
  optimizeObject(fields) {
    for (let field in fields) {
      fields[field] = this.optimizeType(fields[field]);
    }

    return fields;
  },
  optimizeArray(fields) {
    return fields.map(item => this.optimizeType(item));
  },
  /**
   * 判断Schema声明是否为字段配置
   */
  isTypeObject(fields) {
    const keywords = ['type', 'unique', 'required', 'ref', 'id', '_id', 'default', 'dafult', 'set', 'enum', 'formatter', 'min', 'max'];
    for (let field in fields) {
      if (keywords.indexOf(field) === -1) return false;
    }
    return true;
  },

  /**
   * 获取Schema对应的DDL
   * @param {Boolean} withDrop 是否生成drop table语句
   * @param {Boolean} withAuto 是否添加autoId、autoIndex字段
   *  autoId - 存储所属文档的主键
   *  autoIndex - 存储记录在文档中的位置，如'0','f1','f1.0','f1.0.fx','f1.0.fx.0'
   */
  ddl(fields, tableName, withDrop, withAuto) {
    tableName = this.table(tableName);
    let result = [];
    fields = this.fieldsArrayType(fields);
    if (withDrop) {
      result.push(["drop table if exists `", tableName, "`;"].join(''));
    }
    let sql = [];
    sql.push("create table `", tableName, "` (");
    if (withAuto) {
      sql.push("`autoId` int(11) NOT NULL DEFAULT '0',");
      sql.push("`autoIndex` varchar(255) NOT NULL DEFAULT '',");
    } else {
      sql.push("`_id` int(11) NOT NULL AUTO_INCREMENT,");
    }
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      fields = {
        value: { type: fields }
      };
    }
    for (let field in fields) {
      let value = fields[field];
      let dataType = Object.prototype.toString.call(value.type);
      switch (dataType) {
        case '[object Array]':
        case '[object Object]':
          if (typeof value.formatter !== 'undefined' && value.formatter instanceof _schema2.default.Formatter.Stringify) {
            sql.push("`", field, "` text NULL,");
          } else {
            result.push(...this.ddl(value.type, this.table(tableName, field), withDrop, true));
          }
          break;
        default:
          if (value.type === String) {
            sql.push("`", field, "` varchar(255) NULL,");
          } else if (value.type === Boolean) {
            sql.push("`", field, "` tinyint(4) NULL,");
          } else if (value.type === Number) {
            sql.push("`", field, "` double NULL,");
          } else if (value.type === Date) {
            // sql.push("`", field, "` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,")
            sql.push("`", field, "` datetime NULL,");
          } else if (value.type === _schema2.default.Types.ObjectId) {
            // mysql
            sql.push("`", field, "` int(11) NULL,");
          } else if (value.type.name && value.type.name === 'ObjectId') {
            // mongoose from plugin
            sql.push("`", field, "` int(11) NULL,");
          } else {
            throw 'schema [' + tableName + '] has not supported field [' + field + '] with type [' + dataType + '] in ' + JSON.stringify(fields);
          }
      }
    }
    if (withAuto) {
      sql.push("PRIMARY KEY (`autoId`, `autoIndex`)");
    } else {
      sql.push("PRIMARY KEY (`_id`)");
    }
    sql.push(");");
    result.push(sql.join(''));
    return result;
  }
};