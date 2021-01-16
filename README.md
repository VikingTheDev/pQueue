# pQueue

This is a FiveM server queue with discord based priority built on [SpaceTheDev](https://github.com/SpaceTheDev/)'s Discord API.
You **NEED** [sPerms](https://forum.cfx.re/t/release-sperms-real-time-discord-perms/1686063) and [sDiscord](https://forum.cfx.re/t/release-sdiscord/168002) for this resource to work.

# Installation
Copy or download the resource in your resource folder, and add ``ensure pQueue`` to your ``server.cfg``

# Config
The config (`queue.config.json`) file can be found in the ``src`` folder.
In the config file you will find three different sections the first being the settings section:
```js
"settings": {
        "debug": false,
        "alwaysUse": false,
        "noDiscordRejectMsg": "Change Me" 
    }
```
``debug`` Will enable debug messages in your console, such as: users being added to the queue and their priority, users being removed from the queue and the queue itself.

``alwaysUse`` If set to true the queue will ALWAYS be used, regardless of the number of people in server, this will only allow one user to connect at a time. If set to false the queue will only take effect if there's < 5 open slots.

``noDiscordRejectMsg`` The message presented to a user when rejected for not having a Discord ID.




The next section is for customizing the Adaptive Card UI presented to users while in the queue. Should be obvious what the different settings do, see the screenshot or the comments down below if you are still unsure. 
**Note: If you copy this over to your config file the comments MUST be removed**
```js
"adaptiveCard": {
        "card_title_isVisible": false, // decides whether the title is visible, defaults to false as you will most likely have your community name in the header.
        "card_title": "Title", // the cards title, recommended use is for your community's name.
        "card_header": "https://i.ibb.co/6DWQg68/dxIwJT3.png", // a link to the header picture
        "card_description": "card description", // a short description can be used for messages such as "While you're waiting check out our Discord"
        "button1_title": "Button 1", // The title for the first button
        "button1_url": "https://discord.gg/ssrp", // The URL the first button should open.
        "button2_title": "Button 2", // The title for the second button
        "button2_url": "https://instagram.com/ssrp.leo/" // The URL the second button should open.
    },
```
![Alt text](https://i.ibb.co/7CT9rQK/Screenshot-29.png "Adaptive Card Layout")




The third and the final section is the most complicated to set up as it requires an understanding of how [sPerms](https://forum.cfx.re/t/release-sperms-real-time-discord-perms/1686063) and [sDiscord](https://forum.cfx.re/t/release-sdiscord/168002) works, as well as some experience with working with objects in JS. But if you follow all the following steps you should be able to set everything up without problems:

1. Download and set up sDiscord and sPerms

2. Add the roles you want to set up priority for in the sPerms config file (src/config.json).
In the config file the individual roles are divided into categories, example configuration:
```js
{
  "discordRoles": {
    "administration": {
      "owner": "Discord Role ID", 
      "coOwner": "Discord Role ID",
      "headDev": "Disord Role ID"
    },
    "staff": {
      "admin": "Discord Role ID",
      "mod": "Discord Role ID"
    }
  },
  "needDiscord": false
}
```
When sPerms builds the ``perms`` object it checks each individual role, but also the different categories (if you have one role in a category, the category will return as true). We can see the built ``perms`` object by going into the client script in sPerms (src/client/index.js) and adding ``console.log(perms)`` to the ``sPerms:setPerms`` event, this will log the object in the player's console when they first spawn in:

![Alt text](https://i.ibb.co/kgmv3v1/image-2021-01-16-210720.png "Structure of the built perms")

3. Add the roles you want to set up for priority to the ``pQueue`` config file (``queue.config.json``).
```js
{
  "category": "category",
  "role": "roleName
  "prio": 1
}
```
``category`` If you want to check for an individual role this should be the category the role is under, ex. staff. If you want to check for a whole category this should just be "category"

``role`` If you are checking for a role, this should be the name of the role, ex. owner. If you are checking a whole category it should be the name of the category ex. staff.

``prio`` This is the priority, the lower the number the higher the priority. (Use whole numbers)

Here is an example for how you could set up the priority:
```js 
{
    "category": "administration",
    "role": "owner",
    "prio": 1
},
{
    "category": "category",
    "role": "administration",
    "prio": 2
},
{
    "category": "category",
    "role":  "staff",
    "prio": 3
}
```
**NOTE: Make sure you sort the priority from highest to lowest, if not the script will not use your highest priority if a user has multiple roles**

Lastly, set ``defaultPrio`` to a higher number than all the priority roles/categories, in the last example it would be ``4`` or higher.


If everything has been done correctly, the script should now work as intended. If you have any issues, feel free to reach out to me on Discord (MightyViking#9126)
