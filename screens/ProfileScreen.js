import { ActivityIndicator, Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { LinearGradient } from "react-native-linear-gradient";
import { FIREBASE_FIRESTORE } from "../FirebaseConfig";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import PlaylistItem from "../components/PlaylistItem";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useNavigation } from "@react-navigation/native";
import NewPlaylist from "../components/NewPlaylist";
import { Player } from "../PlayerContext";

const userProfile = require("../global").safedUser;

const ProfileScreen = () => {
  const {playlists, setPlaylists} = useContext(Player);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState('Playlists');
  const firestore = FIREBASE_FIRESTORE;
  const navigation = useNavigation();

  const getPlaylists = async () => {
    try {
      const playlistCollection = collection(firestore, 'user', userProfile.uid, 'playlist');
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

  const Button = ({ title }) => (
    <Pressable
      style={{
        backgroundColor: selected === title ? '#1DB954' : '#282828',
        padding: 10,
        borderRadius: 30,
      }}
      onPress={() => setSelected(title)}
    >
      <Text style={{ fontSize: 15, color: 'white' }}>{title}</Text>
    </Pressable>
  );

  useEffect(() => {
    setLoading(true);
    console.log(userProfile);
    getPlaylists();
  }, []);

  return (
    <LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1 }}>
      <ScrollView style={{ marginTop: 50 }}>
      <View
          style={{
            padding: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                resizeMode: "cover",
              }}
              source={{ uri: userProfile?.img }}
            />
            <Text
              style={{
                marginLeft: 10,
                fontSize: 20,
                fontWeight: "bold",
                color: "white",
              }}
            >
              Bibliothek
            </Text>
          </View>

          <View style={{ flexDirection: "row", marginLeft: 10, gap: 10 }}>
            <FontAwesome name="search" size={24} color="white" />
            <NewPlaylist userProfile={userProfile} />
          </View>
        </View>
        <View
          style={{
            marginHorizontal: 12,
            marginVertical: 5,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Button title="Playlists" />
          <Button title="Künstler" />
          <Button title="Heruntergeladen" />
        </View>
        <View
          style={{
            padding: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", marginLeft: 10, gap: 10 }}>
            <FontAwesome name="filter" size={16} color="white" />
            <Text
              style={{
                color: "white"
              }}
            >
              Zuletzt
            </Text>
          </View>
          <FontAwesome name="square" size={16} color="white" />
        </View>
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
        <View style={{padding:15}}>
          <Pressable
            onPress={() => navigation.navigate("Liked", {userProfile})}
            style={{ flexDirection: "row", alignItems: "center", gap:8, marginVertical:10 }}
          >
              <LinearGradient 
                colors={["#33006F", "#FFFFFF"]} 
                style={{ width: 50, height: 50, borderRadius: 4, justifyContent: "center", alignItems: "center" }}
              >
                <AntDesign name="heart" size={24} color="white" />
              </LinearGradient>
  
              <Text style={{color:"white"}}>
                Lieblingssongs
              </Text>
            </Pressable>
          {loading ? (
            <ActivityIndicator size="30" color="#1DB954" /> // Show a loading indicator while data is being fetched
          ) : (
            <FlatList
                showsVerticalScrollIndicator={false}
                data={playlists}
                renderItem={({ item }) => (
                    <PlaylistItem
                        item={item}
                        onPress={() => navigation.navigate('Playlist', { name: item.name })}
                    />
                )}
            />
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({});
