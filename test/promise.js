"use strict";

class A {
	static fn () {
		console.log('static')
	}

	fn () {
		console.log('instance')
	}
}

A.fn()
new A().fn()
console.log(A)
