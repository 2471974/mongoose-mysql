/**
 * 数据实例
 */
class Document {
  constructor (doc) {
    Object.assign(this, doc)
  }

  save (callback) {
    return this.model().save(this, callback)
  }
}

export default Document
