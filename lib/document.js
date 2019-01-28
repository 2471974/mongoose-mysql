"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * 数据实例
 */
class Document {
  constructor(doc) {
    Object.assign(this, doc);
  }

  save(callback) {
    return this.model().save(this, callback);
  }
}

exports.default = Document;