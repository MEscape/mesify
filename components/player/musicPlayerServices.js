import TrackPlayer, { Event, Capability } from "react-native-track-player";
import { FIREBASE_FIRESTORE } from '../../FirebaseConfig';
import { setDoc, doc } from 'firebase/firestore';
import { YtAction } from "./YtAction";
import { getWaitingQueue, resetTakenInt } from "../../global";
const safedUser = require("../../global").safedUser;

const findPosition = (items, current) => {
    if(items instanceof Array) {
        return items.findIndex((item) => item.id === current.id);
    } else {
        return 0;
    }
}

export async function initPlayer(items, current, liked = false) {
    try {
        const currentPos = findPosition(items, current);
        let item = (items instanceof Array) ? items[currentPos] : items;
        const audioURL = await YtAction(item.id)
    
        const track = {
            title: item.title,
            artist: item.artist,
            artwork: item?.artwork,
            url: audioURL,
            id: item.id,
            liked: liked,
            pid: item.pid
        }
    
        await TrackPlayer.reset();
        await TrackPlayer.add(track);  
        await TrackPlayer.play();

        if(getWaitingQueue().length > 0) 
            TrackPlayer.add(getWaitingQueue());
    
        if(items instanceof Array) {
            let partItems = items.slice(currentPos+1, currentPos+5);
            await queueNextFive(partItems);
        }
    } catch(error) {
        console.log(error);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export async function handleShuffleMode(shuffle) {
    const queue = await TrackPlayer.getQueue();
    const currentTrack = await TrackPlayer.getActiveTrack();
    const waitingQueue = getWaitingQueue();
    let pos = await TrackPlayer.getActiveTrackIndex();

    let before = queue.slice(0, pos);
    let after = queue.slice(pos+1);

    if(shuffle) {
        const iterations = queue.length - 1;
        for(let i = iterations; i >= 0; i--) {
            if(i === pos || i === pos+1) {
                console.log(i, (await TrackPlayer.getQueue())[i]);
                continue;
            } else {
                await TrackPlayer.remove(i);
            }
        }

        const shuffledBefore = shuffleArray(before);
        let shuffledAfter = shuffleArray(after);
        console.log(shuffledBefore)

        const newCurrentTrack = await TrackPlayer.getActiveTrack();

        if(queue.length === 2 && queue[pos+1]) {
            if(currentTrack && newCurrentTrack && currentTrack.id !== newCurrentTrack.id) {
                pos = await TrackPlayer.getActiveTrackIndex();
                const nextTrack = (await TrackPlayer.getQueue())[pos+1];

                if(nextTrack && pos !== -1)
                    shuffledAfter.splice(pos, 1);
            } else {
                await TrackPlayer.remove(pos+1);
            }
        }

        await TrackPlayer.add(shuffledBefore, pos);

        if(waitingQueue.length > 0) 
            await TrackPlayer.add(waitingQueue);

        await TrackPlayer.add(shuffledAfter);
    } else {
        const iterations = queue.length - 1;
        for(let i = iterations; i >= 0; i--) {
            if(i === pos || i === pos+1) {
                continue;
            } else {
                await TrackPlayer.remove(i);
            }
        }
        
        resetTakenInt();

        console.log("NEW QUEUE", await TrackPlayer.getQueue())

        return currentTrack;
    }

    console.log("NEW QUEUE", await TrackPlayer.getQueue())
}

export async function queueNextFive(partItems) {
    let tracks = [];

    for (const song of partItems) {
        const audioURL = await YtAction(song.id);
        const track = {
            title: song.title,
            artist: song.artist,
            artwork: song?.artwork,
            url: audioURL,
            id: song.id,
            liked: song.liked,
            pid: song.pid
        }
    
        tracks.push(track);
    }  

    await TrackPlayer.add(tracks);
}

export const putRecentlyPlayedSongs = async (item) => {
    const firestore = FIREBASE_FIRESTORE;
    
    const historyCollection = doc(firestore, 'user', safedUser.uid, 'history', item.id)
    const track = {
        cover: item?.artwork,
        createdAt: new Date(),
        creator: item.artist,
        title: item.title
    }

    try {
        await setDoc(historyCollection, track)
    } catch (error) {
        console.log(error);
    }
}

export async function addTrack(item, pos) {
    const audioURL = await YtAction(item.id)

    const track = {
        title: item.title,
        artist: item.artist,
        artwork: item?.artwork,
        url: audioURL,
        liked: item.liked,
        id: item.id,
        pid: item.pid
    }

    if(pos) {
        await TrackPlayer.add(track, pos);
    } else {
        await TrackPlayer.add(track);
    }
}

export async function addToWaitingQueue(currentPlaying, nextPlaying) {
    const audioURL = await YtAction(nextPlaying.id);

    const track = {
        title: nextPlaying.title,
        artist: nextPlaying.artist,
        artwork: nextPlaying?.artwork,
        url: audioURL,
        liked: nextPlaying.liked,
        id: nextPlaying.id
    }

    const pos = findPosition(await TrackPlayer.getQueue(), currentPlaying)

    if(pos !== -1) {
        await TrackPlayer.add(track, pos+getWaitingQueue().length);
    }
}

export async function playbackService() {
    await TrackPlayer.updateOptions({
        jumpInterval: 5,
        alwaysPauseOnInterruption: true,
        stopWithApp: true,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
    });

    TrackPlayer.addEventListener(Event.RemotePause, () => {
        TrackPlayer.pause();
    })

    TrackPlayer.addEventListener(Event.RemotePlay, () => {
        TrackPlayer.play();
    })

    TrackPlayer.addEventListener(Event.RemoteNext, () => {
        TrackPlayer.skipToNext();
    })

    TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
        const firstTrack = (await TrackPlayer.getQueue())[0]
        const currentTrack = await TrackPlayer.getActiveTrack();

        if (firstTrack.id === currentTrack.id) {
            await TrackPlayer.seekTo(0);
        } else {
            const position = (await TrackPlayer.getProgress()).position;

            if (position <= 5) {
                await TrackPlayer.seekTo(0);
            } else {
                await TrackPlayer.skipToPrevious();
            }
        }
    })
}