/**
 * 仅支持单个集合的一次性聚合操作
 * 1.子文档数组默认按照unwind方式进行查询，忽略查询语句中的unwind指令
 * 2.不支持多个集合的聚合查询，使用lookup指令会抛出异常
 * 3.合并管道进行单次查询，不支持二次聚合（可能与业务预期结果不一致）
 */
class Aggregate {
  constructor (options, model) {
    this.options = options
    this.$model = model
    this.mapping = model.mapping()
  }

  options () {
    let options = {}
    for (let index in this.options) {
      options = Object.assign(options[index] || {}, this.options[index])
    }
    return options
  }

  exec (callback) {
    
  }
}

export default Aggregate
