import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import Ionicons from 'react-native-vector-icons/Ionicons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Entypo from 'react-native-vector-icons/Entypo'
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { LinearGradient } from "react-native-linear-gradient";
import { FIREBASE_FIRESTORE } from "../FirebaseConfig";
import SongItem from "../components/SongItem";
import { Player } from "../PlayerContext";
import { showMessage } from "react-native-flash-message";
import TrackPlayer, { State, usePlaybackState } from "react-native-track-player";
import { initPlayer } from "../components/player/musicPlayerServices";
import { resetCount, resetTakenInt } from "../global";

const safedUser = require("../global").safedUser;

const PlaylistScreen = ({ route }) => {
    const {currentTrack, setCurrentTrack} = useContext(Player);
    const {savedTracks, setSavedTracks} = useContext(Player);
    const {isPlaying, setIsPlaying} = useContext(Player);
    const {isLoadingSong, setIsLoadingSong} = useContext(Player);
    const {skipEnabled, setSkipEnabled} = useContext(Player);
    const [loading, setLoading] = useState(false);
    const [init, setInit] = useState(false);
    const [meta, setMeta] = useState(null);
    const navigation = useNavigation();
    const playbackState = usePlaybackState();
    const firestore = FIREBASE_FIRESTORE;

    const checkIfLiked = async (filteredTracks) => {
      try {
        const likedCollection = collection(firestore, 'user', safedUser.uid, 'like');
        const batchSize = 30;
        for (let i = 0; i < filteredTracks.length; i += batchSize) {
            const batch = filteredTracks.slice(i, i + batchSize);
            const ids = batch.map(video => video.id);

            const result = query(
                likedCollection,
                where("__name__", "in", ids)
            );

            const querySnapshot = await getDocs(result);
            const songs = querySnapshot.docs.map(doc => {
                let data = doc.data();
                data.id = doc.id;
                return data;
            });

            batch.forEach(video => {
                const song = songs.find(song => song.id === video.id);

                if (song !== undefined && song.id === video.id) {
                    video.liked = true;
                    video.playtime = song.playtime;
                } else {
                    video.liked = false;
                }
            });

            console.log(batch); // Hier könnten Sie die Ergebnisse für jeden Batch verarbeiten oder ausgeben
        }
      } catch (err) {
        console.error(err);
      } finally {
        return filteredTracks;
      }
    }

    async function fetchSongs() {
        try {
            const playlistDoc = doc(firestore, 'user', safedUser.uid, 'playlist', route.params.name);
            let playlistMeta = await getDoc(playlistDoc);
            let data = { ...(playlistMeta.data()) }
            data.name = playlistMeta.id;
            
            setMeta(data);

            if(!data.new) {
              const songCollection = collection(firestore, 'user', safedUser.uid, 'playlist', route.params.name, 'song');
              const result = query(songCollection, orderBy('createdAt', 'asc'));
              const snapshot = await getDocs(result);
  
              const songs = snapshot.docs.map(doc => {
                let data = {}
                data.title = doc.data().title,
                data.artist = doc.data().creator,
                data.artwork = doc.data().cover,
                data.id = doc.id;
                data.pid = playlistMeta.id;

                return data;
              });
  
              await checkIfLiked(songs);

              console.log(songs);
              setSavedTracks(songs);
            }

            setLoading(false);
        } catch (error) {
            Alert.alert(error);
        }
    }

    async function handlePlayTrack(item, button = false) {
      console.log(isPlaying && currentTrack?.pid == meta?.name && playbackState.state !== State.Paused)
      console.log(isPlaying)
      console.log(currentTrack?.pid == meta?.name)
      console.log(playbackState.state !== State.Paused)
      console.log(currentTrack?.pid, meta?.name, currentTrack)
        if(isPlaying) {
            if(button && currentTrack?.pid == meta?.name) {
                setIsPlaying(false);
                await TrackPlayer.pause();
            } else {
                setIsPlaying(true);
                setInit(true);
                await initPlayer(savedTracks, item, true);
                setSkipEnabled(true);
            }
        } else {
            if(button) {
                if(currentTrack && currentTrack?.pid == meta?.name) {
                    setIsPlaying(true);
                    await TrackPlayer.play();
                } else {
                  resetTakenInt();
                  resetCount();
                  setCurrentTrack(item);
                  setIsPlaying(true);
                  setInit(true);
                  await initPlayer(savedTracks, item, true);
                  setSkipEnabled(true);
                }
            } else {
                setIsPlaying(true);
                setInit(true);
                await initPlayer(savedTracks, item, true);
                setSkipEnabled(true);
            }
        }

        if(savedTracks.length > 1) {
            showMessage({
                message: "Die Skip Funktion ist nun bereit.",
                type: "success",
            });
        }
    }

    useEffect(() => {
        if(init && playbackState.state === State.Playing) {
            setIsLoadingSong(false);
            setInit(false);
            if(savedTracks.length > 1) {
                showMessage({
                    message: "Läd weitere Lieder, gleich ist die Skip Funktion bereit.",
                    type: "info",
                });
            }
        }

    }, [init, playbackState]);

    useEffect(() => {
        setLoading(true);
        fetchSongs();
    }, []);

  return (
    <LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1 }}>
      {loading ? (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <ActivityIndicator size="30" color="#1DB954" />
        </View>
      ) : ( 
        <ScrollView style={{ marginTop: 50 }}>
        <View style={{ flexDirection: "row", padding: 12 }}>
          <Ionicons
            onPress={() => navigation.goBack()}
            name="arrow-back"
            size={24}
            color="white"
          />
          <View style={{ flex: 1, alignItems: "center" }}>
            <Image
              style={{ width: 200, height: 200 }}
              source={{ uri: meta?.cover }}
            />
          </View>
        </View>
        <Text
          style={{
            color: "white",
            marginHorizontal: 12,
            marginTop: 10,
            fontSize: 22,
            fontWeight: "bold",
          }}
        >
          {meta?.name}
        </Text>
        <View
          style={{
            marginHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: 10,
            gap: 7,
          }}
        >
            <Text style={{ color: "#909090", fontSize: 13, fontWeight: "500" }}>
                {meta?.category}
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
                name={isPlaying && currentTrack?.pid == meta?.name && playbackState.state !== State.Paused ? "controller-paus" : "controller-play"} 
                size={24} 
                color="white" 
            />
            </Pressable>
        </View>
        </Pressable>

        <View>
            <View style={{marginTop:10,marginHorizontal:12}}>
            <FlatList
                showsVerticalScrollIndicator={false}
                data={savedTracks}
                renderItem={({ item }) => (
                    <SongItem
                        item={item}
                        onPress={(item) => handlePlayTrack(item)}
                        isPlaying={currentTrack && currentTrack?.pid == meta?.name && item.id === currentTrack.id}
                    />
                )}
            />
            </View>
        </View>

      </ScrollView>
      )}
    </LinearGradient>
  );
};

export default PlaylistScreen;

const styles = StyleSheet.create({});
