import React, { useState, useContext, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import TrackPlayer, { usePlaybackState, State, RepeatMode } from 'react-native-track-player';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { Player } from "../../PlayerContext";
import { addTrack, handleShuffleMode } from './musicPlayerServices';
import { getWaitingQueue, setTakenInt } from '../../global';

const ControlCenter = () => {
    const playBackState = usePlaybackState();
    const {skipEnabled, setSkipEnabled} = useContext(Player);
    const {isPlaying, setIsPlaying} = useContext(Player);
    const {isShuffled, setIsShuffled} = useContext(Player);
    const [repeatMode, setRepeatMode] = useState(1);
    const {savedTracks, setSavedTracks} = useContext(Player);
    const {suggestions, setSuggestions} = useContext(Player);

    const skipToNext = async () => {
        if(skipEnabled) {
            await TrackPlayer.skipToNext();
        }
    }

    const skipToPrevious = async () => {
        if(skipEnabled) {
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
        }
    }

    const togglePlayback = async () => {
        const currentTrack = await TrackPlayer.getCurrentTrack();

        if(currentTrack !== null) {
            if(playBackState.state === State.Paused || playBackState.state === State.Ready) {
                setIsPlaying(true);
                await TrackPlayer.play();
            } else {
                setIsPlaying(false);
                await TrackPlayer.pause();
            }
        }
    }

    const handleRepeat = async () => {
        const mode = await TrackPlayer.getRepeatMode();
            
        switch(mode) {
            case 0:
                await TrackPlayer.setRepeatMode(RepeatMode.Queue)
                break;
            case 1:
                await TrackPlayer.setRepeatMode(RepeatMode.Off)
                break;
            case 2:
                await TrackPlayer.setRepeatMode(RepeatMode.Track)
                break;
        }

        fetchRepeatMode()
    }

    const findPosition = (items, current) => {
        if(current) {
          return items.findIndex((item) => item.id === current.id);
        } else {
          return -1;
        }
    }

    const handleDeactivateShuffleMode = async () => {
        /*const currentTrack = await handleShuffleMode(false);
        const waitingQueue = getWaitingQueue();
        let parts;

        if(savedTracks.length > 0 && suggestions.length < 1) {
            const currentPos = findPosition(savedTracks, currentTrack);
            const copySavedTracks = [ ...savedTracks ]
            const before = copySavedTracks.splice(currentPos-5, currentPos);
            const after = copySavedTracks.splice(currentPos+1, currentPos+6);

            if(currentPos !== -1) {
                parts = {
                    before: before,
                    after: after,
                    pos: currentPos
                };
            }
        } else {
            const currentPos = findPosition(suggestions, currentTrack);
            const copySuggestions = [ ...suggestions ]
            const before = copySuggestions.splice(currentPos-5, currentPos);
            const after = copySuggestions.splice(currentPos+1, currentPos+6);

            if(currentPos !== -1) {
                parts = {
                    before: before,
                    after: after,
                    pos: currentPos
                };
            }
        }

        if(parts) {
            console.log(parts)

            const newCurrentTrack = await TrackPlayer.getActiveTrack();
            const queueTrackPlayer = await TrackPlayer.getQueue();

            if(queueTrackPlayer.length === 2) {
                if(currentTrack && newCurrentTrack && currentTrack.id !== newCurrentTrack.id) {
                    const pos = findPosition(parts.after, newCurrentTrack);
                    if(pos !== -1) 
                        parts.after = parts.after.splice(pos, 1);
                } else {
                    const pos = findPosition(queueTrackPlayer, currentTrack);
                    if(pos !== -1) 
                        await TrackPlayer.remove(pos+1);
                }
            }

            for(let i = 0; i < parts.before.length; i++)
                await addTrack(parts.before[i], parts.pos+i);

            if(waitingQueue.length > 0) 
                await TrackPlayer.add(waitingQueue);

            console.log("D")

            for(after of parts.after)
                await addTrack(after);

            console.log("E")
        }*/
    }

    const handleShuffle = async () => {
        if(skipEnabled) {
            if(isShuffled) {
                setIsShuffled(false);
                setSkipEnabled(false);
                handleDeactivateShuffleMode()
                
                setSkipEnabled(true);
            } else {
                setIsShuffled(true);
                await handleShuffleMode(true);
            }
        }
    }

    const fetchRepeatMode = async () => {
        const mode = await TrackPlayer.getRepeatMode();
        setRepeatMode(mode);
    };

    useEffect(() => {
        fetchRepeatMode();
    }, []);

    return (
        <View
            style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 17,
            }}
        >
            <Pressable
                onPress={handleShuffle}
            >
                <FontAwesome 
                    name="arrows" 
                    size={30} 
                    color={
                        isShuffled && skipEnabled ? "#03C03C" : 
                        "#C0C0C0"
                    }
                />
            </Pressable>
            <Pressable onPress={skipToPrevious}>
                <Ionicons name="play-skip-back" size={30} color={skipEnabled ? "white" : "#C0C0C0"} />
            </Pressable>
            <Pressable onPress={() => togglePlayback()}>
                {isPlaying && playBackState.state !== State.Paused ? (
                    <AntDesign name="pausecircle" size={60} color="white" />
                ) : (
                    <Pressable
                    onPress={() => togglePlayback()}
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: "white",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                    >
                    <Entypo name="controller-play" size={26} color="black" />
                    </Pressable>
                )}
            </Pressable>
            <Pressable onPress={skipToNext}>
                <Ionicons name="play-skip-forward" size={30} color={skipEnabled ? "white" : "#C0C0C0"} />
            </Pressable>
            <Pressable
                onPress={handleRepeat}
            >
                <Feather 
                    name="repeat" 
                    size={30} 
                    color={
                        repeatMode === 0 ? "#C0C0C0" : 
                        repeatMode === 2 ? "white" :
                        "#03C03C"
                    }
                />
            </Pressable>
        </View>
    )
}

export default ControlCenter;