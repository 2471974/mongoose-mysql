import Schema from "../schema";

export default {
  glueTable: '-',
  glueIndex: '.',
  table() {
    return Array.prototype.join.call(arguments, this.glueTable)
  },
  index() {
    return Array.prototype.join.call(arguments, this.glueIndex)
  },
  fieldsArrayType (fields) {
    if (fields instanceof Array) {
      if (fields.length < 1) throw 'schema has empty array field'
      if (fields.length > 1) throw 'schema has array field, but length greater than 1'
      fields = fields[0].type
    }
    return fields
  },
  formate (fields, data) {

  },
  validate (fields, data) {},
  document (fields, tableName, keyIndex) {
    let isArray = fields instanceof Array
    fields = this.fieldsArrayType(fields)
    keyIndex || (keyIndex = [])
    tableName = this.table(tableName)
    let result = [], columns = []
    if (keyIndex.length > 0) {
      columns.push('autoId', 'autoIndex')
    } else {
      columns.push('_id')
    }
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      fields = {value: {type: fields}}
    }
    for (let field in fields) {
      let value = fields[field]
      let dataType = Object.prototype.toString.call(value.type)
      switch (dataType) {
        case '[object Array]':
        case '[object Object]':
          if (typeof value.formatter !== 'undefined' && value.formatter instanceof Schema.Formatter.Stringify) {
            columns.push(field)
          } else {
            result.push(...this.document(value.type, this.table(tableName, field), [].concat(keyIndex, [field])))
          }
          break;
        default:
          columns.push(field)
      }
    }
    let sql = []
    sql.push("select ")
    sql.push(columns.map(item => '`' + item + '`').join(','))
    sql.push(" from `", tableName, "` where ")
    if (keyIndex.length > 0) {
      sql.push("autoId = ? order by autoIndex asc")
    } else {
      sql.push("_id = ?")
    }
    result.unshift({sql: sql.join(''), tableName, keyIndex, isArray})
    return result
  },
  insert (fields, data, tableName, autoIndex) {
    fields = this.fieldsArrayType(fields)
    let result = [], columns = [], values = []
    if (typeof autoIndex !== 'undefined') {
      columns.push('autoId', 'autoIndex')
      values.push(undefined, autoIndex)
    } else {
      columns.push('_id')
      values.push(null)
    }
    tableName = this.table(tableName)
    autoIndex = this.index(autoIndex)
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      fields = {value: {type: fields}}
      data = {value: data}
    }
    for (let field in fields) {
      let dataValue = data[field]
      if (typeof dataValue === 'undefined') continue
      let value = fields[field]
      let dataType = Object.prototype.toString.call(value.type)
      switch (dataType) {
        case '[object Array]':
        case '[object Object]':
          if (typeof value.formatter !== 'undefined' && value.formatter instanceof Schema.Formatter.Stringify) {
            columns.push(field)
            values.push(JSON.stringify(dataValue))
          } else {
            if (Object.prototype.toString.call(dataValue) !== dataType) break
            if (dataType === '[object Object]') {
              result.push(...this.insert(value.type, dataValue, this.table(tableName, field), this.index(autoIndex, field)))
            } else {
              dataValue.forEach((element, index) => {
                result.push(...this.insert(value.type, element, this.table(tableName, field), this.index(autoIndex, field, index)))
              })
            }
          }
          break;
        default:
          columns.push(field)
          values.push(dataValue)
      }
    }
    let sql = []
    sql.push("insert into `", tableName, "` (")
    sql.push(columns.map(item => '`' + item + '`').join(','))
    sql.push(") values (", columns.fill('?').join(','), ")")
    result.unshift({sql: sql.join(''), data: values})
    return result
  },
  update () {
    
  },
  delete (fields, data) {},
  optimizeType (fields) {
    let dataType = Object.prototype.toString.call(fields)
    switch (dataType) {
      case '[object Array]':
        return {type: this.optimizeArray(fields)}
      case '[object Object]':
        if (this.isTypeObject(fields)) {
          fields.type = this.optimizeType(fields.type).type
          return fields
        }
        fields = {type: this.optimizeObject(fields)}
        if (typeof fields.type.id !== 'undefined') {
          fields.type._id = fields.type.id
          delete fields.type.id
        }
        if (typeof fields.type._id !== 'undefined') {
          fields._id = fields.type._id.type
          delete fields.type._id
        }
        return fields
      default:
        return {type: fields}
    }
  },
  optimizeObject (fields) {
    for (let field in fields) {
      fields[field] = this.optimizeType(fields[field])
    }
    
    return fields
  },
  optimizeArray (fields) {
    return fields.map(item => this.optimizeType(item))
  },
  /**
   * 判断Schema声明是否为字段配置
   */
  isTypeObject (fields) {
    const keywords = [
      'type', 'unique', 'required', 'ref', 'id', '_id', 'default', 'set', 'enum', 'formatter'
    ]
    for (let field in fields) {
      if (keywords.indexOf(field) === -1) return false
    }
    return true
  },

  /**
   * 获取Schema对应的DDL
   * @param {Boolean} withDrop 是否生成drop table语句
   * @param {Boolean} withAuto 是否添加autoId、autoIndex字段
   *  autoId - 存储所属文档的主键
   *  autoIndex - 存储记录在文档中的位置，如'0','f1','f1.0','f1.0.fx','f1.0.fx.0'
   */
  ddl (tableName, fields, withDrop, withAuto) {
    tableName = this.table(tableName)
    let result = []
    fields = this.fieldsArrayType(fields)
    if (withDrop) {
      result.push("drop table if exists `", tableName, "`;")
    }
    let sql = []
    sql.push("create table `", tableName, "` (")
    if (withAuto) {
      sql.push("`autoId` int(11) NOT NULL DEFAULT '0',")
      sql.push("`autoIndex` varchar(255) NOT NULL DEFAULT '',")
    } else {
      sql.push("`_id` int(11) NOT NULL AUTO_INCREMENT,")
    }
    if (Object.prototype.toString.call(fields) !== '[object Object]') {
      fields = {
        value: {type: fields}
      }
    }
    for (let field in fields) {
      let value = fields[field]
      let dataType = Object.prototype.toString.call(value.type)
      switch (dataType) {
        case '[object Array]':
        case '[object Object]':
          if (typeof value.formatter !== 'undefined' && value.formatter instanceof Schema.Formatter.Stringify) {
            sql.push("`", field, "` text NULL,")
          } else {
            result.push(...this.ddl(this.table(tableName, field), value.type, withDrop, true))
          }
          break;
        default:
          if (value.type === String) {
            sql.push("`", field, "` varchar(255) NOT NULL DEFAULT '',")
          } else if (value.type === Number) {
            sql.push("`", field, "` double NOT NULL DEFAULT 0,")
          } else if (value.type === Date) {
            sql.push("`", field, "` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,")
          } else {
            throw 'schema has not supported field [' + field + '] with type [' + dataType + '] in ' + JSON.stringify(fields)
          }
      }
    }
    if (withAuto) {
      sql.push("PRIMARY KEY (`autoId`, `autoIndex`)")
    } else {
      sql.push("PRIMARY KEY (`_id`)")
    }
    sql.push(");")
    result.push(sql.join(''))
    return result
  }
}