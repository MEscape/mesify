import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from 'react-native-vector-icons/Ionicons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import Entypo from 'react-native-vector-icons/Entypo'
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { addTrack, putRecentlyPlayedSongs } from './components/player/musicPlayerServices';

import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SearchScreen from "./screens/SearchScreen";
import LikedSongsScreen from "./screens/LikedSongsScreen";
import PlayerBar from "./components/PlayerBar";
import { Player } from "./PlayerContext";
import { useContext, useEffect } from "react";
import TrackPlayer, { Event, useTrackPlayerEvents } from "react-native-track-player";
import FlashMessage from "react-native-flash-message";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FIREBASE_FIRESTORE } from "./FirebaseConfig";
import { getTakenInt, getWaitingQueue, removeWaitingQueue, setTakenInt } from "./global";
import PlaylistScreen from "./screens/PlaylistScreen";

const { getCount, incrementCount } = require("./global");
const safedUser = require("./global").safedUser;
const firestore = FIREBASE_FIRESTORE

const Tab = createBottomTabNavigator();

function BottomTabs() {
  return (
    <Tab.Navigator screenOptions={{
        tabBarStyle:{
            backgroundColor:"rgba(0,0,0,0.5)",
            position: "absolute",
            bottom:0,
            left:0,
            right:0,
            shadowOpacity:4,
            shadowRadius:4,
            elevation:4,
            shadowOffset:{
                width:0,
                height:-4
            },
            borderTopWidth:0 
        }
    }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          headerShown: false,
          tabBarLabelStyle: { color: "white" },
          tabBarIcon: ({ focused }) =>
            focused ? (
              <Entypo name="home" size={24} color="white" />
            ) : (
              <AntDesign name="home" size={24} color="white" />
            ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: "Home",
          headerShown: false,
          tabBarLabelStyle: { color: "white" },
          tabBarIcon: ({ focused }) =>
            focused ? (
                <FontAwesome name="search" size={24} color="white" />
            ) : (
                <FontAwesome name="search" size={24} color="white" />
            ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Home",
          headerShown: false,
          tabBarLabelStyle: { color: "white" },
          tabBarIcon: ({ focused }) =>
            focused ? (
                <Ionicons name="person" size={24} color="white" />
            ) : (
                <Ionicons name="person-outline" size={24} color="white" />
            ),
        }}
      />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();
function Navigation({ user }){
  const {currentTrack, setCurrentTrack} = useContext(Player);
  const {isPlaying, setIsPlaying} = useContext(Player);
  const {savedTracks, setSavedTracks} = useContext(Player);
  const {suggestions, setSuggestions} = useContext(Player);
  const {isShuffled, setIsShuffled} = useContext(Player);

  async function checkPlayerSetup() {
    try {
      await TrackPlayer.getActiveTrack();
      return true;
    } catch (error) {
      return false;
    }
  }

  async function setTrack() { 
    if(!(await checkPlayerSetup()))
      await TrackPlayer.setupPlayer();
    
    const track = await TrackPlayer.getActiveTrack();
    
    if(track) { 
        setIsPlaying(true); 
        setCurrentTrack(track);
    }
  }

  const findPosition = (items, current) => {
    if(current) {
      return items.findIndex((item) => item.title === current.title);
    } else {
      return -1;
    }
  }

  function randomInt(pos, tracks) {
    const lowerBound = pos + 6;
    const upperBound = tracks.length - 1;
    const availableNumbers = [];
    const takenInt = getTakenInt();

    for (let i = lowerBound; i <= upperBound; i++) {
        if (!takenInt.includes(i)) {
            availableNumbers.push(i);
        }
    }

    if (availableNumbers.length === 0) 
        return -1;

    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    const randomInt = availableNumbers[randomIndex];


    return randomInt;
  }

  async function handleQueueLoading(track, lastTrack) {
    if(savedTracks.length > 0 && suggestions.length < 1) {
      const pos = findPosition(savedTracks, track);
      if(findPosition((await TrackPlayer.getQueue()), savedTracks[pos+4]) === -1)
        incrementCount();

        console.log(pos, getCount())
      if(pos !== -1) {
        if(getCount() > 1) {
          setCurrentTrack(track);

          if(!getWaitingQueue()[0] && lastTrack && track && lastTrack.id !== track.id) {
            if(isShuffled) {
              const randInt = randomInt(pos+4, savedTracks);
              if(randInt !== -1) {
                console.log(savedTracks[randInt], "RAND")
                await addTrack(savedTracks[randInt]);
                setTakenInt(randInt);
              } 
            } else {
              console.log(savedTracks[pos+4], "NORMAL")
              await addTrack(savedTracks[pos+4]);
            }
          }
        }
          
        await putRecentlyPlayedSongs(savedTracks[pos]);
      }
    } else {
      const pos = findPosition(suggestions, track);
      if(findPosition((await TrackPlayer.getQueue()), suggestions[pos+4]) === -1)
        incrementCount();

      if(pos !== -1) {
        if(getCount() > 1) {
          setCurrentTrack(track);

          if(!getWaitingQueue()[0] && lastTrack && track && lastTrack.id !== track.id) {
            if(isShuffled) {
              const randInt = randomInt(pos+4, suggestions);
              if(randInt !== -1) {
                console.log(suggestions[randInt], "RAND");
                await addTrack(suggestions[randInt]);
                setTakenInt(randInt);
              }
            } else {
              console.log(savedTracks[pos+4], "NORMAL")
              await addTrack(suggestions[pos+4]);
            }
          }
        }

        await putRecentlyPlayedSongs(suggestions[pos]);
      }
    }
  }

  async function setNewPlaytime(progress, track) {
    try {
      const likedDoc = doc(firestore, 'user', safedUser.uid, 'like', track.id);
      const likedDocSnapshot = await getDoc(likedDoc);
      const likedData = likedDocSnapshot.data();
  
      const currentPlaytime = isNaN(likedData.playtime) ? 0 : likedData.playtime;
      const newPlaytime = currentPlaytime + progress;
      const currentDate = new Date();
  
      let updatedData = { ...likedData };
  
      if (!updatedData.hasOwnProperty('lastTimePlayed')) 
          updatedData.lastTimePlayed = currentDate.toISOString();
      
      updatedData.playtime = newPlaytime;
  
      await setDoc(likedDoc, updatedData);
    } catch(error) {
      console.error(error);
    }
}

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    switch (event.type) {
      case Event.PlaybackActiveTrackChanged:
        if(event.lastTrack && event.lastTrack.playtime)
          setNewPlaytime(event.lastPosition, event.lastTrack);
        
        await handleQueueLoading(event.track, event.lastTrack);

        if(getWaitingQueue()[0] && event.track.id && event.track.id === getWaitingQueue()[0].id) 
          removeWaitingQueue();
        break;
    }
  })

  useEffect(() => {
    setTrack();
  }, [])

    return (
        <NavigationContainer>
            <Stack.Navigator>
              {user ? (
                <>
                  <Stack.Screen name="Main" component={BottomTabs} options={{headerShown:false}}/>
                  <Stack.Screen name="Liked" component={LikedSongsScreen} options={{headerShown:false}}/>
                  <Stack.Screen name="Playlist" component={PlaylistScreen} options={{headerShown:false}}/>
                </>
              ) : (
                <Stack.Screen name="Login" component={LoginScreen} options={{headerShown:false}}/>
              )}
            </Stack.Navigator>
            <PlayerBar />
            <FlashMessage position="top" />
        </NavigationContainer>
    )
}

export default Navigation