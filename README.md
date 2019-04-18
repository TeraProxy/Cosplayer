##### :heavy_exclamation_mark: Status :heavy_exclamation_mark:
Should work on all regions as long as the opcodes are mapped. Works on Caali's and Pinkie Pie's tera-proxy.  

##### :heavy_exclamation_mark: Installation :heavy_exclamation_mark:
1) Download Cosplayer: https://github.com/TeraProxy/Cosplayer/archive/master.zip
2) Extract the contents of the zip file into "\tera-proxy\mods\\"
3) Done! (the module will auto-update on Caali's tera-proxy when a new version is released)
  
Users of Pinkie's proxy also need to install tera-game-state: https://github.com/caali-hackerman/tera-game-state/archive/master.zip  
  
If you enjoy my work and wish to support future development, feel free to drop me a small donation: [![Donate](https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=A3KBZUCSEQ5RJ)

![Screenshot](https://i.imgur.com/m8X358f.jpg)

# Cosplayer
A tera-proxy module that changes your client-side appearance. Free costumes, mounts, weapon skins and much more!.  
Changes to your character are saved on your hard drive and reloaded on next login.  

## Usage  
1) Open the Dressing Room  
2) Hover over an item until you see its tooltip appear  
3) Right click  
That's it! Or use one of the many commands below.  

:heavy_exclamation_mark: Careful with mounts: Only use ground mounts for custom ground mounts and flying mounts for custom flying mounts. Otherwise you might run into issues like being unable to fly or dismount (you can easily fix this by using the "cosplay dismount" command though) :heavy_exclamation_mark:  

While in game, open a proxy chat session by typing "/proxy" or "/8" in chat and hitting the space bar.  
This serves as the script's command interface.  
The following commands are supported:  

* **cosplay weapon [id]** - change your weapon skin to id, e.g. "cosplay weapon 99272"
* **cosplay costume [id]** - change your costume skin to id, e.g. "cosplay costume 180722"
* **cosplay back [id]** - change your back skin to id, e.g. "cosplay back 180081"
* **cosplay face [id]** - change your mask skin to id, e.g. "cosplay face 181563"
* **cosplay head [id]** - change your hair adornment to id, e.g. "cosplay head 252972"
* **cosplay underwear [id]** - change your innerwear skin to id, e.g. "cosplay underwear 97936"
* **cosplay footprints [id]** - change your footprints to id, e.g. "cosplay footprints 99579"
* **cosplay dye** - change costume dye with the slider tool, e.g. "cosplay dye"
* **cosplay dyergb [item] '[00000000-FFFFFFFF]'** - change dye to ARGB value, e.g. "cosplay dyergb costume \'FFD699CC\'"
  * valid item values are: "costume", "underwear", "chest", "gloves", "boots"
* **cosplay pantsu** - switch between showing your underwear and costume
* **cosplay enchant [0-15]** - change weapon enchant glow, e.g. "cosplay enchant 13"
* **cosplay tag [text]** - change name tag on costume, e.g. "cosplay tag 'I love Spacecats'"
* **cosplay as [name]** - copy an online player's outfit, e.g. "cosplay as Sasuke.Uchiha"
* **cosplay undress** - revert to your original look
* **cosplay mount** - change your mount to id, e.g. "cosplay mount 261"
* **cosplay dismount** - dismount and revert to your original mount

Any other input, starting with "cosplay", will return a summary of above commands in the chat.  

## Safety
Whatever you send to the proxy chat in game is intercepted client-side. The chat is NOT sent to the server.  
All appearance changes are only visible to your client. Nothing gets changed on the server.  

## Credits  
Based on elin-magic by Pinkie Pie -> https://github.com/pinkipi  
Thanks to Kourin for a better way to generate the Dressing Room -> https://github.com/Mister-Kay  
Thanks to Incedius for help with custom mount support -> https://github.com/incedius  

## Changelog
<details>

