import React, { useContext, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { BottomModal, ModalContent } from "react-native-modals";
import PlaylistItem from "./PlaylistItem";
import { Player } from "../PlayerContext";
import { FIREBASE_FIRESTORE } from "../FirebaseConfig";
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import Ionicons from 'react-native-vector-icons/Ionicons'
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const safedUser = require("../global").safedUser;

const PlaylistCollection = ({ modalVisible, setModalVisible, song, onPress }) => {
    const [loading, setLoading] = useState(false);
    const {playlists, setPlaylists} = useContext(Player);
    const firestore = FIREBASE_FIRESTORE;
    const navigation = useNavigation();

    const handleAddPlaylist = async (item) => {
        onPress(true);

        if(item.new) {
            const songCollection = collection(firestore, 'user', safedUser.uid, 'playlist', item.name, 'song');
            const snapshot = await getDocs(songCollection);

            snapshot.docs.forEach(async (doc) => {
                console.log(doc);
                await deleteDoc(doc.ref)
            });

            const playlistDoc = doc(firestore, 'user', safedUser.uid, 'playlist', item.name);

            await updateDoc(playlistDoc, {
                new: false
            })
        }

        const songsDocRef = doc(firestore, 'user', safedUser.uid, 'playlist', item.name, 'song', song.id);
        await setDoc(songsDocRef, {
            cover: song?.artwork,
            creator: song?.artist,
            createdAt: new Date(),
            title: song?.title
        });
    }

    const getPlaylists = async () => {
        try {
          const playlistCollection = collection(firestore, 'user', safedUser.uid, 'playlist');
          const result = query(playlistCollection, orderBy('playtime', 'desc'));
          const querySnapshot = await getDocs(result);
    
          const playlists = querySnapshot.docs.map(doc => {
            let data = doc.data();
            data.name = doc.id;
            return data;
          });
          
          setPlaylists(playlists);
        } catch (error) {
          Alert.alert(error);
        } finally {
          setLoading(false);
        }
    };

    const handleGoBack = () => {
        onPress(false);
    }

    useEffect(() => {
        if(modalVisible) {
            setLoading(true);
            getPlaylists();
        }
    }, [modalVisible]);

    return (
        <BottomModal
            visible={modalVisible}
            onHardwareBackPress={() => setModalVisible(false)}
            swipeDirection={["up", "down"]}
            swipeThreshold={200}
            style={{padding: 0, margin: 0 }}
        >
            
            <LinearGradient colors={["#040306", "#131624"]} style={{ height: "100%", width: "100%", padding: 0, margin: 0 }}>
                <ModalContent
                    style={{ height: "100%", width: "100%", backgroundColor: "transparent" }}
                >
                    <ScrollView style={{ marginTop: 50 }}>
                        <View style={{ flexDirection: "row", flex: 1, alignItems: "center" }}>
                            <Pressable
                                onPress={() => handleGoBack()}
                                style={{ marginHorizontal: 10 }}
                            >
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </Pressable>
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: 20,
                                    fontWeight: "500",
                                    marginVertical: 12,
                                    marginHorizontal: 12,
                                }}
                            >
                            Deine Playlists
                            </Text>
                        </View>
                        <View style={{padding:15}}>
                            {loading ? (
                                <ActivityIndicator size="30" color="#1DB954" /> // Show a loading indicator while data is being fetched
                            ) : (
                                <FlatList
                                    showsVerticalScrollIndicator={false}
                                    data={playlists}
                                    renderItem={({ item }) => (
                                        <PlaylistItem
                                            item={item}
                                            onPress={() => handleAddPlaylist(item)}
                                        />
                                    )}
                                />
                            )}
                        </View>
                    </ScrollView>
                </ModalContent>
            </LinearGradient>
        </BottomModal>
    );
};

export default PlaylistCollection;