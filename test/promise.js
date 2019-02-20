"use strict";

let obj = new Proxy({a: 124}, {
	get (target, name) {
		console.log('get', target, name)
		return target[name]
	},
	set (obj, prop, value) {
		console.log('set', obj, prop, value)
		obj[prop] = value
		return true
	}
})
console.log(obj.a)
console.log(obj.b)
obj.a = 2222222
console.log(obj.a)
obj.c = 66666666666
console.log(obj.c)
