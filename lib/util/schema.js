'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schema = require('../schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

exports.default = {
  glueTable: '-',
  glueIndex: '.',
  table: function table() {
    return Array.prototype.join.call(arguments, this.glueTable);
  },
  index: function index() {
    var args = Array.prototype.filter.call(arguments, function (item) {
      if (typeof item === 'undefined') return false;
      if (item === '') return false;
      return true;
    });
    return args.join(this.glueIndex);
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
    sql.push("insert into `", tableName, "` (");
    sql.push(columns.map(function (item) {
      return '`' + item + '`';
    }).join(','));
    sql.push(") values (", [].concat(columns).fill('?').join(','), ")");
    result.unshift({ sql: sql.join(''), data: values });
    return result;
  },
  mapping: function mapping(fields, tableName, autoIndex) {
    var _this2 = this;

    var isArray = fields instanceof Array;
    fields = this.fieldsArrayType(fields);
    tableName = this.table(tableName);
    autoIndex = this.index(autoIndex);
    var result = { columns: {}, mappings: {} },
        columns = [],
        mappings = {},
        maps = [];
    if (autoIndex !== '') {
      columns.push('autoId', 'autoIndex');
    } else {
      columns.push('_id');
      Object.assign(mappings, _defineProperty({}, this.index(autoIndex, '_id'), { table: tableName, field: '_id' }));
    }
    if (Object.prototype.toString.call(fields) === '[object Object]') {
      var _loop2 = function _loop2(field) {
        var value = fields[field];
        var dataType = Object.prototype.toString.call(value.type);
        switch (dataType) {
          case '[object Array]':
          case '[object Object]':
            if (typeof value.formatter !== 'undefined' && value.formatter instanceof _schema2.default.Formatter.Stringify) {
              columns.push(field);
              maps.push(function (data) {
                if (typeof data[field] === 'undefined') return data;
                data[field] = JSON.parse(data[field]);
                return data;
              });
            } else {
              var r = _this2.mapping(value.type, _this2.table(tableName, field), dataType === '[object Object]' ? _this2.index(autoIndex, field) : _this2.index(autoIndex, field, '$'));
              Object.assign(result.columns, r.columns);
              Object.assign(result.mappings, r.mappings);
            }
            break;
          default:
            columns.push(field);
            Object.assign(mappings, _defineProperty({}, _this2.index(autoIndex, field), { table: tableName, field: field }));
        }
      };

      for (var field in fields) {
        _loop2(field);
      }
    } else {
      Object.assign(mappings, _defineProperty({}, autoIndex, { table: tableName, field: 'value' }));
      maps.push(function (data) {
        return data.value;
      });
    }
    result.tables = Object.assign(_defineProperty({}, tableName, { columns: columns, maps: maps, isArray: isArray }), result.columns);
    result.mappings = Object.assign(mappings, result.mappings);
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
    var _this3 = this;

    return fields.map(function (item) {
      return _this3.optimizeType(item);
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
  ddl: function ddl(fields, tableName, withDrop, withAuto) {
    tableName = this.table(tableName);
    var result = [];
    fields = this.fieldsArrayType(fields);
    if (withDrop) {
      result.push(["drop table if exists `", tableName, "`;"].join(''));
    }
    var sql = [];
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
    for (var field in fields) {
      var _value = fields[field];
      var _dataType = Object.prototype.toString.call(_value.type);
      switch (_dataType) {
        case '[object Array]':
        case '[object Object]':
          if (typeof _value.formatter !== 'undefined' && _value.formatter instanceof _schema2.default.Formatter.Stringify) {
            sql.push("`", field, "` text NULL,");
          } else {
            result.push.apply(result, _toConsumableArray(this.ddl(_value.type, this.table(tableName, field), withDrop, true)));
          }
          break;
        default:
          if (_value.type === String) {
            sql.push("`", field, "` varchar(255) NULL,");
          } else if (_value.type === Number) {
            sql.push("`", field, "` double NULL,");
          } else if (_value.type === Date) {
            // sql.push("`", field, "` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,")
            sql.push("`", field, "` datetime NULL,");
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
    sql.push(");");
    result.push(sql.join(''));
    return result;
  }
};