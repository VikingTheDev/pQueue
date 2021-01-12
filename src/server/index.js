const config = require("./src/server.config.json");

on('playerConnecting', (name, setKickReason, deferrals) => {
    deferrals.defer();
    deferrals.update(`Hello ${name}. Your discord roles are currently being checked...`);
    const src = global.source;
    
    for (let i = 0; i < GetNumPlayerIdentifiers(src); i++) {
        const identifier = GetPlayerIdentifier(src, i);

        if (identifier.includes('discord:')) {
            discordIdentifier = identifier.slice(8);
        }
    } 
    console.log(priorityQueue.front().element)
    addToQueue(discordIdentifier , src, name);
    var intervalId = setInterval(function () {
        for (let i = 0; i < GetNumPlayerIdentifiers(src); i++) {
            const identifier = GetPlayerIdentifier(src, i);
    
            if (identifier.includes('discord:')) {
                discordIdentifier = identifier.slice(8);
            }
        } 
        SetConvar("sv_maxclients", 1)
        x = 0;
        checkQueue(x, (cb) => {
            if(cb == true) {
                if(priorityQueue.front().element == discordIdentifier) {
                    deferrals.done();
                    x = 1
                    removeFromQueue(discordIdentifier);
                    clearInterval(intervalId);
                }
                else {
                    deferrals.update(`You are in queue [${findInQueue(discordIdentifier) + 1}/${priorityQueue.items.length}]`);
                }
            }
            else {
                deferrals.update(`You are in queue [${findInQueue(discordIdentifier) + 1}/${priorityQueue.items.length}]`);
            }
        })
    }, 10000);
})

setInterval(function removeGhostUsers() {
    for (var i = 0; i < priorityQueue.items.length; i++) {
        if(GetPlayerName(priorityQueue.items[i].source) == null){
            if(config.settings.debug) {
                console.log(`[DEBUG] Removed ghost user: ${priorityQueue.items[i].element}`)
            }
            removeFromQueue(priorityQueue.items[i].element)
        }
    }
}, 30000)

setInterval(function () {
    console.log("[DEBUG] Queue: " + priorityQueue.printQueue())
}, 10000)

function addToQueue (identifier, src, name) {
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
        priorityQueue.insert(identifier, prio, src, name);
        if (config.settings.debug) {
            console.log(`[DEBUG] ${identifier} has been added to the queue with priority ${prio}`)
        }
    })
};

function removeFromQueue(identifier) {
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

function findInQueue(identifier) {
    for (var i = 0; i < priorityQueue.items.length; i++) {
        if (priorityQueue.items[i].element == identifier) {
            return i;
        }
    }
}

function checkQueue(x, cb) {
    if (GetNumPlayerIndices() + x < GetConvar("sv_maxclients")) {
        cb(true);
    }
    else {
        cb(false);
    }
}

var zz = 0;
function checkQueueTest(cb) {
    if(zz == 1000) {
        cb(true);
    }
    else {
        zz++
        cb(false);
    }
}

// User defined class
// to store elements and its priority
class QElement {
    constructor(element, priority, source, name)
    {
        this.element = element;
        this.priority = priority;
        this.source = source;
        this.name = name;
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
        var qElement = new QElement(element, priority, source, name);
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