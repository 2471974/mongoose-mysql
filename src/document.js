/**
 * 数据实例
 */
class Document {
  constructor(doc) {
    Object.defineProperty(this, 'modified', {
      enumerable: false, value: {}
    })
    for (let key in doc) {
      Object.defineProperty(this, key, {
        enumerable: true,
        get () {
          return doc[key]
        },
        set (val) {
          this.modified[key] = val
          doc[key] = val
        }
      })
    }
  }

  isModified (path) {
    if (path) {
      return typeof this.modified[path] != 'undefined'
    } else {
      return Object.keys(this.modified).length > 0
    }
  }
}

export default Document
