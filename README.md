# Cosplayer
A tera-proxy module able to change your client-side appearance.  
Automatically updates dressing room with missing items upon seeing them ingame.  
Changes to your character are saved on your hard drive and reloaded on next login.  
  
## Usage  
Open the dressing room and select an outfit. That's it! Or use one of the many commands below.  
  
While in game, open a proxy chat session by typing "/proxy" or "/8" in chat and hitting the space bar.  
This serves as the script's command interface.  
The following commands are supported:  
  
* cosplay dye - change dye with the ingame slider tool 
* cosplay dyergb '[0-255 0-255 0-255]' - change dye to rgb value, e.g. "cosplay dyergb '214 153 204'"
* cosplay weapon [id] - change your weapon skin to id, e.g. "cosplay weapon 99272"
* cosplay costume [id] - change your costume skin to id, e.g. "cosplay costume 180722"
* cosplay back [id] - change your back skin to id, e.g. "cosplay back 180081"
* cosplay mask [id] - change your mask skin to id, e.g. "cosplay mask 181563"
* cosplay hair [id] - change your hair adornment to id, e.g. "cosplay hair 252972"
* cosplay innerwear [id] - change your innerwear skin to id, e.g. "cosplay innerwear 97936"
* cosplay pantsu - switch between innerwear and costume
* cosplay enchant [0-15] - change weapon enchant glow, e.g. "cosplay enchant 13"
* cosplay tag [name] - change name tag on costume, e.g. "cosplay tag 'I love Spacecats'"
* cosplay undress - goes back to your actual look
  
Any other input, starting with "cosplay", will return a summary of above commands in the chat.  
If you want to disable scanning for new costumes change "DISABLE" in scanner.js to "true".  
  
## Safety
Whatever you send to the proxy chat in game is intercepted client-side. The chat is NOT sent to the server.  
All appearance changes are only visible to your client. Nothing gets changed on the server.  
  
## Credits  
Contains code from elin-magic by Pinkie Pie https://github.com/pinkipi  
Contains code from from elin-magic's extension cosplay-ex by Bernkastel https://github.com/Bernkastel-0  
Thanks to Pentagon for the default costume database  
  
## Changelog
### 1.3.0
* [*] Updated for Arsenal Patch
* [+] Added "tag" command
* [+] Added Ragnarok fix
* [+] Added option to disable scanning for new costumes in scanner.js
### 1.2.1
* [*] Fixed outfit not immediately reapplying while dying under the effect of Marrow Brooch
### 1.2.0
* [*] Some code cleanup
* [*] Full conversion to Pinkie Pie's command module
### 1.1.0
* [+] Added more commands
* [+] Emulated Marrow Brooch appearance changes
### 1.0.0
* [*] Initial Release
