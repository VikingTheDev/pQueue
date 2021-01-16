const config = require("./src/queue.config.json");

// Originally written by devpetrikov for use in Sunshine State RP (discord.gg/ssrp)

StopResource("hardcap"); // Stopping the hardcap resource as it will reject connections when the server is full and thus the queue won't work
var msg;

on('playerConnecting', (name, setKickReason, deferrals) => {
    deferrals.defer(); // stops the user from being connected to the server
    deferrals.update(`Hello ${name}. Your discord roles are currently being checked...`); // updates the message on the users screen
    const src = global.source;
    let idFound = false;
    for (let i = 0; i < GetNumPlayerIdentifiers(src); i++) { // finds the users discord ID
        const identifier = GetPlayerIdentifier(src, i);

        if (identifier.includes('discord:')) {
            discordIdentifier = identifier.slice(8);
            idFound = true;
        };
    };
    if(!idFound) {
        deferrals.done(config.settings.noDiscordRejectMsg); //rejects the connecting user if they don't have a dicsord ID
    }    
    addToQueue(discordIdentifier , src); // add the player to the queue
    var intervalId = setInterval(function () {
        for (let i = 0; i < GetNumPlayerIdentifiers(src); i++) {
            const identifier = GetPlayerIdentifier(src, i);
            if (identifier.includes('discord:')) {
                discordIdentifier = identifier.slice(8);
            }
        } 
        if (!isUserInQueue(discordIdentifier)) { // stops the interval if the user is no longer in the queue
            clearInterval(intervalId);
        }
        checkQueue((cb) => { //checks if there is open server slots
            if(cb == true) {
                if (GetConvar("sv_maxclients") - GetNumPlayerIndices() > 4) { //Checks if there's more than 5 open slots
                    if(config.settings.alwaysUse)  { // checks if the alwaysUse setting is enabled
                        if(priorityQueue.front().element == discordIdentifier) { // checks if the user is number 1 in the queue
                            deferrals.done(); // allows the user to connect to the server
                            console.log(`Connecting: ${name}`) // since hardcap is stopped we have to log connecting users
                            clearInterval(intervalId); // stops the interval
                        }
                        else {
                            msg = `You are in queue [${findInQueue(discordIdentifier) + 1}/${priorityQueue.items.length}]`;
                            updateCard(callback => { // call the function to update the adaptive card content
                                deferrals.presentCard(callback); // update the card on client side
                            })
                        }
                    }
                    else { // if there's more than 5 open slots and the alwaysUse setting is not disabled allow the user to connect without going through the queue
                        deferrals.done();
                    }
                }
                else {
                    if(priorityQueue.front().element == discordIdentifier) { // checks if the user is number 1 in the queue
                        deferrals.done(); // allows the user to connect to the server
                        console.log(`Connecting: ${name}`) // since hardcap is stopped we have to log connecting users
                        clearInterval(intervalId); // stops the interval
                    }
                    else {
                        msg = `You are in queue [${findInQueue(discordIdentifier) + 1}/${priorityQueue.items.length}]`;
                            updateCard(callback => { // call the function to update the adaptive card content
                                deferrals.presentCard(callback); // update the card on client side
                            })
                    }
                }
            }
            else {
                msg = `You are in queue [${findInQueue(discordIdentifier) + 1}/${priorityQueue.items.length}]`;
                            updateCard(callback => { // call the function to update the adaptive card content
                                deferrals.presentCard(callback); // update the card on client side
                            })
            }
        })
    }, 500);
})

onNet('pQueue:shiftQueue', () => { //Removes the user in posistion 1 once they have connected to the server
    if(config.settings.debug) {
        console.log(`[DEBUG] ${priorityQueue.front().element} has been removed from the queue.`)
    }
    priorityQueue.remove();
})

setInterval(function removeGhostUsers() { //checks for and removes ghost users every 15 seconds
    for (var i = 0; i < priorityQueue.items.length; i++) {
        if(GetPlayerName(priorityQueue.items[i].source) == null){
            if(config.settings.debug) {
                console.log(`[DEBUG] Removed ghost user: ${priorityQueue.items[i].element}`)
            }
            removeFromQueue(priorityQueue.items[i].element)
        }
    }
}, 15000)

if (config.settings.debug) {
    setInterval(function () { // debug function that prints the queue every 15 seconds
        console.log("[DEBUG] Queue: " + priorityQueue.printQueue())
    }, 15000);
};

function isUserInQueue (identifier) { // Checks if the user is still in the queue 
    let b = false;
    for(let i = 0; i < priorityQueue.items.length; i++) {
        if (priorityQueue.items[i].element == identifier) {
            b = true;
            return b;
        }
    }
}

function addToQueue (identifier, src) { // adds a user to the queue
    emit('sPerms:getPerms', src, (perms) => {
        userPerms = perms;
        let prio = config.defaultPrio; 
        for (let i = 0; i < config.priority_setup.length; i++) {
            let setup = config.priority_setup[i];
            if(userPerms[setup.category][setup.role]) {
                prio = setup.prio;
                break;
            }
        }
        priorityQueue.insert(identifier, prio, src);
        if (config.settings.debug) {
            console.log(`[DEBUG] ${identifier} has been added to the queue with priority ${prio}`)
        }
    })
};

