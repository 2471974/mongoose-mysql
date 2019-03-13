'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _schema = require('./schema');

var _schema2 = _interopRequireDefault(_schema);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * 数据实例
 */
class Document {
  constructor(doc, virtuals) {
    virtuals || (virtuals = {});
    Object.defineProperty(this, 'modified', {
      enumerable: false, value: {}
    });
    for (let key in doc) {
      let value = this.convert(doc[key]),
          virtual = virtuals[key];
      delete virtuals[key];
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get() {
          // 真实字段不允许覆盖getter
          return value;
        },
        set(val) {
          virtual && virtual.setter && (val = virtual.setter.bind(this)(val));
          value = this.convert(val);
          this.modified[key] = value;
        }
      });
    }
    for (let key in virtuals) {
      let virtual = virtuals[key],
          value = this[key];
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get() {
          return virtual && virtual.getter ? virtual.getter.bind(this)() : value;
        },
        set(val) {// 虚拟字段不支持setter
          // virtual && virtual.setter && (val = virtual.setter.bind(this)(val))
          // value = this.convert(val)
          // this.modified[key] = value
        }
      });
    }
  }

  convert(value) {
    if (Object.prototype.toString.call(value) === '[object Object]') {
      if (value instanceof _schema2.default.Types.ObjectId) {
        value = value._id;
      } else {
        value = new Document(value);
      }
    } else if (value instanceof Array) {
      value = value.map(item => {
        return this.convert(item);
      });
    }
    return value;
  }

  revert(value) {
    if (Object.prototype.toString.call(value) === '[object Object]') {
      value = value.lean();
    } else if (value instanceof Array) {
      value = value.map(item => {
        return this.revert(item);
      });
    }
    return value;
  }

  isModified(path) {
    if (path) {
      return typeof this.modified[path] != 'undefined';
    } else {
      return Object.keys(this.modified).length > 0;
    }
  }

  lean() {
    let data = {};
    for (let key in this) {
      data[key] = this.revert(this[key]);
    }
    return data;
  }
}

exports.default = Document;