onNet('pQueue:networkStarted', (cb)=> {
    if (NetworkIsSessionStarted()) {
        cb(true);
    }
    else {
        cb(false);
    }
})