# Cosplayer
A tera-proxy module able to change your client-side appearance.  
Automatically updates dressing room with missing items upon seeing them ingame.  
Changes to your character are saved on your hard drive and reloaded on next login.  
  
## Usage  
Open the dressing room and select an outfit. That's it! Or use one of the many commands below.  

While in game, open a whisper chat session with "!Cosplayer" by typing "/w !cosplayer" in chat and hitting the space bar.
This serves as the script's command interface. 
The following commands are supported:  
  
* dye - change dye with the ingame slider tool 
* dyergb [0-255 0-255 0-255] - change dye to rgb value, e.g. dyergb 214 153 204
* weapon [id] - change your weapon skin to id, e.g. weapon 99272
* costume [id] - change your costume skin to id, e.g. costume 180722
* back [id] - change your back skin to id, e.g. back 180081
* mask [id] - change your mask skin to id, e.g. mask 181563
* hair [id] - change your hair adornment to id, e.g. hair 252972
* innerwear [id] - change your innerwear skin to id, e.g. innerwear 97936
* pantsu - switch between innerwear and costume
* enchant [0-15] - change weapon enchant glow, e.g. enchant 13
* undress - goes back to your actual look
* head - switch between big and normal head
* height [x] - changes your height to x, default is 0, e.g. height -3
* thighs [x] - changes your thighs to x, default is 0, e.g. thighs -3
* chest [x] - changes your chest to x, default is 0, e.g. chest -3
  
Any other input returns a summary of above commands in the game.
  
## Safety
Whatever you send to "!Cosplayer" ingame is intercepted client-side. The chat is NOT sent to the server.  
Your changed appearance is only visible for yourself. Other players keep seeing your real appearance stored on the server.  