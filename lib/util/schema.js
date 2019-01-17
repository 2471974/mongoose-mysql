'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schema = require('../schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

exports.default = {
  glueTable: '-',
  glueIndex: '.',
  table: function table() {
    return Array.prototype.join.call(arguments, this.glueTable);
  },
  index: function index() {
    return Array.prototype.join.call(arguments, this.glueIndex);
  },
  fieldsArrayType: function fieldsArrayType(fields) {
    if (fields instanceof Array) {
      if (fields.length < 1) throw 'schema has empty array field';
      if (fields.length > 1) throw 'schema has array field, but length greater than 1';
      fields = fields[0].type;
    }
    return fields;
  },
  formate: function formate(fields, data) {},
  validate: function validate(fields, data) {},
  document: function document(fields, tableName, keyIndex) {
    var isArray = fields instanceof Array;
    fields = this.fieldsArrayType(fields);
    keyIndex || (keyIndex = []);
    tableName = this.table(tableName);
    var result = [],
        columns = [];
    if (keyIndex.length > 0) {
      columns.push('autoId', 'autoIndex');
    } else {
      columns.push('_id');
    }
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      fields = { value: { type: fields } };
    }
    for (var field in fields) {
      var value = fields[field];
      var dataType = Object.prototype.toString.call(value.type);
      switch (dataType) {
        case '[object Array]':
        case '[object Object]':
          if (typeof value.formatter !== 'undefined' && value.formatter instanceof _schema2.default.Formatter.Stringify) {
            columns.push(field);
          } else {
            result.push.apply(result, _toConsumableArray(this.document(value.type, this.table(tableName, field), [].concat(keyIndex, [field]))));
          }
          break;
        default:
          columns.push(field);
      }
    }
    var sql = [];
    sql.push("select ");
    sql.push(columns.map(function (item) {
      return '`' + item + '`';
    }).join(','));
    sql.push(' from ', tableName, ' where ');
    sql.push(keyIndex.length > 0 ? 'autoId' : '_id', ' = ?');
    result.unshift({ sql: sql.join(''), tableName: tableName, keyIndex: keyIndex, isArray: isArray });
    return result;
  },
  insert: function insert(fields, data, tableName, autoIndex) {
    var _this = this;

    fields = this.fieldsArrayType(fields);
    var result = [],
        columns = [],
        values = [];
    if (typeof autoIndex !== 'undefined') {
      columns.push('autoId', 'autoIndex');
      values.push(undefined, autoIndex);
    } else {
      columns.push('_id');
      values.push(null);
    }
    tableName = this.table(tableName);
    autoIndex = this.index(autoIndex);
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      fields = { value: { type: fields } };
      data = { value: data };
    }

    var _loop = function _loop(field) {
      var dataValue = data[field];
      if (typeof dataValue === 'undefined') return 'continue';
      var value = fields[field];
      var dataType = Object.prototype.toString.call(value.type);
      switch (dataType) {
        case '[object Array]':
        case '[object Object]':
          if (typeof value.formatter !== 'undefined' && value.formatter instanceof _schema2.default.Formatter.Stringify) {
            columns.push(field);
            values.push(JSON.stringify(dataValue));
          } else {
            if (Object.prototype.toString.call(dataValue) !== dataType) break;
            if (dataType === '[object Object]') {
              result.push.apply(result, _toConsumableArray(_this.insert(value.type, dataValue, _this.table(tableName, field), _this.index(autoIndex, field))));
            } else {
              dataValue.forEach(function (element, index) {
                result.push.apply(result, _toConsumableArray(_this.insert(value.type, element, _this.table(tableName, field), _this.index(autoIndex, field, index))));
              });
            }
          }
          break;
        default:
          columns.push(field);
          values.push(dataValue);
      }
    };

    for (var field in fields) {
      var _ret = _loop(field);

      if (_ret === 'continue') continue;
    }
    var sql = [];
    sql.push("insert into `" + tableName + "` (");
    sql.push(columns.map(function (item) {
      return '`' + item + '`';
    }).join(','));
    sql.push(') values (');
    sql.push(columns.fill('?').join(','));
    sql.push(')');
    result.unshift({ sql: sql.join(''), data: values });
    return result;
  },
  update: function update() {},
  delete: function _delete(fields, data) {},
  optimizeType: function optimizeType(fields) {
    var dataType = Object.prototype.toString.call(fields);
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
  optimizeObject: function optimizeObject(fields) {
    for (var field in fields) {
      fields[field] = this.optimizeType(fields[field]);
    }

    return fields;
  },
  optimizeArray: function optimizeArray(fields) {
    var _this2 = this;

    return fields.map(function (item) {
      return _this2.optimizeType(item);
    });
  },

  /**
   * 判断Schema声明是否为字段配置
   */
  isTypeObject: function isTypeObject(fields) {
    var keywords = ['type', 'unique', 'required', 'ref', 'id', '_id', 'default', 'set', 'enum', 'formatter'];
    for (var field in fields) {
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
  ddl: function ddl(tableName, fields, withDrop, withAuto) {
    tableName = this.table(tableName);
    var result = [];
    fields = this.fieldsArrayType(fields);
    if (withDrop) {
      result.push("drop table if exists `" + tableName + "`;");
    }
    var sql = [];
    sql.push("create table `" + tableName + "` (");
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
    for (var field in fields) {
      var _value = fields[field];
      var _dataType = Object.prototype.toString.call(_value.type);
      switch (_dataType) {
        case '[object Array]':
        case '[object Object]':
          if (typeof _value.formatter !== 'undefined' && _value.formatter instanceof _schema2.default.Formatter.Stringify) {
            sql.push("`" + field + "` text NULL,");
          } else {
            result.push.apply(result, _toConsumableArray(this.ddl(this.table(tableName, field), _value.type, withDrop, true)));
          }
          break;
        default:
          if (_value.type === String) {
            sql.push("`" + field + "` varchar(255) NOT NULL DEFAULT '',");
          } else if (_value.type === Number) {
            sql.push("`" + field + "` double NOT NULL DEFAULT 0,");
          } else if (_value.type === Date) {
            sql.push("`" + field + "` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,");
          } else {
            throw 'schema has not supported field [' + field + '] with type [' + _dataType + '] in ' + JSON.stringify(fields);
          }
      }
    }
    if (withAuto) {
      sql.push("PRIMARY KEY (`autoId`, `autoIndex`)");
    } else {
      sql.push("PRIMARY KEY (`_id`)");
    }
    sql.push(');');
    result.push(sql.join(''));
    return result;
  }
};