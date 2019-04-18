'use strict'

if(!global.cosplayer_mouse)
	global.cosplayer_mouse = require('./mouse')

const path = require('path'),
	fs = require('fs'),
	Mouse = global.cosplayer_mouse,
	CONTRACT_DRESSING_ROOM = 76,
	hatrestyle = false, // enable free hat restyling, needs additional opcodes
	SLOTS = [
		"face", "styleHead", "styleFace", "styleBack", "styleWeapon", "weaponEnchant", "styleBody", "styleBodyDye", "styleFootprint", "underwear",
		"styleHeadScale"
	]

module.exports = function Cosplayer(mod) {

	mod.game.initialize("contract")

	let items = require('./items/items.' + mod.region),
		mounts = require('./mounts/mounts.' + mod.region)

	const weapons = Object.keys(items.categories.style.weapon)

	let job = -1,
		external = null,
		userDefaultAppearance = null,
		inDressup = false,
		inDye = false,
		mypreset = null,
		mynametag = '',
		gettingAppearance = false,
		dressingRoom = [],
		mouse = Mouse(),
		hoveredItem = -1,
		mymount = 0,
		vehicles = []

	for(let mount in mounts)
		vehicles.push(mounts[mount].vehicleId)

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
		if(setpreset) mypreset = presets[mod.game.me.name] = Object.assign({}, external)

		if(mypreset) {
			mypreset.nametag = presets[mod.game.me.name].nametag = mynametag
			mypreset.mount = presets[mod.game.me.name].mount = mymount
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

		fs.writeFile(
			path.join(__dirname, 'presets.json'),
			JSON.stringify(presets, (key, value) => typeof value === 'bigint' ? value.toString() : value, 4),
			err => { presetLock = false }
		)
	}

	// ############# //
	// ### Hooks ### //
	// ############# //

	mod.game.on('enter_game', () => {
		inDressup = inDye = false
		mypreset = external = userDefaultAppearance = null
		mynametag = ''
		gettingAppearance = false
		hoveredItem = -1
		mymount = 0

		if(presets[mod.game.me.name]) {
			mypreset = presets[mod.game.me.name]
			mynametag = mypreset.nametag
			mymount = mypreset.mount
		}

		if(mypreset && mypreset.gameId != 0) {
			external = mypreset
			external.gameId = mod.game.me.gameId
		}

		// Generate our Dressing Room
		const templateId = mod.game.me.templateId,
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
	mod.game.on('leave_game', () => {
		if(presetTimeout) {
			clearTimeout(presetTimeout)
			presetTimeout = null
		}
	})

	mod.game.contract.on('begin', (type, id) => {
		if(type == CONTRACT_DRESSING_ROOM) {
			inDressup = true
			mod.toClient('S_REQUEST_STYLE_SHOP_MARK_PRODUCTLIST', 1, { list: dressingRoom })
		}
	})
	mod.game.contract.on('end', (how) => {
		if(how == "cancel" && inDressup) {
			hoveredItem = -1
			inDressup = false

			changeAppearance()
			presetUpdate(true)
		}
	})

	mod.hook('C_CANCEL_CONTRACT', 'raw', () => {
		if(inDye) {
			inDye = false

			external.gameId = mod.game.me.gameId

			changeAppearance()
			presetUpdate(true)
		}
	})

	mod.hook('S_GET_USER_LIST', 15, event => {
		for(let character in event.characters) {
			let charpreset = presets[event.characters[character].name]

			if(charpreset && charpreset.gameId != 0)
				for(let slot of SLOTS)
					event.characters[character][slot] = charpreset[slot]
		}
		return true
	})

	mod.hook('S_USER_EXTERNAL_CHANGE', 7, event => {
		if(mod.game.me.is(event.gameId)) {
			userDefaultAppearance = Object.assign({}, event)

			if(mypreset && mypreset.gameId != 0) {
				changeAppearance()
				presetUpdate(true)

				if(external.showStyle == false) {
					mod.toClient('S_ABNORMALITY_BEGIN', 3, {
						target: mod.game.me.gameId,
						source: mod.game.me.gameId,
						id: 7777008, // self-confidence abnormality
						duration: 864000000, // 10 days
						unk: 0,
						stacks: 1,
						unk2: 0,
						unk3: 0
					})
				}
				return false
			}
			else {
				external = Object.assign({}, event)
				presets[mod.game.me.name] = Object.assign({}, external)
				presets[mod.game.me.name].gameId = 0

				presetUpdate(false)
			}
		}
	})

	mod.hook('C_ITEM_COLORING_SET_COLOR', 2, event => {
		inDye = true
		external.styleBodyDye = event.color

		presetUpdate(true)
	})

	mod.hook('S_ABNORMALITY_BEGIN', 3, event => {
		if(mypreset && mypreset.gameId != 0 && external.showStyle == true && event.id == 7777008) { // self-confidence abnormality
			setTimeout(() => {
				mod.toClient('S_ABNORMALITY_END', 1, {
					target: mod.game.me.gameId,
					id: 7777008, // self-confidence abnormality
				})
			}, 1000)
		}
	})

	mod.hook('C_REQUEST_NONDB_ITEM_INFO', 2, event => {
		if(inDressup) {
			hoveredItem = event.item

			mod.toClient('S_REPLY_NONDB_ITEM_INFO', 1, {
				item: hoveredItem,
				unk: mounts[hoveredItem] ? 0:1, // 0 for mounts, 1 for other stuff
				unk1: items.categories.gear['underwear'].includes(hoveredItem) ? 53:0, // 53 for innerwear, 0 for other stuff
				unk2: items.categories.gear['underwear'].includes(hoveredItem) ? 1:0, // 1 for innerwear, 0 for other stuff
				unk3: 0,
				unk4: 0,
				unk5: 0,
				unk6: 0,
				unk7: 0xffffffff
			})
			return false
		}
	})

	mod.hook('S_UNICAST_TRANSFORM_DATA', 5, event => {
		if(mod.game.me.playerId == event.playerId && mod.game.me.serverId == event.serverId) {
			if(event.type == 0) setTimeout(reapplyPreset, 100) // Reapply look after transforming back

			if(mypreset && mypreset.gameId != 0 && event.type == 1) { // Keep custom weapon when transforming
				event.weaponEnchant = mypreset.weaponEnchant
				event.styleWeapon = mypreset.styleWeapon
				return true
			}
		}
	})

	mod.hook('S_REQUEST_STYLE_SHOP_MARK_PRODUCTLIST', 'raw', () => {
		return false // block this so the server doesn't overwrite our fake item list
	})

	mod.hook('S_USER_PAPERDOLL_INFO', 8, event => {
		if(gettingAppearance) {
			for(let slot of SLOTS)
				if(event[slot]) equipped(event[slot])

			changeAppearance()
			presetUpdate(true)

			return false
		}
	})

	mod.hook('S_MOUNT_VEHICLE', 2, event => {
		if(mod.game.me.is(event.gameId)) {
			if(mymount != null && mymount > 0) {
				event.id = mymount
				return true
			}
		}
	})

	mod.hook('S_USER_WEAPON_APPEARANCE_CHANGE', 2, event => { // To revert weapon after Berserker's Unleashed
		if(mod.game.me.is(event.gameId) && event.abnormalityEffect == 0) { // 0 = stop Unleashed; 329 = start Unleashed
			if(mypreset && mypreset.gameId != 0) {
				event.weapon = mypreset.weapon
				event.styleWeapon = mypreset.styleWeapon
				event.weaponEnchant = mypreset.weaponEnchant
				return true
			}
		}
	})

	mod.hook('S_PREVIEW_ITEM', 'raw', () => { // Fix losing custom outfit when previewing an item
		mod.hookOnce('C_PLAYER_LOCATION', 'raw', () => {
			reapplyPreset()
		})
	})

	if(hatrestyle) {
		mod.hook('C_REQUEST_ACCESSORY_COST_INFO', 'raw', () => { // When wearing a custom outfit, allow free hat restyling
			if(mypreset && mypreset.gameId != 0) {
				mod.toClient('S_RESPONSE_ACCESSORY_COST_INFO', 1, {
					response: 1,
					item: 0,
					unk: 0,
					amount: 0
				})
				return false
			}
		})

		mod.hook('C_COMMIT_ACCESSORY_TRANSFORM', 1, event => { // When wearing a custom outfit, allow free hat restyling
			if(mypreset && mypreset.gameId != 0) {
				restyleHat(event)
				return false
			}
		})
	}

	// ################# //
	// ### Functions ### //
	// ################# //

	function equipped(item) {
		if(items.categories.style.weapon[weapons[job]].includes(item)) {
			external.styleWeapon = item
			external.gameId = mod.game.me.gameId
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
				external.gameId = mod.game.me.gameId
				presetUpdate(true)
				return
			}
		}
		for (let slot of ['styleBody', 'styleFace', 'styleHead', 'styleBack', 'styleFootprint']) {
			if(items.categories.style[slot].includes(item)) {
				external[slot] = item
				external.gameId = mod.game.me.gameId
				presetUpdate(true)
				return
			}
		}
	}

	function changeColor(item) {
		mod.toClient('S_REQUEST_CONTRACT', 1, {
			senderId: mod.game.me.gameId,
			recipientId: 0,
			type: 42,
			id: 999999,
			unk3: 0,
			time: 0,
			senderName: mod.game.me.name,
			recipientName: '',
			data: ''
		})
		mod.toClient('S_ITEM_COLORING_BAG', 1, {
			unk: 40,
			unk1: 593153247,
			unk2: 0,
			item: item,
			unk3: 0,
			dye: ['jp','tw','se'].includes(mod.region) ? 206 : 169087,
			unk4: 0,
			unk5: 0
		})
		inDye = true
	}

	function changePantsu() {
		if(external.showStyle == true) {
			mod.toClient('S_ABNORMALITY_BEGIN', 3, {
				target: mod.game.me.gameId,
				source: mod.game.me.gameId,
				id: 7777008, // self-confidence abnormality
				duration: 864000000, // 10 days
				unk: 0,
				stacks: 1,
				unk2: 0,
				unk3: 0
			})
		}
		else if(external.showStyle == false) {
			mod.toClient('S_ABNORMALITY_END', 1, {
				target: mod.game.me.gameId,
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
		mod.toClient('S_ITEM_CUSTOM_STRING', 2, {
			gameId: mod.game.me.gameId,
			customStrings: [
				{ dbid: external.styleBody, string: newnametag }
			]
		})
		mynametag = (newnametag == mod.game.me.name) ? "" : newnametag

		presetUpdate(true)
	}

	function changeAppearance() {
		mod.toClient('S_USER_EXTERNAL_CHANGE', 7, external)
		if(mynametag && (mynametag.length > 0)) changeNametag(mynametag)
	}

	function convertList(list) {
		let convertedList = []
		for(let item of list) {
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
		mod.toServer('C_REQUEST_USER_PAPERDOLL_INFO', 1, { name: playername })
		setTimeout(() => { gettingAppearance = false }, 1000)
	}

	function restyleHat(event) {
		mod.toClient('S_COMMIT_ACCESSORY_TRANSFORM_RESULT', 1, {
			success: true
		})
		mod.toClient('S_ITEM_TRANSFORM_DATA', 1, {
			gameId: mod.game.me.gameId,
			item: mypreset.styleHead,
			scale: event.scale,
			rotation: event.rotation,
			translation: event.translation,
			translationDebug: event.translationDebug,
			unk: true
		})
		external.styleHeadScale = event.scale
		external.styleHeadRotation = event.rotation
		external.styleHeadTranslation = event.translation
		external.styleHeadTranslationDebug = event.translationDebug

		presetUpdate(true)
	}

	// ################ //
	// ### Commands ### //
	// ################ //

	mod.command.add('cosplay', (cmd, value, rgb) => {
		switch (cmd) {
			case "weapon":
				if(value) {
					external.styleWeapon = Number(value)
					external.gameId = mod.game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break

			case "costume":
				if(value) {
					external.styleBody = Number(value)
					external.gameId = mod.game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break

			case "back":
				if(value) {
					external.styleBack = Number(value)
					external.gameId = mod.game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break

			case "face":
				if(value) {
					external.styleFace = Number(value)
					external.gameId = mod.game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break

			case "head":
				if(value) {
					external.styleHead = Number(value)
					external.gameId = mod.game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break

			case "underwear":
				if(value) {
					external.underwear = Number(value)
					external.gameId = mod.game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break

			case "footprints":
				if(value) {
					external.styleFootprint = Number(value)
					external.gameId = mod.game.me.gameId
					changeAppearance()
					presetUpdate(true)
				}
				break

			case "dye":
				changeColor(external.styleBody)
				break

			case "dyergb":
				if(value && rgb) {
					let index = ["costume","underwear","chest","gloves","boots"].indexOf(value),
						hex2int = Number.parseInt(rgb, 16)

					if(index < 0 || !(0 <= hex2int <= 4294967295)) { // The Risenio check
						mod.command.message("Please use one of the following dyergb commands:\n"
							+ ' "cosplay dyergb costume [00000000-FFFFFFFF]",\n'
							+ ' "cosplay dyergb underwear [00000000-FFFFFFFF]",\n'
							+ ' "cosplay dyergb chest [00000000-FFFFFFFF]",\n'
							+ ' "cosplay dyergb gloves [00000000-FFFFFFFF]",\n'
							+ ' "cosplay dyergb boots [00000000-FFFFFFFF]"'
						)
					}
					else {
						let dyeToChange = ["styleBodyDye","underwearDye","bodyDye","handDye","feetDye"][index]
						external[dyeToChange] = hex2int
						external.gameId = mod.game.me.gameId
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
					external.gameId = mod.game.me.gameId
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

			case "mount":
				if(value) {
					if(vehicles.includes(value)) {
						mymount = Number(value)
						presetUpdate(true)
					}
				}
				break

			case "dismount":
				mod.toServer('C_UNMOUNT_VEHICLE', 1, {})
				mymount = 0
				presetUpdate(true)
				break

			default:
				mod.command.message('Commands:\n' 
					+ ' "cosplay weapon [id]" (change your weapon skin to id, e.g. "cosplay weapon 99272"),\n'
					+ ' "cosplay costume [id]" (change your costume skin to id, e.g. "cosplay costume 180722"),\n'
					+ ' "cosplay back [id]" (change your back skin to id, e.g. "cosplay back 180081"),\n'
					+ ' "cosplay face [id]" (change your face adornment to id, e.g. "cosplay face 181563"),\n'
					+ ' "cosplay head [id]" (change your head adornment to id, e.g. "cosplay head 252972"),\n'
					+ ' "cosplay underwear [id]" (change your underwear skin to id, e.g. "cosplay underwear 97936"),\n'
					+ ' "cosplay footprints [id]" (change your footprints to id, e.g. "cosplay footprints 99579"),\n'
					+ ' "cosplay dye" (change costume dye with the slider tool, e.g. "cosplay dye"),\n'
					+ ' "cosplay dyergb [item] [00000000-FFFFFFFF]" (change dye to ARGB value, e.g. "cosplay dyergb costume FFD699CC"),\n'
					+ ' "cosplay pantsu" (switch between showing your underwear and costume),\n'
					+ ' "cosplay enchant [0-15]" (change weapon enchant glow, e.g. "cosplay enchant 13"),\n'
					+ ' "cosplay tag [text]" (change name tag on costume, e.g. "cosplay tag \'I love Spacecats\'"),\n'
					+ ' "cosplay as [name]" (copy an online player\'s outfit, e.g. "cosplay as Sasuke.Uchiha"),\n'
					+ ' "cosplay undress" (revert to your original look),\n'
					+ ' "cosplay mount [id]" (change your mount to id, e.g. "cosplay mount 261"),\n'
					+ ' "cosplay dismount" (dismount and revert to your original mount)'
				)
		}
	})
}