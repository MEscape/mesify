import React, { useCallback, useState, useContext, useEffect } from 'react'
import { 
  StyleSheet, 
  View, 
  TextInput,
  Text,
  FlatList,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import { LinearGradient } from "react-native-linear-gradient";
import { FIREBASE_FIRESTORE } from '../FirebaseConfig';
import { collection, query, getDocs, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import SongItem from '../components/SongItem';
import SearchItem from '../components/SearchItem';
import { debounce } from "lodash";
import { initPlayer, queueNextFive } from "../components/player/musicPlayerServices";
import TrackPlayer from 'react-native-track-player';
import { Player } from '../PlayerContext';
import { ytsearch, ytsuggestion } from '../api';
import { showMessage } from "react-native-flash-message";

const safedUser = require("../global").safedUser;

const SearchScreen = () => {
  const [search, setSearch] = useState('');
  const {searchHistory, setSearchHistory} = useContext(Player);
  const [loading, setLoading] = useState(false);
  const {isLoadingSong, setIsLoadingSong} = useContext(Player);
  const {savedTracks, setSavedTracks} = useContext(Player);
  const [searchedTracks, setSearchedTracks] = useState([]);
  const {suggestions, setSuggestions} = useContext(Player);
  const {currentTrack, setCurrentTrack} = useContext(Player);
  const {skipEnabled, setSkipEnabled} = useContext(Player);
  const {isPlaying, setIsPlaying} = useContext(Player);
    
  const firestore = FIREBASE_FIRESTORE;

  //Search
  const debouncedSearch = useCallback(debounce(handleSearch, 1200), []);

  async function saveSearch(text) {
    const userDoc = doc(firestore, 'user', safedUser.uid)
    const userDocSnapshot = await getDoc(userDoc);
    const userData = userDocSnapshot.data();
    let searchArray = userData.search;
    if(searchArray.length === 20)
      searchArray.pop();

    if(searchArray.includes(text)) {
      const index = searchArray.indexOf(text);
      if (index !== -1) 
          searchArray.splice(index, 1);
    }

    searchArray.unshift(text);
    setSearchHistory(searchArray);

    await updateDoc(userDoc, { search: searchArray });
  }

  async function handleSearch(text) {
      try {
        setLoading(true);
        setSavedTracks([]);
        saveSearch(text)

        let response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${text}&type=video&maxResults=20&key=AIzaSyDjvrqw9eY8fBTOQkyUCccXY5pzHIURSqU`)
        let json = await response.json()
        let filteredTracks = [];
    
        if(json && !('error' in json)) {
          filteredTracks = json.items.map(video => {
            const id = video.id.videoId
            const title = video.snippet.title
            const artist = video.snippet.channelTitle
            const artwork = video.snippet.thumbnails.medium.url
    
            return { id: id, title: title, artist: artist, artwork: artwork }
          })
  
        } else {
          let json = await ytsearch(text)
    
          if(json) {
            filteredTracks = json.map(video => {
              const id = video.id
              const title = video.title
              const artist = video.artist
              const artwork = video.artwork
      
              return { id: id, title: title, artist: artist, artwork: artwork }
            })
          } else {
            Alert.alert('Keine Suchergebnisse');
          }
        }

        if(filteredTracks) {
          //checkIfDownloaded()
          filteredTracks = await checkIfLiked(filteredTracks);
          filteredTracks = filteredTracks.sort(preferedFilter)
    
          setSearchedTracks(filteredTracks);
        }
      } catch(error) {
        console.log(error);
        Alert.alert(error);
      } finally {
        setLoading(false);
      }
  }

  const preferedFilter = (a, b) => {
    if (a.liked && !b.liked) 
      return -1;

    if (b.liked && !a.liked) 
      return 1;

    if (a.liked && b.liked && a.playtime > b.playtime) 
      return -1;
    
    if (a.liked && b.liked && b.playtime > a.playtime) 
      return 1;

    return 0;
  }

  const checkIfLiked = async (filteredTracks) => {
    const likedCollection = collection(firestore, 'user', safedUser.uid, 'like');
    const result = query(
      likedCollection,
      where("__name__", "in", filteredTracks.map(video => video.id)),
    );
    const querySnapshot = await getDocs(result);
    const songs = querySnapshot.docs.map(doc => {
      let data = doc.data();
      data.id = doc.id;
      return data;
    });

    filteredTracks.forEach(video => {
      const song = songs.find(song => song.id === video.id);

      if(song !== undefined && song.id === video.id) {
        video.liked = true;
        video.playtime = song.playtime;
      } else {
        video.liked = false;
      }
    })

    return filteredTracks;
  }

  const handleInputChange = (text) => {
      setSearch(text);
      debouncedSearch(text);
  };

  async function handlePlaySpecific(item) {
    setSkipEnabled(false);
    setIsLoadingSong(true);
    setIsPlaying(true);
    setCurrentTrack(item);
    await initPlayer(item);
    await TrackPlayer.play();
    setIsLoadingSong(false);
    showMessage({
      message: "Läd weitere Lieder, gleich ist die Skip Funktion bereit.",
      type: "info",
    });
    const json = await ytsuggestion(item.id);
    await checkIfLiked(json);
    setSuggestions(json);
    console.log(json);
    await queueNextFive(json.slice(0, 5))
    setSkipEnabled(true);
    showMessage({
      message: "Die Skip Funktion ist nun bereit.",
      type: "success",
    });
  }

  async function getSearchHistory() {
    const userDoc = doc(firestore, 'user', safedUser.uid)
    const userDocSnapshot = await getDoc(userDoc);
    const userData = userDocSnapshot.data();
    let searchArray = userData.search;

    console.log(searchArray)
    setSearchHistory(searchArray);
  }

  useEffect(() => {
    if(searchedTracks.length === 0) {
      getSearchHistory();
    }
  }, [searchedTracks]);

  async function setupSearch(item) {
    setSearch(item);
    await handleSearch(item)
  }

  return (
    <LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, marginTop: 50 }}>
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
              source={{ uri: safedUser?.img }}
            />
            <Text
              style={{
                marginLeft: 10,
                fontSize: 20,
                fontWeight: "bold",
                color: "white",
              }}
            >
              Suche
            </Text>
          </View>

          <Entypo
            name="camera"
            size={24}
            color="white"
          />
        </View>
        <View style={styles.header}>
          <FontAwesome name="search" size={16} color="gray" />
          <TextInput
            value={search}
            onChangeText={(text) => handleInputChange(text)}
            placeholder="Was willst du hören?"
            placeholderTextColor='white'
            style={styles.input}
          />
          <Text onPress={() => {
            setSearch('');
            setSearchedTracks([]);
          }} style={{ color: 'white' }}>
            Cancel
          </Text>
        </View>

        {loading ? (
            <ActivityIndicator size="30" color="#1DB954" />
        ) : search ? (
            <FlatList
                showsVerticalScrollIndicator={false}
                data={searchedTracks}
                renderItem={({ item }) => (
                    <SongItem
                    item={item}
                    onPress={(item => handlePlaySpecific(item))}
                    isPlaying={currentTrack && item.id === currentTrack.id && currentTrack?.pid === undefined}
                    />
                )}
            />
        ): searchHistory ? (
          <FlatList
            showsVerticalScrollIndicator={false}
            data={searchHistory}
            renderItem={({ item }) => (
                <SearchItem
                result={item}
                onPress={(item => setupSearch(item))}
                />
            )}
          />
        ): null }
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#121314',
    padding: 8,
    marginHorizontal: 10,
    borderRadius: 5,
    color: 'white',
  },
});

export default SearchScreen;