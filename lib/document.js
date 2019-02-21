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

  validate(optional, callback) {
    return this.model().validate(this, optional, callback);
  }
}

exports.default = Document;