function removeFromQueue(identifier) { // removes a user from the queue 
    for (var i = 0; i < priorityQueue.items.length; i++) {
        if (priorityQueue.items[i].element == identifier) {
            priorityQueue.items.splice(i, 1);
            if (config.settings.debug) {
                console.log(`[DEBUG] ${identifier} has been removed from the queue.`)
            }
            break;
        };
    }
}

function findInQueue(identifier) { // find the user's placement in the queue
    for (var i = 0; i < priorityQueue.items.length; i++) {
        if (priorityQueue.items[i].element == identifier) {
            return i;
        }
    }
}

function checkQueue(cb) { // check if the server is full
    if (GetNumPlayerIndices() < GetConvar("sv_maxclients")) {
        cb(true);
    }
    else {
        cb(false);
    }
}

// User defined class
// to store elements and its priority
class QElement {
    constructor(element, priority, source)
    {
        this.element = element;
        this.priority = priority;
        this.source = source;
    }
}

// PriorityQueue class
class PriorityQueue {

    // An array is used to implement priority
    constructor()
    {
        this.items = [];
    }

    // insert function to add element to the queue as per priority
    insert(element, priority, source)
    {
        // creating object from queue element
        var qElement = new QElement(element, priority, source);
        var contain = false;

        // iterating through the entire item array to add element at the correct location of the Queue
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > qElement.priority) {
                // Once the correct location is found it is inserted
                this.items.splice(i, 0, qElement);
                contain = true;
                break;
            };
        }

        // if the element have the highest priority it is added at the end of the queue
        if (!contain) {
            this.items.push(qElement);
        }
    }

    // remove method to remove element from the queue
    remove()
    {
        //return the remove element and remove it. If the queue is empty returs UnderFlow
        if (this.isEmpty())
            return "UnderFlow";
        return this.items.shift();
    }
    
    // front function
    front() {
        //returns the highest priority element in the priority queue wightout removing it
        if (this.isEmpty()) 
            return "No elements in Queue";
        return this.items[0];
    }

    // rear function
    rear() {
        // returns the lowest priority element of the queue
        if (this.isEmpty()) 
            return "No elements in Queue";
        return this.items[this.items.length -1];
    }
    // isEmpty function
    isEmpty() {
        //return true if the queue is empty.
        return this.items.length == 0;
    }
    // printQueue function prints all the elements of the queue
    printQueue()
    {
        var str = "";
        for (var i = 0; i < this.items.length; i++)
            str += this.items[i].element + ", ";
        return str;
    }
}

var priorityQueue = new PriorityQueue();

function updateCard(callback) { // Updates the adaptive card content and sends a callback with said content so that it can be sent to the user
    var card = {
        "type":"AdaptiveCard",
        "body":[
            {
                "type":"Image",
                "url": config.adaptiveCard.card_header,
                "horizontalAlignment":"Center"
            },
            {
                "type":"Container",
                "items":
                [
                    {
                        "type":"TextBlock",
                        "text": config.adaptiveCard.card_title,
                        "wrap":true,
                        "fontType":"Default",
                        "size":"ExtraLarge",
                        "weight":"Bolder",
                        "color":"light",
                        "horizontalAlignment":"Center",
                        "isVisible": config.adaptiveCard.card_title_isVisible
                    },
                    {
                        "type":"TextBlock",
                        "text": msg,
                        "wrap":true,
                        "size":"Large",
                        "weight":"Bolder",
                        "color":"Light",
                        "horizontalAlignment":"Center"
                    },
                    {
                        "type":"TextBlock",
                        "text": config.adaptiveCard.card_description,
                        "wrap":true,
                        "color":"Light","size":"Medium",
                        "horizontalAlignment":"Center"
                    },
                    {
                        "type":"ColumnSet","height":"stretch",
                        "minHeight":"35px","bleed":true,
                        "horizontalAlignment":"Center",
                        "columns":
                        [
                            {
                                "type":"Column",
                                "width":"stretch",
                                "items":
                                [
                                    {
                                        "type":"ActionSet",
                                        "actions":
                                        [
                                            {
                                                "type":"Action.OpenUrl",
                                                "title": config.adaptiveCard.button1_title,
                                                "url": config.adaptiveCard.button1_url,
                                                "style":"positive"
                                            }
                                        ]
                                    }
                                ],
                                "height":"stretch"
                            },
                            {
                                "type":"Column","width":"stretch",
                                "items":
                                [
                                    {
                                        "type":"ActionSet",
                                        "actions":
                                        [
                                            {
                                                "type":"Action.OpenUrl",
                                                "title": config.adaptiveCard.button2_title,
                                                "style":"positive",
                                                "url": config.adaptiveCard.button2_url
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "style":"default",
                "bleed":true,
                "height":"automatic",
                "isVisible":true
            }
        ],
        "$schema":"http://adaptivecards.io/schemas/adaptive-card.json",
        "version":"1.3"
    }
    callback(card);
}