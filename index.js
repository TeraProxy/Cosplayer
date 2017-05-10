// based on elin-magic by Pinkie Pie and cosplay-ex by Bernkastel

const CONTRACT_DRESSING_ROOM = 76,
	HEAD_ID = 7000001,
	GROW_ID = 7000005,
	THIGH_ID = 7000014,
	CHEST_ID = 7000012

module.exports = function Cosplayer(dispatch) {
	const Scanner = require('./scanner')
	Scanner(dispatch)

	let db = Scanner.db,
		cid = null,
		player,
		external = null,
		userDefaultAppearance,
		inDressup = false,
		inDye = false,
		lastTooltip = 0,
		lastTooltipTime = 0,
		stack,
		headstate = false
		
	// ################## //
	// ### Save Stuff ### //
	// ################## //

	const path = require('path')
	fs = require('fs')

	let presets = {}
	let presetTimeout = null
	let presetLock = false

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

	// apply appearance to character selection
	dispatch.hook('S_GET_USER_LIST', 2, event => {
		// for every character on log-in
		for (let index in event.characters) {
			// if character is in config, update appearance
			player = event.characters[index].name
			if (presets[player] && presets[player].id != 0) {
				external = presets[player]
				// for each appearance slot, update cosmetics to preset
				for (let appearance_type of ['hairAdornment', 'mask', 'back', 'weaponSkin', 'weaponEnchant', 'costume', 'costumeDye']) {
					event.characters[index][appearance_type] = presets[player][appearance_type]
				}
			}
		}
		return true
	})

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
		var color = Number('0x'+event.alpha.toString(16)+event.red.toString(16)+event.green.toString(16)+event.blue.toString(16));
		external.costumeDye = color;
		presets[player] = external;
		presetUpdate();
		inDye = true;
	});
	
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

	dispatch.hook('S_REQUEST_INGAMESTORE_MARK_PRODUCTLIST', 1, function(){ return false })

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
	
	function applyAppearanceChange(cid, shapeid, stack) {
		dispatch.toClient('S_ABNORMALITY_BEGIN', 2, {
			target: cid,
			source: cid,
			id: shapeid,
			duration: 864000000,
			unk: 0,
			stacks: stack,
			unk2: 0,
		})
	}
	
	function removeAppearanceChange(cid, shapeid, stack) {
		dispatch.toClient('S_ABNORMALITY_BEGIN', 2, {
			target: cid,
			source: cid,
			id: shapeid,
			duration: 864000000,
			unk: 0,
			stacks: stack,
			unk2: 0,
		})
		dispatch.toClient('S_ABNORMALITY_END', 1, {
			target: cid,
			id: shapeid,
		})
	}
	
	// ################# //
	// ### Chat Hook ### //
	// ################# //
	
	dispatch.hook('C_WHISPER', 1, (event) => {
		let cmd = null
		if(event.target.toUpperCase() === "!cosplayer".toUpperCase()) {
			if (/^<FONT>dye?<\/FONT>$/i.test(event.message)) {
				colorThatShit()
				presets[player] = external
				presetUpdate()
			}
			else if (cmd = /^<FONT>dyergb (.+?)<\/FONT>$/i.exec(event.message)) {
				external.costumeDye = parseInt(cmd[1], 16)
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
				presets[player] = external
				presetUpdate()
			}
			else if (cmd = /^<FONT>weapon (.+?)<\/FONT>$/i.exec(event.message)) {
				external.weaponSkin = Number(cmd[1])
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
				presets[player] = external
				presetUpdate()
			}
			else if (cmd = /^<FONT>costume (.+?)<\/FONT>$/i.exec(event.message)) {
				external.costume = Number(cmd[1])
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
				presets[player] = external
				presetUpdate()
			}
			else if (cmd = /^<FONT>back (.+?)<\/FONT>$/i.exec(event.message)) {
				external.back = Number(cmd[1])
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
				presets[player] = external
				presetUpdate()
			}
			else if (cmd = /^<FONT>mask (.+?)<\/FONT>$/i.exec(event.message)) {
				external.mask = Number(cmd[1])
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
				presets[player] = external
				presetUpdate()
			}
			else if (cmd = /^<FONT>hair (.+?)<\/FONT>$/i.exec(event.message)) {
				external.hairAdornment = Number(cmd[1])
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
				presets[player] = external
				presetUpdate()
			}
			else if (cmd = /^<FONT>innerwear (.+?)<\/FONT>$/i.exec(event.message)) {
				external.innerwear = Number(cmd[1])
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
				presets[player] = external
				presetUpdate()
			}
			else if (cmd = /^<FONT>enchant (.+?)<\/FONT>$/i.exec(event.message)) {
				external.weaponEnchant = Number(cmd[1])
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, external)
				presets[player] = external
				presetUpdate()
			}
			else if (/^<FONT>pantsu?<\/FONT>$/i.test(event.message)) {
				changePantsu()
			}
			else if (/^<FONT>undress?<\/FONT>$/i.test(event.message)) {
				dispatch.toClient('S_USER_EXTERNAL_CHANGE', 1, userDefaultAppearance)
				external = Object.assign({}, userDefaultAppearance)
				presets[player].id = 0
				presetUpdate()
			}
			else if (/^<FONT>head?<\/FONT>$/i.test(event.message)) {
				shapeid = HEAD_ID
				if(headstate === false) {
					headstate = true
					stack = 1
					applyAppearanceChange(cid, shapeid, stack)
				}	
				else {
					headstate = false
					stack = 1
					removeAppearanceChange(cid, shapeid, stack)
				}
			}
			else if (cmd = /^<FONT>height (.+?)<\/FONT>$/i.exec(event.message)) {
				shapeid = GROW_ID
				stack = Number(cmd[1]) + 4
				console.log('stack: ' + stack)
				if (stack == 4){
					removeAppearanceChange(cid, shapeid, stack)
				}
				else {
					applyAppearanceChange(cid, shapeid, stack)
				}
			}
			else if (cmd = /^<FONT>thighs (.+?)<\/FONT>$/i.exec(event.message)) {
				shapeid = THIGH_ID
				stack = Number(cmd[1]) + 4
				console.log('stack: ' + stack)
				if (stack == 4){
					removeAppearanceChange(cid, shapeid, stack)
				}
				else {
					applyAppearanceChange(cid, shapeid, stack)
				}
			}
			else if (cmd = /^<FONT>chest (.+?)<\/FONT>$/i.exec(event.message)) {
				shapeid = CHEST_ID
				stack = Number(cmd[1]) + 4
				console.log('stack: ' + stack)
				if (stack == 4){
					removeAppearanceChange(cid, shapeid, stack)
				}
				else {
					applyAppearanceChange(cid, shapeid, stack)
				}
			}
			else message('Commands: "dye" (change dye with the ingame slider tool),'
								+ ' "dyergb [0-255 0-255 0-255]" (change dye to rgb value, e.g. dyergb 214 153 204),'
								+ ' "weapon [id]" (change your weapon skin to id, e.g. weapon 99272),'
								+ ' "costume [id]" (change your costume skin to id, e.g. costume 180722),'
								+ ' "back [id]" (change your back skin to id, e.g. back 180081),'
								+ ' "mask [id]" (change your mask skin to id, e.g. mask 181563),'
								+ ' "hair [id]" (change your hair adornment to id, e.g. hair 252972),'
								+ ' "innerwear [id]" (change your innerwear skin to id, e.g. innerwear 97936),'
								+ ' "pantsu" (switch between innerwear and costume),'
								+ ' "enchant [0-15]" (change weapon enchant glow, e.g. enchant 13),'
								+ ' "undress" (goes back to your actual look),'
								+ ' "head" (switch between big and normal head),'
								+ ' "height [x]" (changes your height to x, default is 0, e.g. height -3),'
								+ ' "thighs [x]" (changes your thighs to x, default is 0, e.g. thighs -3),'
								+ ' "chest [x]" (changes your chest to x, default is 0, e.g. chest -3)'
						)
			return false
		}
	})
	
	function message(msg) {
		dispatch.toClient('S_WHISPER', 1, {
			player: cid,
			unk1: 0,
			gm: 0,
			unk2: 0,
			author: '!Cosplayer',
			recipient: player,
			message: msg
		})
	}
}
