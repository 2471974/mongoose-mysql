const dev = require('./config.dev')
const prod = require('./config.prod')

module.exports = (function () {
  return Object.assign({}, dev, prod)
})()
