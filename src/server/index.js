const config = require("./src/server.config.json");

// TODO: Make it so a users connection will be interupted if a discord ID is not found. Find a more effective way to prevent more than one user from connecting at the same time.
// Possibly reserve a few slots on the server for staff incase they have to get in server quickly. Add Adaptive Cards. Integrate config file.

on('playerConnecting', (name, setKickReason, deferrals) => {
    deferrals.defer(); // stops the user from being connected to the server
    deferrals.update(`Hello ${name}. Your discord roles are currently being checked...`); // updates the message on the users screen
    const src = global.source;
    
    for (let i = 0; i < GetNumPlayerIdentifiers(src); i++) { // finds the users discord ID
        const identifier = GetPlayerIdentifier(src, i);

        if (identifier.includes('discord:')) {
            discordIdentifier = identifier.slice(8);
        }
    } 
    console.log(priorityQueue.front().element)  //temporary debug logs
    addToQueue(discordIdentifier , src); // add the player to the queue
    var intervalId = setInterval(function () {
        for (let i = 0; i < GetNumPlayerIdentifiers(src); i++) {
            const identifier = GetPlayerIdentifier(src, i);
    
            if (identifier.includes('discord:')) {
                discordIdentifier = identifier.slice(8);
            }
        } 
        x = 0;
        checkQueue(x, (cb) => { //checks if there is open server slots
            if(cb == true) {
                if(priorityQueue.front().element == discordIdentifier) { // checks if the user is number 1 in the queue
                    deferrals.done(); // allows the user to connect to the server
                    x = 1
                    removeFromQueue(discordIdentifier); //removes the user from the queue (after 10 seconds to prevent more than one user to connect at the same time)
                    clearInterval(intervalId); // stops the interval
                }
                else {
                    deferrals.update(`You are in queue [${findInQueue(discordIdentifier) + 1}/${priorityQueue.items.length}]`); //updates the queue message and adds the queue posistion
                }
            }
            else {
                deferrals.update(`You are in queue [${findInQueue(discordIdentifier) + 1}/${priorityQueue.items.length}]`); //updates the queue message and adds the queue posistion
            }
        })
    }, 10000);
})

setInterval(function removeGhostUsers() { //removes users that have disconnected from the server from the queue
    for (var i = 0; i < priorityQueue.items.length; i++) {
        if(GetPlayerName(priorityQueue.items[i].source) == null){
            if(config.settings.debug) {
                console.log(`[DEBUG] Removed ghost user: ${priorityQueue.items[i].element}`)
            }
            removeFromQueue(priorityQueue.items[i].element)
        }
    }
}, 30000)

setInterval(function () { // temporary debug function
    console.log("[DEBUG] Queue: " + priorityQueue.printQueue())
}, 10000)

function addToQueue (identifier, src) { // adds a user to the queue
    emit('sPerms:getPerms', src, (perms) => {
        userPerms = perms;
        let prio 
        switch (true) {
            case userPerms.category.donoBypass: 
                prio = 1
            break;
            case userPerms.category.staff:
                prio = 2
            break;
            case userPerms.category.donator:
                prio = 3
            break;
            default:
                prio = 4
            break;
        }
        priorityQueue.insert(identifier, prio, src);
        if (config.settings.debug) {
            console.log(`[DEBUG] ${identifier} has been added to the queue with priority ${prio}`)
        }
    })
};

function removeFromQueue(identifier) { // removes a user from the queue 
    setTimeout(function() {for (var i = 0; i < priorityQueue.items.length; i++) {
        if (priorityQueue.items[i].element == identifier) {
            priorityQueue.items.splice(i, 1);
            break;
        };
    }
    if (config.settings.debug) {
        console.log(`[DEBUG] ${identifier} has been removed from the queue. \nQueue: ${priorityQueue.printQueue()}`)
    }
    }, 10100)
}

function findInQueue(identifier) { // find the user's placement in the queue
    for (var i = 0; i < priorityQueue.items.length; i++) {
        if (priorityQueue.items[i].element == identifier) {
            return i;
        }
    }
}

function checkQueue(x, cb) { // check if the server is full
    if (GetNumPlayerIndices() + x < GetConvar("sv_maxclients")) {
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
    insert(element, priority, source, name)
    {
        // creating object from queue element
        var qElement = new QElement(element, priority, source);
        var contain = false;

        // iterating through the entire item array to add element at the correct location of the Queue
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > qElement.priority) {
                // Once the correct location is found it is enqueued
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
            str += this.items[i].name + ", ";
        return str;
    }
}

var priorityQueue = new PriorityQueue();