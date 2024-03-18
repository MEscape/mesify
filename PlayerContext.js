import { createContext,useState } from "react";
import TrackPlayer from "react-native-track-player";

const Player = createContext();

const PlayerContext = ({children}) => {
    const [currentTrack,setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [savedTracks, setSavedTracks] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSong, setIsLoadingSong] = useState(false);
    const [isShuffled, setIsShuffled] = useState(false);
    const [skipEnabled, setSkipEnabled] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [playlists, setPlaylists] = useState([]);

    const handlePlayTrack = async () => {
        if(isPlaying) {
            setIsPlaying(false);
            await TrackPlayer.pause();
        } else {
            setIsPlaying(true);
            await TrackPlayer.play();
        }
    };

    return (
        <Player.Provider 
            value={{
                playlists,
                setPlaylists,
                isShuffled,
                setIsShuffled,
                searchHistory,
                setSearchHistory,
                suggestions,
                setSuggestions,
                skipEnabled,
                setSkipEnabled,
                isLoadingSong,
                setIsLoadingSong,
                currentTrack,
                setCurrentTrack,
                isPlaying,
                setIsPlaying,
                savedTracks,
                setSavedTracks,
                handlePlayTrack,
            }}
        >
            {children}
        </Player.Provider>
    )
}

export {PlayerContext,Player}