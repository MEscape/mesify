let safedUser = null;
let count = 0;
let waitingQueue = [];
let takenInt = [];

const incrementCount = () => {
    count++;
};

const resetCount = () => {
    count = 0;
};

const setSafedUser = (user) => {
    safedUser = user;
};

const getSafedUser = () => {
    return safedUser;
};

const setWaitingQueue = (item) => {
    waitingQueue.push(item);
};

const removeWaitingQueue = () => {
    waitingQueue.shift();
};

const getWaitingQueue = () => {
    return waitingQueue;
};

const resetWaitingQueue = () => {
    waitingQueue = [];
};

const setTakenInt = (item) => {
    takenInt.push(item);
};

const getTakenInt = () => {
    return takenInt;
};

const resetTakenInt = () => {
    takenInt = [];
};

module.exports = { 
    getCount: () => count, 
    incrementCount: incrementCount,
    resetCount: resetCount,
    setSafedUser: setSafedUser,
    getSafedUser: getSafedUser,
    setWaitingQueue: setWaitingQueue,
    getWaitingQueue: getWaitingQueue,
    removeWaitingQueue: removeWaitingQueue,
    resetWaitingQueue: resetWaitingQueue,
    setTakenInt: setTakenInt,
    getTakenInt: getTakenInt,
    resetTakenInt: resetTakenInt
};