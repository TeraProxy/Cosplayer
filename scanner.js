const DISABLE = false // set to true if you want to disable scanning for new costumes

const path = require('path'),
	fs = require('fs')

let db = null,
	writeTimeout = null,
	writeLock = false

try { db = require('./db.json') }
catch(e) { db = {} }

function dbUpdate() {
	clearTimeout(writeTimeout)
	writeTimeout = setTimeout(dbSave, 1000)
}

function dbSave() {
	if(writeLock) {
		dbUpdate()
		return
	}

	writeLock = true
	fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 4), err => {
		if(err) console.error(e.stack)
		else console.log('Costume database updated')

		writeLock = false
	})
}

const SPAWN_SLOTS = ['inner', 'hairAdornment', 'mask', 'back', 'weaponSkin', 'costume'],
	EXTERNAL_SLOTS = ['innerwear', 'hairAdornment', 'mask', 'back', 'weaponSkin', 'costume']

module.exports = function ElinMagicScanner(dispatch) {
	if(!DISABLE) {
		dispatch.hook('S_SPAWN_USER', 2, event => {
			let found = false

			for(let i in EXTERNAL_SLOTS) found |= checkSlot(EXTERNAL_SLOTS[i], event[SPAWN_SLOTS[i]])

			if(found) dbUpdate()
		})

		dispatch.hook('S_USER_EXTERNAL_CHANGE', 1, event => {
			let found = false

			for(let slot of EXTERNAL_SLOTS) found |= checkSlot(slot, event[slot])

			if(found) dbUpdate()
		})
	}
	
	function checkSlot(slot, item) {
		if(item && !(db[slot] || (db[slot] = [])).includes(item)) {
			console.log('Found new ' + slot + ' ' + item)
			db[slot].push(item)
			db[slot] = db[slot].sort((a, b) => a - b)

			return true
		}

		return false
	}
}

module.exports.db = db