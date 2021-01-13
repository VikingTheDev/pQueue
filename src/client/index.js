let clientID = setInterval(function () {
    if (NetworkIsSessionStarted()) {
        emitNet('pQueue:shiftQueue');
        clearInterval(clientID);
    }
}, 500)