### 2.2.14
* [*] Updated S_USER_PAPERDOLL_INFO hook to version 8
### 2.2.13
* [*] Fixed a bug that made you switch back to your original weapon skin during transformation effects
### 2.2.11
* [*] Attempted fix of a rare problem with improper application of changes when leaving the Dressing Room
* [*] Updated S_USER_PAPERDOLL_INFO hook to version 7
* [~] Using raw hooks where it's possible
### 2.2.10
* [*] Fixed Marrow Brooch returning to default look
### 2.2.9
* [*] Improved dyergb function
### 2.2.8
* [*] Definition updates
### 2.2.7
* [*] Fixed JP, TW and SE regions unable to use the "cosplay dye" command
### 2.2.6
* [+] Added "cosplay mount" command
### 2.2.5
* [+] Added support for Node.JS 11
* [+] Added backwards compatibility for Node.JS 10
### 2.2.4
* [-] Removed support for patch versions < 75
### 2.2.3
* [*] Changed Unleashed tracking to not rely on "S_ABNORMALITY_*" hooks any longer
* [*] Fixed a bug that caused a lookup error on closing tera-proxy while trying to save settings
* [-] Deleted obsolete abnormality tracking for Ragnarok
### 2.2.2
* [~] Hat Restyler support needs to be enabled in index.js (only do that when you have the opcodes)
* [+] Add support for Bigint (will now work with Pinkie Pie's tera-proxy again)
### 2.2.0
* [+] Added Hat Restyler support for custom head accessories
* [*] Now using the new contract submodule of tera-game-state
### 2.1.11
* [*] Support for patch versions < 75
### 2.1.10
* [~] Database update
* [~] NA/EU split
### 2.1.9
* [~] Definition update
### 2.1.8
* [~] Code changes due to Caali's recent tera-proxy updates
* [-] Removed support for Pinkie Pie's tera-proxy
### 2.1.7
* [*] Unleashed abnormality id fixed
### 2.1.6
* [+] Added localization for JP, KR, RU, TH, TW regions
### 2.1.5
* [+] Added Footprints
* [*] More optimizations
### 2.1.4
* [*] Presets file now gets generated when not present which fixes an error with auto-update
### 2.1.3
* [*] Fixed mouse handler not getting destroyed on unload
* [*] Fixed "Module did not self-register" error when unloading and reloading the module
* [*] Fixed item preview breaking custom outfit (your outfit will now be reapplied after moving again)
* [+] Started rewriting code to use Caali's "tera-game-state" module in order to reduce overhead
* [~] Changed structure of the mouse hook to remove unnecessary files
### 2.1.2
* [*] Alternate implementation to revert weapon skins after Unleashed
### 2.1.1
* [*] Better error checks
* [*] Fixed the issue of Berserkers' custom weapon skins reverting to the original after using Unleashed
### 2.1.0
* [+] Added new version check (now that I actually understand what's going on)
* [+] Added custom mount support via Dressing Room
* [+] Added "cosplay dismount" command
* [+] Now supports auto-updating via Caali's tera-proxy
* [*] Fixed a bug with not reinitializing some variables when switching to a character without a preset
### 2.0.5
* [-] Removed version check (kept architecture check)
* [~] Item update
### 2.0.4
* [*] Updated hook versions
### 2.0.3
* [+] Added current version output for Node.JS version check
* [~] Item update: Mechanical weapon skins
### 2.0.2
* [~] Updated for NA Counterpunch patch
### 2.0.1
* [*] Fixed a bug for preset-less characters
* [+] Added checks for Node.JS version
* [~] Updated installation guide (tested on different machine successfully)
### 2.0.0
* [*] Major code overhaul
* [*] Some bug fixes
* [~] Updated for Elin Gunner patch
* [~] Reimplemented custom Dressing Room items
* [+] Added complete item and mount databases (only items valid for your character get added to the Dressing Room)
* [+] Added "cosplay as" command
* [+] Added experimental option to dye underwear, chest, gloves and boots to the "cosplay dyergb" command
* [-] Removed obsolete item scanning
### 1.3.0
* [~] Updated for Arsenal patch
* [+] Added "tag" command
* [+] Added Ragnarok fix
* [+] Added option to disable scanning for new costumes in scanner.js
### 1.2.1
* [*] Fixed outfit not immediately reapplying while dying under the effect of Marrow Brooch
### 1.2.0
* [*] Some code cleanup
* [~] Full conversion to Pinkie Pie's command module
### 1.1.0
* [+] Added more commands
* [+] Emulated Marrow Brooch appearance changes
### 1.0.0
* [~] Initial Release

</details>