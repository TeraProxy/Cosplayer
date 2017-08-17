// Contains code from elin-magic by Pinkie Pie https://github.com/pinkipi  
// Contains code from from elin-magic's extension cosplay-ex by Bernkastel https://github.com/Bernkastel-0

const Command = require('command'),
	Scanner = require('./scanner'),
	CONTRACT_DRESSING_ROOM = 76

module.exports = function Cosplayer(dispatch) {
	Scanner(dispatch)

	let db = Scanner.db,
		cid = null,
		player,
		external = null,
		userDefaultAppearance,
		inDressup = false,
		inDye = false,
		lastTooltip = 0,
		lastTooltipTime = 0
		
	// ################## //
	// ### Save Stuff ### //
	// ################## //

	const path = require('path')
	fs = require('fs')

	let presets = {},
		presetTimeout = null,
		presetLock = false

	try { presets = require('./presets.json') }
	catch(e) { presets = {} }

	function presetUpdate() {
		clearTimeout(presetTimeout)
		presetTimeout = setTimeout(presetSave, 1000)
	}

	function presetSave() {
		if(presetLock) {
			presetUpdate()
			return
		}

		presetLock = true
		fs.writeFile(path.join(__dirname, 'presets.json'), JSON.stringify(presets, null, 4), err => {
			presetLock = false
		})
	}

	// ############# //
	// ### Magic ### //
	// ############# //

	dispatch.hook('S_LOGIN', 1, event => {
		({cid} = event)
		player = event.name
		inDressup = false
		inDye = false
		if(presets[player] && presets[player].id != 0) {
			external = presets[player]
			external.id = cid
		}
	})
	
	dispatch.hook('S_GET_USER_LIST', 2, event => {
        for (let index in event.characters) {
            if(presets[event.characters[index].name] && presets[event.characters[index].name].id != 0) {
                event.characters[index].face = presets[event.characters[index].name].face
				event.characters[index].hairAdornment = presets[event.characters[index].name].hairAdornment
				event.characters[index].mask = presets[event.characters[index].name].mask
				event.characters[index].back = presets[event.characters[index].name].back
				event.characters[index].weaponSkin = presets[event.characters[index].name].weaponSkin
				event.characters[index].weaponEnchant = presets[event.characters[index].name].weaponEnchant
				event.characters[index].costume = presets[event.characters[index].name].costume
				event.characters[index].unk35 = presets[event.characters[index].name].costumeDye
            }
        }
		return true
    })

	dispatch.hook('S_USER_EXTERNAL_CHANGE', 1, event => {
		if(event.id.equals(cid)) {
			userDefaultAppearance = Object.assign({}, event)
			if(presets[player] && (presets[player].id != 0)) {
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
				presets[player] = external
				presetUpdate()
				if(external.enable == 0) {
					dispatch.toClient('S_ABNORMALITY_BEGIN', 2, {
						target: cid,
						source: cid,
						id: 7777008,
						duration: 864000000,
						unk: 0,
						stacks: 1,
						unk2: 0,
					})
				}
				return false
			}
			else {
				external = Object.assign({}, event)
				presets[player] = Object.assign({}, external)
				presets[player].id = 0
				presetUpdate()
			}
		}
	})
	
	dispatch.hook('S_ABNORMALITY_BEGIN', 2, (event) => {
		if(presets[player] && (presets[player].id != 0) && (external.enable == 1) && (event.id == 7777008)) {
			setTimeout(function() {
				dispatch.toClient('S_ABNORMALITY_END', 1, {
					target: cid,
					id: 7777008,
				})
			}, 1000)
		}
	})
	
	dispatch.hook('C_ITEM_COLORING_SET_COLOR', 1, (event) => {
		let color = Number('0x'+event.alpha.toString(16)+event.red.toString(16)+event.green.toString(16)+event.blue.toString(16))
		external.costumeDye = color
		presets[player] = external
		presetUpdate()
		inDye = true
	})
	
	dispatch.hook('S_REQUEST_CONTRACT', 1, event => {
		if(event.type == CONTRACT_DRESSING_ROOM) {
			inDressup = true

			let items = []

			for(let slot in db)
				for(let item of db[slot])
					items.push({
						unk: 0,
						item
					})

			dispatch.toClient('S_REQUEST_INGAMESTORE_MARK_PRODUCTLIST', 1, {items})
		}
	})
	
	dispatch.hook('C_CANCEL_CONTRACT', 1, event => {
		if(inDye) {
			inDye = false
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			presets[player] = external
			presetUpdate()
		}
	})

	dispatch.hook('S_CANCEL_CONTRACT', 1, event => {
		if(inDressup) {
			inDressup = false
			process.nextTick(() => { dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external) })
			presets[player] = external
			presetUpdate()
		}
	})

	dispatch.hook('S_REQUEST_INGAMESTORE_MARK_PRODUCTLIST', 1, () => { return false })

	dispatch.hook('C_REQUEST_NONDB_ITEM_INFO', 1, event => {
		if(inDressup) {
			let time = Date.now()

			// The only way to tell an item was clicked in the Dressing Room is to watch for this packet twice in a row.
			// Unequipping is impossible to detect, unfortunately.
			if(lastTooltip == (lastTooltip = event.item) && time - lastTooltipTime < 10) equipped(event.item)

			lastTooltipTime = time

			dispatch.toClient('S_REPLY_NONDB_ITEM_INFO', 1, {
				item: event.item,
				unk: 0
			})
			return false
		}
	})
	
    dispatch.hook('S_UNICAST_TRANSFORM_DATA', 'raw', (code, data) => {
        setTimeout(function() {
			if(presets[player] && presets[player].id != 0) {
				external = presets[player]
				external.id = cid
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			}
		}, 19000)
    })
	
	// ######################## //
	// ### Helper Functions ### //
	// ######################## //

	function equipped(item) {
		external.id = cid
		presets[player] = external
		presetUpdate()
		for(let slot in db) {
			if(db[slot].includes(item)) {
				external[slot] = item
				break
			}
		}
	}
	
	function colorThatShit() {
		dispatch.toClient('S_REQUEST_CONTRACT', 1, {
			senderId: cid,
			recipientId: 0,
			type: 42,
			id: 999999,
			unk3: 0,
			time: 0,
			senderName: player,
			recipientName: '',
			data: ''
		})
		dispatch.toClient('S_ITEM_COLORING_BAG', 1, {
			unk: 40,
			unk1: 593153247,
			unk2: 0,
			item: external.costume,
			unk3: 0,
			dye: 169087,
			unk4: 0,
			unk5: 0
		})
	}
	
	function changePantsu() {
		if(external.enable == 1) {
			dispatch.toClient('S_ABNORMALITY_BEGIN', 2, {
				target: cid,
				source: cid,
				id: 7777008, // self-confidence abnormality
				duration: 864000000, // 10 days
				unk: 0,
				stacks: 1,
				unk2: 0
			})
			external.enable = 0
			presets[player] = external
			presetUpdate()
		}
		else if(external.enable == 0) {
			dispatch.toClient('S_ABNORMALITY_END', 1, {
				target: cid,
				id: 7777008 // self-confidence abnormality
			})
			external.enable = 1
			presets[player] = external
			presetUpdate()
		}
	}

	// ################# //
	// ### Chat Hook ### //
	// ################# //
	
	const command = Command(dispatch)
	command.add('cosplay', (param, number) => {
		if (param == 'dye') {
			colorThatShit()
			presets[player] = external
			presetUpdate()
		}
		else if (param == 'dyergb' && number != null) {
			external.costumeDye = parseInt(number, 16)
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			presets[player] = external
			presetUpdate()
		}
		else if (param == 'weapon' && number != null) {
			external.weaponSkin = Number(number)
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			presets[player] = external
			presetUpdate()
		}
		else if (param == 'costume' && number != null) {
			external.costume = Number(number)
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			presets[player] = external
			presetUpdate()
		}
		else if (param == 'back' && number != null) {
			external.back = Number(number)
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			presets[player] = external
			presetUpdate()
		}
		else if (param == 'mask' && number != null) {
			external.mask = Number(number)
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			presets[player] = external
			presetUpdate()
		}
		else if (param == 'hair' && number != null) {
			external.hairAdornment = Number(number)
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			presets[player] = external
			presetUpdate()
		}
		else if (param == 'innerwear' && number != null) {
			external.innerwear = Number(number)
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			presets[player] = external
			presetUpdate()
		}
		else if (param == 'pantsu') {
			changePantsu()
		}
		else if (param == 'enchant' && number != null) {
			external.weaponEnchant = Number(number)
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
			presets[player] = external
			presetUpdate()
		}
		else if (param == 'undress') {
			dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, userDefaultAppearance)
			external = Object.assign({}, userDefaultAppearance)
			presets[player].id = 0
			presetUpdate()
		}
		else command.message('Commands:<br>' 
								+ ' "cosplay dye" (change dye with the ingame slider tool),<br>'
								+ ' "cosplay dyergb \'[0-255 0-255 0-255]\'" (change dye to rgb value, e.g. "cosplay dyergb \'214 153 204\'"),<br>'
								+ ' "cosplay weapon [id]" (change your weapon skin to id, e.g. "cosplay weapon 99272"),<br>'
								+ ' "cosplay costume [id]" (change your costume skin to id, e.g. "cosplay costume 180722"),<br>'
								+ ' "cosplay back [id]" (change your back skin to id, e.g. "cosplay back 180081"),<br>'
								+ ' "cosplay mask [id]" (change your mask skin to id, e.g. "cosplay mask 181563"),<br>'
								+ ' "cosplay hair [id]" (change your hair adornment to id, e.g. "cosplay hair 252972"),<br>'
								+ ' "cosplay innerwear [id]" (change your innerwear skin to id, e.g. "cosplay innerwear 97936"),<br>'
								+ ' "cosplay pantsu" (switch between innerwear and costume),<br>'
								+ ' "cosplay enchant [0-15]" (change weapon enchant glow, e.g. "cosplay enchant 13"),<br>'
								+ ' "cosplay undress" (goes back to your actual look)'
			)
	})
}