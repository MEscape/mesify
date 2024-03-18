import React, { useContext, useEffect } from 'react';
import { 
    View, 
    StyleSheet, 
    Dimensions, 
    Text, 
    Image, 
    Pressable,
    ActivityIndicator
} from 'react-native';
import SongInfo from '../components/player/SongInfo';
import SongSlider from '../components/player/SongSlider';
import ControlCenter from '../components/player/ControlCenter';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import { Player } from "../PlayerContext";
import TrackPlayer, { State, usePlaybackState, Event } from 'react-native-track-player';

const {width} = Dimensions.get('window');

function MusicPlayer({ setModalVisible, modalVisible }) {
    const playBackState = usePlaybackState();
    const {currentTrack, setCurrentTrack} = useContext(Player);
    const {isLoadingSong, setIsLoadingSong} = useContext(Player);
    const {isPlaying, setIsPlaying} = useContext(Player);

    useEffect(() => {
        TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
            setIsPlaying(false);
            await TrackPlayer.skip(0);
            await TrackPlayer.pause();
        });

        if(playBackState.state !== State.Playing && isPlaying) {
            setIsLoadingSong(true);
        } else {
            setIsLoadingSong(false);
        }
    }, [playBackState.state])

    return (
        <View style={{ height: "100%", width: "100%", marginTop: 20 }}>
            <Pressable
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <AntDesign
                    onPress={() => setModalVisible(!modalVisible)}
                    name="down"
                    size={24}
                    color="white"
                />

                <Text
                    style={{ fontSize: 14, fontWeight: "bold", color: "white" }}
                >
                    {currentTrack?.title}
                </Text>

                <Entypo name="dots-three-vertical" size={24} color="white" />
            </Pressable>

            <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={{ padding: 10 }} >
                    <View style={{ position: 'relative' }}>
                            <Image
                                style={{ width: "100%", height: 330, borderRadius: 4 }}
                                source={{ uri: currentTrack?.artwork }}
                            />
                            {isLoadingSong ? (
                                <ActivityIndicator 
                                style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center'}}
                                size="120"
                                color="white"
                                />
                            ) : null }
                        </View>
                    <SongInfo track={currentTrack} />
                </View>

                <SongSlider />
                <ControlCenter />
            </View>
        </View>       
    );
}

export default MusicPlayer;

const styles = StyleSheet.create({
    listArtWrapper: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
    },
    albumContainer: {
        width: 300,
        height: 300,
    },
    albumArtImg: {
        height: '100%',
        borderRadius: 2,
    },
});