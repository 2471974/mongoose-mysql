'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * 数据实例
 */
class Document {
  constructor(doc) {
    Object.defineProperty(this, 'modified', {
      enumerable: false, value: {}
    });
    for (let key in doc) {
      let value = this.convert(doc[key]);
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get() {
          return value;
        },
        set(val) {
          value = this.convert(val);
          this.modified[key] = value;
        }
      });
    }
  }

  convert(value) {
    if (Object.prototype.toString.call(value) === '[object Object]') {
      value = new Document(value);
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