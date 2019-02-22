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
      let value = doc[key];
      if (Object.prototype.toString.call(value) === '[object Object]') {
        doc[key] = new Document(value);
      } else if (value instanceof Array) {
        doc[key] = new Document(value);
      }
      Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get() {
          return doc[key];
        },
        set(val) {
          if (Object.prototype.toString.call(value) === '[object Object]') {
            val = new Document(val);
          } else if (value instanceof Array) {
            val = new Document(val);
          }
          doc[key] = val;
          this.modified[key] = val;
        }
      });
    }
  }

  isModified(path) {
    if (path) {
      return typeof this.modified[path] != 'undefined';
    } else {
      return Object.keys(this.modified).length > 0;
    }
  }
}

exports.default = Document;