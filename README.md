##### :heavy_exclamation_mark: Status :heavy_exclamation_mark:
Updated for NA Counterpunch patch. If your character is missing its head, use "/8 cosplay undress" and redo your outfit via the Dressing Room.  
  
##### :heavy_exclamation_mark: Installation :heavy_exclamation_mark:
1) Make sure you have Node.JS 9.3.0 x64 or newer installed: https://nodejs.org/dist/v9.4.0/node-v9.4.0-x64.msi
2) Update your tera-data: https://github.com/meishuu/tera-data
3) Download Cosplayer: https://github.com/TeraProxy/Cosplayer/archive/master.zip
4) Extract the contents of the zip file into "\tera-proxy\bin\node_modules\"
5) Cosplay!

If you enjoy my work and wish to support future development, feel free to drop me a small donation: [![Donate](https://www.paypalobjects.com/webstatic/en_US/i/buttons/PP_logo_h_100x26.png)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=A3KBZUCSEQ5RJ&lc=US&item_name=TeraProxy&curency_code=USD&no_note=1&no_shipping=1&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)

## New in version 2.0.0
### Change in functionality
Bluehole Studios fixed the bug that was abused to save Dressing Room items on mouse click.  
So we'll just abuse something else from now on: Hover over an item in the Dressing Room until you see its tooltip appear (should happen almost immediately). 
On your next right click (NOT left lick) in the Dressing Room, the item over which you hovered last will be applied to your character. Easy enough, right?  
Also some text commands changed. Refer to "Usage" below.  
### Changes in Dressing Room generation
A complete list of possible Dressing Room items for your character will be generated on login.  
The databases for this will from now on be parsed directly from the datacenter. So when a new costume patch hits, check for a Cosplayer update.  
No more manual scanning, no more duplicates.  
### The "cosplay as" command
This new command copies an online player's outfit over to your character. To make sure nothing bad happens, only items suitable for your character are applied.  
In other words: If the other player and you share the same gender and race, you'll copy the whole outfit (except for the weapon if the class is different).  
### Experimental "cosplay dyergb" expansion
The client supports changing the colors of many more items than just your costume. Won't always have a visible effect though.  
Nevertheless, you can for now use the "cosplay dyergb" command followed by "costume", "underwear", "chest", "gloves" or "boots" to experiment.  

# Cosplayer
A tera-proxy module able to change your client-side appearance.  
Changes to your character are saved on your hard drive and reloaded on next login.  
  
## Usage  
1) Open the Dressing Room  
2) Hover over an item until you see its tooltip appear  
3) Right click  
That's it! Or use one of the many commands below.  
  
While in game, open a proxy chat session by typing "/proxy" or "/8" in chat and hitting the space bar.  
This serves as the script's command interface.  
The following commands are supported:  
  
* cosplay weapon [id] - change your weapon skin to id, e.g. "cosplay weapon 99272"
* cosplay costume [id] - change your costume skin to id, e.g. "cosplay costume 180722"
* cosplay back [id] - change your back skin to id, e.g. "cosplay back 180081"
* cosplay face [id] - change your mask skin to id, e.g. "cosplay face 181563"
* cosplay head [id] - change your hair adornment to id, e.g. "cosplay head 252972"
* cosplay underwear [id] - change your innerwear skin to id, e.g. "cosplay underwear 97936"
* cosplay footprints [id] - change your footprints to id, e.g. "cosplay footprints 99579"
* cosplay dye - change costume dye with the slider tool, e.g. "cosplay dye"
* cosplay dyergb [item] '[0-255 0-255 0-255]' - change dye to rgb value, e.g. "cosplay dyergb costume \'214 153 204\'"
** valid item values are: "costume", "underwear", "chest", "gloves", "boots"
* cosplay pantsu - switch between showing your underwear and costume
* cosplay enchant [0-15] - change weapon enchant glow, e.g. "cosplay enchant 13"
* cosplay tag [text] - change name tag on costume, e.g. "cosplay tag 'I love Spacecats'"
* cosplay as [name] - copy an online player's outfit, e.g. "cosplay as Sasuke.Uchiha"
* cosplay undress - goes back to your actual look
  
Any other input, starting with "cosplay", will return a summary of above commands in the chat.  
  
## Safety
Whatever you send to the proxy chat in game is intercepted client-side. The chat is NOT sent to the server.  
All appearance changes are only visible to your client. Nothing gets changed on the server.  
  
## Credits  
Based on elin-magic by Pinkie Pie https://github.com/pinkipi  
Thanks to Kourin for a better way to generate the Dressing Room https://github.com/Mister-Kay  
  
## Changelog
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