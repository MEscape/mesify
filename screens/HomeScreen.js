import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "react-native-linear-gradient";
import AntDesign from 'react-native-vector-icons/AntDesign'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import React, { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import { FIREBASE_FIRESTORE } from '../FirebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

import ArtistCard from "../components/ArtistCard";
import RecentlyPlayedCard from "../components/RecentlyPlayedCard";
import { setupPreferences, deleteOldPreferences } from "../api";
import PreferencesCard from "../components/PreferencesCard";

function HomeScreen() {
  const firestore = FIREBASE_FIRESTORE;
  const [selected, setSelected] = useState('Alle');
  const [userProfile, setUserProfile] = useState();
  const [loading, setLoading] = useState(true);
  const [recentlyplayed, setRecentlyPlayed] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [topPlaylists, setTopPlaylists] = useState([]);
  const navigation = useNavigation();

  const greetingMessage = () => {
    const currentTime = new Date().getHours();
    if (currentTime < 12) {
      return "Guten Morgen";
    } else if (currentTime < 16) {
      return "Guten Mittag";
    } else {
      return "Guten Abend";
    }
  };

  const message = greetingMessage();

  const getProfile = async () => {
    try {
      setLoading(true);
      return AsyncStorage.getItem('user')
      .then((storedUser) => JSON.parse(storedUser))
      .then((json) => {
        setUserProfile(json);
        require("../global").safedUser = json;
        return json;
      })
    } catch (error) {
      Alert.alert(error);
    }
  };

  useEffect(() => {
    getProfile()
    .then(async (json) => {
      getPlaylist(json);
      getRecentlyPlayedSongs(json);
      const artists = await getArtist(json);
      setLoading(false)
      preferencesProcess(artists, json);
    })
  }, []);

  async function preferencesProcess(artists, json) {
    try {
      const preferencesCollection = collection(firestore, 'user', json.uid, 'preferences')
      const result = query(preferencesCollection, limit(1));
      const querySnapshot = (await getDocs(result)).docs;

      if(querySnapshot.length === 0) {
        await setupPreferences(artists);
      } else if((new Date() / 1000 - querySnapshot[0].data().timestamp.seconds) > 86400) {
        console.log("A")
        await deleteOldPreferences(json);
        await setupPreferences(artists);
      }

      setTimeout(() => {
        getPreferences(json)
        .then(() => setLoading(false));
      }, 1000)
    } catch (error) {
      console.error(error);
      Alert.alert(error);
    }
  }

  async function getPreferences(json) {
    try {
      const preferencesCollection = collection(firestore, 'user', json.uid, 'preferences')
      const querySnapshot = await getDocs(preferencesCollection);
      const songs = querySnapshot.docs.map(doc => {
        let data = {}
        data.title = doc.data().title,
        data.artist = doc.data().creator,
        data.artwork = doc.data().cover,
        data.id = doc.id;
        return data;
      });
      
      setPreferences(songs);
    } catch (error) {
      Alert.alert(error);
    }
  }

  async function getRecentlyPlayedSongs(json) {
    try {
      const historyCollection = collection(firestore, 'user', json.uid, 'history')
      const result = query(historyCollection, orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(result);
      const songs = querySnapshot.docs.map(doc => {
        let data = doc.data();
        data.videoId = doc.id;
        return data;
      });
      
      setRecentlyPlayed(songs);
    } catch (error) {
      Alert.alert(error);
    }
  };

  async function getArtist(json) {
    try {
      const artistCollection = collection(firestore, 'user', json.uid, 'artist');
      const result = query(artistCollection, orderBy('count', 'desc'), limit(5));
      const querySnapshot = await getDocs(result);
      const artists = querySnapshot.docs.map(doc => {
        let data = doc.data();
        data.name = doc.id;
        return data;
      });
      
      setTopArtists(artists);
      return artists;
    } catch (error) {
      Alert.alert(error);
      console.log(error);
    }
  }

  async function getPlaylist(json) {
    try {
      const playlistCollection = collection(firestore, 'user', json.uid, 'playlist');
      const result = query(playlistCollection, orderBy('playtime', 'desc'), limit(5));
      const querySnapshot = await getDocs(result);
      const playlists = querySnapshot.docs.map(doc => {
        let data = doc.data();
        data.name = doc.id;
        return data;
      });
      
      setTopPlaylists(playlists);
    } catch (error) {
      Alert.alert(error);
    }
  }

  function shortenName(name) {
    if (name.length > 12) {
      return name.substring(0, 12) + "...";
    } else {
      return name;
    }
  }

  const renderPlaylists = () => {
    return topPlaylists.map((playlist, index) => {
      return (
        <Pressable
          key={index}
          onPress={() => navigation.navigate('Playlist', { name: playlist.name })}
          style={{
            marginBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginHorizontal: 10,
            marginVertical: 8,
            backgroundColor: "#202020",
            borderRadius: 4,
            elevation: 3,
            width: Dimensions.get('window').width / 2 - 20,
          }}
        >
          <Image
            style={{ width: 55, height: 55 }}
            source={{ uri: playlist?.cover }}
          />
  
          <Text style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>
            {shortenName(playlist.name)}
          </Text>
        </Pressable>
      );
    });
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
                {message}
              </Text>
            </View>
  
            <MaterialCommunityIcons
              name="lightning-bolt-outline"
              size={24}
              color="white"
            />
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
            <Button title="Alle" />
            <Button title="Musik" />
            <Button title="Podcasts" />
          </View>
  
          <View style={{ height: 10 }} />
  
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Pressable
            onPress={() => navigation.navigate("Liked", {userProfile})}
              style={{
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginHorizontal: 10,
                marginVertical: 8,
                backgroundColor: "#202020",
                borderRadius: 4,
                elevation: 3,
                width: Dimensions.get('window').width / 2 - 20,
              }}
            >
              <LinearGradient colors={["#33006F", "#FFFFFF"]}>
                <Pressable
                  style={{
                    width: 55,
                    height: 55,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <AntDesign name="heart" size={24} color="white" />
                </Pressable>
              </LinearGradient>
  
              <Text style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>
                Lieblingssongs
              </Text>
            </Pressable>
  
            {renderPlaylists()}
  
          </View>
  
          <Text
          style={{
            color: "white",
            fontSize: 19,
            fontWeight: "bold",
            marginHorizontal: 10,
            marginTop: 10,
          }}
          >
            Empfehlungen
          </Text>
          <FlatList
            data={preferences}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <PreferencesCard item={item} key={index} />
            )}
          />
  
          <View style={{ height: 10 }} />
  
          <Text
          style={{
            color: "white",
            fontSize: 19,
            fontWeight: "bold",
            marginHorizontal: 10,
            marginTop: 10,
          }}
          >
            Zuletzt angehört
          </Text>
          <FlatList
            data={recentlyplayed}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <RecentlyPlayedCard item={item} key={index} />
            )}
          />
  
          <View style={{ height: 10 }} />
  
          <Text
          style={{
            color: "white",
            fontSize: 19,
            fontWeight: "bold",
            marginHorizontal: 10,
            marginTop: 10,
          }}
          >
            Deine Lieblings Künstler
          </Text>
          <FlatList
            data={topArtists}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <ArtistCard item={item} key={index} />
            )}
          />
        </ScrollView>
      )}
    </LinearGradient>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({});