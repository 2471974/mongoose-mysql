class Dao {
  constructor (name, schema) {
    this.name = name
    this.schema = schema
  }

  save (callback) {
    callback()
  }
}

export default Dao