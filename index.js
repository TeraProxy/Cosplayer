// Version 2.1.7
// Thanks to Kourin for a better way to generate the Dressing Room -> https://github.com/Mister-Kay
// Thanks to Incedius for help with custom mount support -> https://github.com/incedius
// Special thanks to Pinkie Pie for the original elin-magic code -> https://github.com/pinkipi

'use strict'

try { // Make sure the player can use the native mouse hooking module
	if(process.arch != 'x64') throw Error()
	else if(process.versions.modules != '64') throw Error()
}
catch(e) {
	if(process.arch != 'x64') console.error('32-bit Node.JS is not compatible with Cosplayer. Please go here for advice: https://github.com/TeraProxy/Cosplayer/wiki/Version-Incompatibility')
	else console.error('Your current Node.JS version is not compatible with Cosplayer. Please go here for advice: https://github.com/TeraProxy/Cosplayer/wiki/Version-Incompatibility')
	return
}

if(!global.cosplayer_mouse)
	global.cosplayer_mouse = require('./mouse')

const Command = require('command'),
	path = require('path'),
	fs = require('fs'),
	GameState = require('tera-game-state'),
	Mouse = global.cosplayer_mouse,
	CONTRACT_DRESSING_ROOM = 76,
	SLOTS = ["face", "styleHead", "styleFace", "styleBack", "styleWeapon", "weaponEnchant", "styleBody", "styleBodyDye", "styleFootprint", "underwear"]

let items = null,
	mounts = null

