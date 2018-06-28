const events = require('events'),
	Mouse = require('./mouse.node').Mouse

module.exports = function() {
	let that = new events.EventEmitter(),
		mouse = null,
		right = false

	that.once('newListener', () => {
		mouse = new Mouse(function(type, x, y) {
			if(type === 'right-down') right = true
			else if(type === 'right-up') right = false

			that.emit(type, x, y)
		})
	})

	that.ref = function() {
		if(mouse) mouse.ref()
	}

	that.unref = function() {
		if(mouse) mouse.unref()
	}

	that.destroy = function() {
		if(mouse) mouse.destroy()
		mouse = null
	}

	return that
}
