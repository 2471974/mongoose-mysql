
new Promise((r, d) => {
	setTimeout(() => {
		console.log('12214')
		r(2222)
	}, 20)
}).then(r => {
	console.log(r)
	return Promise.resolve(44444)
}).then(r => {
  console.log(r)
  return Promise.resolve(555555555)
}).catch(e => {
  console.log(e)
  return Promise.resolve(33333333)
}).then(r => {
  console.log(r)
})
