    import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    Alert,
    } from "react-native";
    import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
    import { LinearGradient } from "react-native-linear-gradient";
    import { useNavigation } from "@react-navigation/native";
    import Ionicons from 'react-native-vector-icons/Ionicons'
    import AntDesign from 'react-native-vector-icons/AntDesign'
    import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
    import Entypo from 'react-native-vector-icons/Entypo'
    import { debounce } from "lodash";
    import { FIREBASE_FIRESTORE } from '../FirebaseConfig';
    import { collection, query, orderBy, getDocs } from 'firebase/firestore';
    import SongItem from "../components/SongItem";
    import { Player } from "../PlayerContext";
    import { initPlayer } from "../components/player/musicPlayerServices";
    import TrackPlayer, { State, usePlaybackState } from "react-native-track-player";
    import { showMessage } from "react-native-flash-message";
    import { resetCount, resetTakenInt } from "../global";

  const LikedSongsScreen = ({ route }) => {
    const json = route.params.userProfile;
    const firestore = FIREBASE_FIRESTORE
    const navigation = useNavigation();
    const [input, setInput] = useState("");
    const [songCount, setSongCount] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchedTracks, setSearchedTracks] = useState([]);
    const {savedTracks, setSavedTracks} = useContext(Player);
    const {currentTrack, setCurrentTrack} = useContext(Player);
    const {isPlaying, setIsPlaying} = useContext(Player);
    const {isLoadingSong, setIsLoadingSong} = useContext(Player);
    const {skipEnabled, setSkipEnabled} = useContext(Player);
    const {suggestions, setSuggestions} = useContext(Player);
    const [init, setInit] = useState(false);
    const playbackState = usePlaybackState();
    
    //GET Songs
    async function getSavedTracks() {
        try {
            const likedCollection = collection(firestore, 'user', json.uid, 'like');
            const result = query(likedCollection, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(result);
            const songs = querySnapshot.docs.map(doc => {
                let data = {}
                data.title = doc.data().title,
                data.artist = doc.data().creator,
                data.artwork = doc.data().cover,
                data.id = doc.id;
                data.liked = true;
                return data;
            });

            setSavedTracks(songs);
            setSearchedTracks(songs);
            setLoading(false);
        } catch (error) {
            console.log(error);
            Alert.alert(error);
        }
    }

    async function getSongCount() {
        try {
            const collectionRef = collection(firestore, 'user', json.uid, 'like');
            const snapshot = await getDocs(collectionRef);
            
            return snapshot.size;
        } catch (error) {
            console.log(error);
            Alert.alert(error);
        }
    }

    useEffect(() => {
        setLoading(true);
        setSuggestions([])
        getSongCount()
        .then((count) => setSongCount(count))
        .then(() => getSavedTracks());
    }, []);

    useEffect(() => {
        if(init && playbackState.state === State.Playing && savedTracks.length > 1) {
            setIsLoadingSong(false);
            setInit(false);
            showMessage({
                message: "Läd weitere Lieder, gleich ist die Skip Funktion bereit.",
                type: "info",
            });
        }

    }, [init, playbackState]);

    //Search
    const debouncedSearch = useCallback(debounce(handleSearch, 800), []);
    
    function handleSearch(text) {
        setLoading(true);

        const filteredTracks = savedTracks.filter((item) =>
            item.title.toLowerCase().includes(text.toLowerCase())
        );

        setSearchedTracks(filteredTracks);
        setLoading(false);
    }

    const handleInputChange = (text) => {
        setInput(text);
        debouncedSearch(text);
    };

    //Play
    async function handlePlayTrack(item, button = false) {
        setIsLoadingSong(true);

        if(isPlaying) {
            if(button && currentTrack?.liked) {
                setIsPlaying(false);
                await TrackPlayer.pause();
            } else {
                setIsPlaying(true);
                setInit(true);
                await initPlayer(savedTracks, item, true);
                setSkipEnabled(true);

                showMessage({
                    message: "Die Skip Funktion ist nun bereit.",
                    type: "success",
                });
            }
        } else {
            if(button) {
                if(currentTrack && currentTrack?.pid === undefined) {
                    setIsPlaying(true);
                    await TrackPlayer.play();
                } else {
                    resetCount();
                    resetTakenInt();
                    setCurrentTrack(item);
                    setIsPlaying(true);
                    setInit(true);
                    await initPlayer(savedTracks, item, true);
                    setSkipEnabled(true);

                    showMessage({
                        message: "Die Skip Funktion ist nun bereit.",
                        type: "success",
                    });
                }
            } else {
                setIsPlaying(true);
                setInit(true);
                await initPlayer(savedTracks, item, true);
                setSkipEnabled(true);

                showMessage({
                    message: "Die Skip Funktion ist nun bereit.",
                    type: "success",
                });
            }
        }
    }

    return (
      <>
        <LinearGradient colors={["#614385", "#516395"]} style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, marginTop: 50 }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{ marginHorizontal: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>

            <Pressable
            style={{
              marginHorizontal: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 9,
            }}
            >
                <Pressable
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        backgroundColor: "#42275a",
                        
                        flex: 1,
                        borderRadius: 3,
                        height: 38,
                    }}
                    >
                    <AntDesign name="search1" size={20} style={{marginLeft: 10}} color="white" />
                    <TextInput
                        value={input}
                        onChangeText={(text) => handleInputChange(text)}
                        placeholder="Suchen in Lieblingssongs"
                        placeholderTextColor="white"
                        style={styles.input}
                    />
                </Pressable>

                <Pressable
                    style={{
                        marginHorizontal: 10,
                        backgroundColor: "#42275a",
                        padding: 10,
                        borderRadius: 3,
                        height: 38,
                    }}
                >
                    <Text style={{ color: "white" }}>Sortieren</Text>
                </Pressable>
            </Pressable>

            <View style={{ height: 50 }} />

            <View style={{ marginHorizontal: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: "white" }}>
                Lieblingssongs
                </Text>
                <Text style={{ color: "white", fontSize: 13, marginTop: 5 }}>
                    {songCount} {songCount === 0 ? null : songCount === 1 ? 'Lied' : 'Lieder'}
                </Text>
            </View>

            <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginHorizontal: 10,
            }}
            >
                <Pressable
                style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: "#1DB954",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                >
                <AntDesign name="arrowdown" size={20} color="white" />
                </Pressable>

                <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                >
                <MaterialCommunityIcons
                    name="cross-bolnisi"
                    size={24}
                    color="#1DB954"
                />
                <Pressable
                    onPress={() => handlePlayTrack(savedTracks[0], true)}
                    style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#1DB954",
                    }}
                >
                    <Entypo 
                        name={isPlaying && currentTrack?.liked && playbackState.state !== State.Paused ? "controller-paus" : "controller-play"} 
                        size={24} 
                        color="white" 
                    />
                </Pressable>
                </View>
            </Pressable>

            {loading ? (
                <ActivityIndicator size="large" color="gray" /> // Show a loading indicator while data is being fetched
            ) : (
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={searchedTracks}
                    renderItem={({ item }) => (
                        <SongItem
                            item={item}
                            onPress={(item) => handlePlayTrack(item)}
                            isPlaying={currentTrack && item.id === currentTrack.id && currentTrack?.pid === undefined}
                        />
                    )}
                />
            )}
          </ScrollView>
        </LinearGradient>
      </>
    );
  };
  
  export default LikedSongsScreen;
  
  const styles = StyleSheet.create({
    input: {
        flex: 1,
        color: 'white',
        fontWeight: "500",
    },
  });