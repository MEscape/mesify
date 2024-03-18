    import {
        ActivityIndicator,
        Alert,
        Image,
        Pressable,
        StyleSheet,
        Text,
        View,
    } from "react-native";
    import React, { useState, useContext, useEffect } from "react";
    import AntDesign from 'react-native-vector-icons/AntDesign'
    import Entypo from 'react-native-vector-icons/Entypo'
    import { BottomModal } from "react-native-modals";
    import { ModalContent } from "react-native-modals";
    import MusicPlayer from "../screens/MusicPlayer";
    import { Player } from "../PlayerContext";
    import { FIREBASE_FIRESTORE } from '../FirebaseConfig';
    import { setDoc, doc, deleteDoc } from 'firebase/firestore';
    import Slider from "@react-native-community/slider";
    import { State, usePlaybackState, useProgress } from "react-native-track-player";

const PlayerBar = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const {currentTrack, setCurrentTrack} = useContext(Player);
    const {isPlaying, setIsPlaying} = useContext(Player);
    const {isLoadingSong, setIsLoadingSong} = useContext(Player);
    const {handlePlayTrack} = useContext(Player);
    const firestore = FIREBASE_FIRESTORE;
    const safedUser = require("../global").safedUser;
    const { position, duration } = useProgress();
    const playBackState = usePlaybackState();

    const handleLike = async () => {
        const likeCollection = doc(firestore, 'user', safedUser.uid, 'like', currentTrack.id)

        if(currentTrack?.liked) {
            const newCurrentTrack = { ...currentTrack };
            newCurrentTrack.liked = false;
            setCurrentTrack(newCurrentTrack);

            try {
                await deleteDoc(likeCollection);
            } catch (error) {
                console.log(error);
                Alert.alert(error);
            }
        } else {
            const newCurrentTrack = { ...currentTrack };
            newCurrentTrack.liked = true;
            setCurrentTrack(newCurrentTrack)

            const track = {
                cover: currentTrack?.artwork,
                createdAt: new Date(),
                creator: currentTrack?.artist,
                playtime: 0,
                title: currentTrack?.title
            }
        
            try {
                await setDoc(likeCollection, track)
            } catch (error) {
                console.log(error);
                Alert.alert(error);
            }
        }
      }

    return (
        <>
            {currentTrack ? (
                <Pressable
                    onPress={() => setModalVisible(!modalVisible)}
                    style={{
                        backgroundColor: "#5072A7",
                        width: "90%",
                        marginLeft: "auto",
                        marginRight: "auto",
                        marginBottom: 15,
                        position: "absolute",
                        borderRadius: 6,
                        left: 20,
                        bottom: 40,
                        justifyContent: "space-between",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                <View style={{ 
                        flexDirection: "row", 
                        gap: 10, 
                        padding: 10,
                    }}
                >
                <View style={{ 
                    flexDirection: "row", 
                    alignItems: "center", 
                    gap: 10 }}
                >
                        <View style={{ position: 'relative' }}>
                            <Image
                            style={{ width: 40, height: 40 }}
                            source={{ uri: currentTrack?.artwork }}
                            />
                            {isLoadingSong ? (
                                <ActivityIndicator 
                                style={{ position: "absolute", top: '25%', left: '25%' }}
                                size="small"
                                color="white"
                                />
                            ) : null }
                        </View>
                        <Text
                        numberOfLines={1}
                        style={{
                            fontSize: 13,
                            width: 220,
                            color: "white",
                            fontWeight: "bold",
                        }}
                        >
                        {currentTrack?.title} • {" "}
                        {currentTrack?.artist}
                        </Text>
                    </View>
            
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Pressable
                        onPress={handleLike}
                    >
                        <AntDesign name={currentTrack?.liked ? "heart" : "hearto"} size={24} color="#1DB954" />
                    </Pressable>
                        <Pressable
                            onPress={handlePlayTrack}
                        >
                            <Entypo 
                                name={isPlaying && playBackState.state !== State.Paused ? "controller-paus" : "controller-play"} 
                                size={24} 
                                color="white" 
                            />
                        </Pressable>
                    </View>
                </View>
                    
                <Slider
                    style={{width: '100%', height: 3}}
                    minimumValue={0}
                    maximumValue={duration}
                    value={position}
                    minimumTrackTintColor="white"
                    maximumTrackTintColor="gray"
                    thumbTintColor="transparent"
                />

                </Pressable>
            ) : null }

            <BottomModal
                visible={modalVisible}
                onHardwareBackPress={() => setModalVisible(false)}
                swipeDirection={["up", "down"]}
                swipeThreshold={200}
            >
                <ModalContent
                style={{ height: "100%", width: "100%", backgroundColor: "#5072A7" }}
                >
                    <MusicPlayer  
                        setModalVisible={setModalVisible} 
                        modalVisible={modalVisible}
                    />
                </ModalContent>
            </BottomModal>
        </>
    );
}

export default PlayerBar;

const styles = StyleSheet.create({
    progressbar: {
      height: "100%",
      backgroundColor: "white",
    },
});