module.exports = function cosplayer(dispatch) {

	if(dispatch.region != "na" && dispatch.region != "eu") {
		items = require('./items/items.' + dispatch.region + '.json'),
		mounts = require('./mounts/mounts.' + dispatch.region + '.json')
	}
	else {
		items = require('./items/items.json'),
		mounts = require('./mounts/mounts.json')
	}

	const command = Command(dispatch),
		game = GameState(dispatch),
		weapons = Object.keys(items.categories.style.weapon)

	game.initialize("contract")

	let job = -1,
		external = null,
		userDefaultAppearance = null,
		inDressup = false,
		inDye = false,
		inHatRestyle = false,
		mypreset = null,
		mynametag = '',
		gettingAppearance = false,
		dressingRoom = [],
		mouse = Mouse(),
		hoveredItem = -1,
		mymount = 0,
		unleashed = false

	this.destructor = () => {
		mouse.destroy()
	}

	mouse.on('right-down', () => { 
		if(hoveredItem > -1) equipped(hoveredItem)
	})

	// ################### //
	// ### Save & Load ### //
	// ################### //

	let presets = {}, 
		presetTimeout = null,
		presetLock = false

	try { presets = require('./presets') }
	catch(e) { 
		presets = {} 
		presetSave()
	}

	function presetUpdate(setpreset) {
		if(setpreset) mypreset = presets[game.me.name] = Object.assign({}, external)
		if(mypreset) {
			mypreset.nametag = presets[game.me.name].nametag = mynametag
			mypreset.mount = presets[game.me.name].mount = mymount
		}

		clearTimeout(presetTimeout)
		presetTimeout = setTimeout(presetSave, 1000)
	}
	
	function presetSave() {
		if(presetLock) {
			presetUpdate(false)
			return
		}
		presetLock = true
		fs.writeFile(path.join(__dirname, 'presets.json'), JSON.stringify(presets, null, 4), err => {
			presetLock = false
		})
	}

	// ############# //
	// ### Hooks ### //
	// ############# //

	game.on('enter_game', () => {
		inDressup = inDye = inHatRestyle = false
		mypreset = external = userDefaultAppearance = null
		mynametag = ''
		gettingAppearance = false
		hoveredItem = -1
		mymount = 0

		if(presets[game.me.name]) {
			mypreset = presets[game.me.name]
			mynametag = mypreset.nametag
			mymount = mypreset.mount
		}

		if(mypreset && mypreset.gameId != 0) {
			external = mypreset
			external.gameId = game.me.gameId
		}

		// Generate our Dressing Room
		const templateId = game.me.templateId,
			race = Math.floor((templateId - 10101) / 100)
		job = (templateId - 10101) % 100

		dressingRoom = []
		for (let item of items.categories.style.weapon[weapons[job]]) {
			if (!items.items[item].races || items.items[item].races.includes(race)) {
				if (!items.items[item].classes || items.items[item].classes.includes(job)) {
					dressingRoom.push(item)
				}
			}
		}
		for (let slot of ['styleBody', 'styleFace', 'styleHead', 'styleBack', 'styleFootprint']) {
			for (let item of items.categories.style[slot]) {
				if (!items.items[item].races || items.items[item].races.includes(race)) {
					if (!items.items[item].classes || items.items[item].classes.includes(job)) {
						dressingRoom.push(item)
					}
				}
			}
		}
		for (let slot of ['face', 'underwear']) {
			for (let item of items.categories.gear[slot]) {
				if (!items.items[item].races || items.items[item].races.includes(race)) {
					if (!items.items[item].classes || items.items[item].classes.includes(job)) {
						dressingRoom.push(item)
					}
				}
			}
		}
		dressingRoom = dressingRoom.concat(Object.keys(mounts))
		dressingRoom = convertList(dressingRoom)
	})

	game.contract.on('begin', (type, id) => {
		if(type == CONTRACT_DRESSING_ROOM) {
			inDressup = true
			dispatch.toClient('S_REQUEST_STYLE_SHOP_MARK_PRODUCTLIST', 1, { list: dressingRoom })
		}
	})
	game.contract.on('end', (how) => {
		if(how == "cancel" && inDressup) {
			hoveredItem = -1
			inDressup = false
			process.nextTick(() => { changeAppearance() })

			presetUpdate(true)
		}
	})

	dispatch.hook('C_CANCEL_CONTRACT', 1, event => {
		if(inDye) {
			inDye = false

			external.gameId = game.me.gameId
			changeAppearance()
			presetUpdate(true)
		}
	})

	dispatch.hook('S_GET_USER_LIST', 14, event => {
		for (let i in event.characters) {
			let charpreset = presets[event.characters[i].name]

			if(charpreset && charpreset.gameId != 0) 
				for(let slot of SLOTS)
					event.characters[i][slot] = charpreset[slot]
		}
		return true
	})

	dispatch.hook('S_USER_EXTERNAL_CHANGE', 6, event => {
		if(game.me.is(event.gameId)) {
			userDefaultAppearance = Object.assign({}, event)

			if(mypreset && mypreset.gameId != 0) {
				changeAppearance()
				presetUpdate(true)

				if(external.showStyle == false) {
					dispatch.toClient('S_ABNORMALITY_BEGIN', 2, {
						target: game.me.gameId,
						source: game.me.gameId,
						id: 7777008, // self-confidence abnormality
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
				presets[game.me.name] = Object.assign({}, external)
				presets[game.me.name].gameId = 0
				presetUpdate(false)
			}
		}
	})

	dispatch.hook('C_ITEM_COLORING_SET_COLOR', 1, event => {
		let color = Number('0x' + event.alpha.toString(16) + event.red.toString(16) + event.green.toString(16) + event.blue.toString(16))
		inDye = true
		external.styleBodyDye = color

		presetUpdate(true)
	})

	dispatch.hook('S_ABNORMALITY_BEGIN', 2, event => {
		if(mypreset && mypreset.gameId != 0 && external.showStyle == true && event.id == 7777008) { // self-confidence abnormality
			setTimeout(() => {
				dispatch.toClient('S_ABNORMALITY_END', 1, {
					target: game.me.gameId,
					id: 7777008, // self-confidence abnormality
				})
			}, 1000)
		}

		if(game.me.is(event.target)) {
			if(event.id == 10155130) // Ragnarok
				changeAppearance()
			else if(event.id == 401730) // Unleashed
				unleashed = true
		}
	})

	dispatch.hook('S_ABNORMALITY_END', 1, event => {
		if(game.me.is(event.target)) {
			if(event.id == 10155130) // Ragnarok
				changeAppearance()
			else if(event.id == 401730) // Unleashed
				unleashed = false
		}
	})

	dispatch.hook('C_REQUEST_NONDB_ITEM_INFO', 2, event => {
		if(inDressup) {
			hoveredItem = event.item
			
			dispatch.toClient('S_REPLY_NONDB_ITEM_INFO', 1, {
				item: hoveredItem,
				unk: true,
				unk1: false,
				unk2: 0,
				unk3: 0,
				unk4: 0,
				unk5: 0,
				unk6: 0,
				unk7: 0xffffffff
			})
			return false
		}
	})

	dispatch.hook('S_UNICAST_TRANSFORM_DATA', 3, event => { // Reapply look after Marrow Brooch / Clone Jutsu
		if(game.me.is(event.gameId) && event.unk2 == false) setTimeout(reapplyPreset, 100)
	})

	dispatch.hook('S_REQUEST_STYLE_SHOP_MARK_PRODUCTLIST', 1, event => {
		return false // block this so the server doesn't overwrite our fake item list
	})

	dispatch.hook('S_USER_PAPERDOLL_INFO', 5, event => {
		if(gettingAppearance) {
			for(let slot of SLOTS)
				if(event[slot]) equipped(event[slot])

			changeAppearance()

			return false
		}
	})

	dispatch.hook('S_MOUNT_VEHICLE', 1, event => {
		if(game.me.is(event.target)) {
			if(mymount != null && mymount > 0) {
				event.unk1 = mymount
				return true
			}
		}
	})

	dispatch.hook('S_USER_WEAPON_APPEARANCE_CHANGE', 1, event => { // To revert weapon after Berserker's Unleashed
		if(game.me.is(event.gameId) && !unleashed) {
			if(mypreset && mypreset.gameId != 0) {
				event.dbid = mypreset.weapon
				event.weaponSkin = mypreset.styleWeapon
				event.enchant = mypreset.weaponEnchant
				return true
			}
		}
	})

	dispatch.hook('S_PREVIEW_ITEM', 1, () => { // Fix losing custom outfit when previewing an item
		dispatch.hookOnce('C_PLAYER_LOCATION', 'raw', () => {
			reapplyPreset()
		})
	})

	// ################# //
	// ### Functions ### //
	// ################# //

	function equipped(item) {
		if(items.categories.style.weapon[weapons[job]].includes(item)) {
			external.styleWeapon = item
			external.gameId = game.me.gameId
			presetUpdate(true)
			return
		}
		else if(mounts[item]) {
			mymount = mounts[item].vehicleId
			presetUpdate(true)
			return
		}
		for (let slot of ['face', 'underwear']) {
			if(items.categories.gear[slot].includes(item)) {
				external[slot] = item
				external.gameId = game.me.gameId
				presetUpdate(true)
				return
			}
		}
		for (let slot of ['styleBody', 'styleFace', 'styleHead', 'styleBack', 'styleFootprint']) {
			if(items.categories.style[slot].includes(item)) {
				external[slot] = item
				external.gameId = game.me.gameId
				presetUpdate(true)
				return
			}
		}
	}

	function changeColor(item) {
		dispatch.toClient('S_REQUEST_CONTRACT', 1, {
			senderId: game.me.gameId,
			recipientId: 0,
			type: 42,
			id: 999999,
			unk3: 0,
			time: 0,
			senderName: game.me.name,
			recipientName: '',
			data: ''
		})
		dispatch.toClient('S_ITEM_COLORING_BAG', 1, {
			unk: 40,
			unk1: 593153247,
			unk2: 0,
			item: item,
			unk3: 0,
			dye: 169087,
			unk4: 0,
			unk5: 0
		})
		inDye = true
	}

	function changePantsu() {
		if(external.showStyle == true) {
			dispatch.toClient('S_ABNORMALITY_BEGIN', 2, {
				target: game.me.gameId,
				source: game.me.gameId,
				id: 7777008, // self-confidence abnormality
				duration: 864000000, // 10 days
				unk: 0,
				stacks: 1,
				unk2: 0
			})
		}
		else if(external.showStyle == false) {
			dispatch.toClient('S_ABNORMALITY_END', 1, {
				target: game.me.gameId,
				id: 7777008 // self-confidence abnormality
			})
		}
		external.showStyle = !external.showStyle
		changeNametag(mynametag)
	}

	function reapplyPreset() {
		if(mypreset && mypreset.gameId != 0) {
			external = mypreset

			changeAppearance()
		}
	}

	function changeNametag(newnametag) {
		dispatch.toClient('S_ITEM_CUSTOM_STRING', 2, {gameId: game.me.gameId, customStrings: [{dbid: external.styleBody, string: newnametag}]})
		mynametag = (newnametag == game.me.name) ? "" : newnametag
		presetUpdate(true)
	}

	function changeAppearance() {
		dispatch.toClient('S_USER_EXTERNAL_CHANGE', 6, external)
		if(mynametag && (mynametag.length > 0)) changeNametag(mynametag)
	}

	function convertList(list) {
		let convertedList = []
		for (let item of list) {
			convertedList.push({
				type: 0,
				id: item,
				unk1: 0xffffffff,
				unk2: 0,
				unk3: 0,
				unk4: false,
				unk5: 0,
				unk6: 1,
				unk7: ""
			})
		}
		return convertedList
	}

	function cosplayAs(playername) {
		gettingAppearance = true
		dispatch.toServer('C_REQUEST_USER_PAPERDOLL_INFO', 1, { name: playername })
		setTimeout(() => { gettingAppearance = false }, 1000)
	}

	// ################ //
	// ### Commands ### //
	// ################ //

	command.add('cosplay', (cmd, value, rgb) => {
		switch (cmd) {
			case "weapon":
				if(value) {
					external.styleWeapon = Number(value)
					external.gameId = game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break
			case "costume":
				if(value) {
					external.styleBody = Number(value)
					external.gameId = game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break
			case "back":
				if (value) {
					external.styleBack = Number(value)
					external.gameId = game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break
			case "face":
				if(value) {
					external.styleFace = Number(value)
					external.gameId = game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break
			case "head":
				if (value) {
					external.styleHead = Number(value)
					external.gameId = game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break
			case "underwear":
				if(value) {
					external.underwear = Number(value)
					external.gameId = game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break
			case "footprints":
				if(value) {
					external.styleFootprint = Number(value)
					external.gameId = game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break
			case "dye":
				changeColor(external.styleBody)
				break
			case "dyergb":
				if(value && rgb) {
					let index = ["costume","underwear","chest","gloves","boots"].indexOf(value)
					if(index == -1)
						command.message("Please use one of the following dyergb commands:\n"
										+ ' "cosplay dyergb costume \'[0-255 0-255 0-255]\'",\n'
										+ ' "cosplay dyergb underwear \'[0-255 0-255 0-255]\'",\n'
										+ ' "cosplay dyergb chest \'[0-255 0-255 0-255]\'",\n'
										+ ' "cosplay dyergb gloves \'[0-255 0-255 0-255]\'",\n'
										+ ' "cosplay dyergb boots \'[0-255 0-255 0-255]\'"'
						)
					else {
						let dyeToChange = ["styleBodyDye","underwearDye","bodyDye","handDye","feetDye"][index]
						external[dyeToChange] = parseInt(rgb, 16)
						external.gameId = game.me.gameId
						changeAppearance()
						presetUpdate(true)
					}
				}
				break
			case "pantsu":
				changePantsu()
				break
			case "enchant":
				if(value) {
					external.weaponEnchant = Number(value)
					external.gameId = game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break
			case "tag":
				if(value) changeNametag(value)
				break
			case "as":
				if(value) cosplayAs(value)
				break
			case "undress":
				external = Object.assign({}, userDefaultAppearance)
				changeAppearance()
				external.gameId = 0
				presetUpdate(true)
				break
			case "dismount":
				dispatch.toServer('C_UNMOUNT_VEHICLE', 1, {})
				mymount = 0
				presetUpdate(true)
				break
			default:
				command.message('Commands:\n' 
									+ ' "cosplay weapon [id]" (change your weapon skin to id, e.g. "cosplay weapon 99272"),\n'
									+ ' "cosplay costume [id]" (change your costume skin to id, e.g. "cosplay costume 180722"),\n'
									+ ' "cosplay back [id]" (change your back skin to id, e.g. "cosplay back 180081"),\n'
									+ ' "cosplay face [id]" (change your face adornment to id, e.g. "cosplay face 181563"),\n'
									+ ' "cosplay head [id]" (change your head adornment to id, e.g. "cosplay head 252972"),\n'
									+ ' "cosplay underwear [id]" (change your underwear skin to id, e.g. "cosplay underwear 97936"),\n'
									+ ' "cosplay footprints [id]" (change your footprints to id, e.g. "cosplay footprints 99579"),\n'
									+ ' "cosplay dye" (change costume dye with the slider tool, e.g. "cosplay dye"),\n'
									+ ' "cosplay dyergb [item] \'[0-255 0-255 0-255]\'" (change dye to rgb value, e.g. "cosplay dyergb costume \'214 153 204\'"),\n'
									+ ' "cosplay pantsu" (switch between showing your underwear and costume),\n'
									+ ' "cosplay enchant [0-15]" (change weapon enchant glow, e.g. "cosplay enchant 13"),\n'
									+ ' "cosplay tag [text]" (change name tag on costume, e.g. "cosplay tag \'I love Spacecats\'"),\n'
									+ ' "cosplay as [name]" (copy an online player\'s outfit, e.g. "cosplay as Sasuke.Uchiha"),\n'
									+ ' "cosplay undress" (revert to your original look),\n'
									+ ' "cosplay dismount" (dismount and revert to your original mount)'
				)
				break
		}
	})
}