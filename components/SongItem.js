import { StyleSheet, Text, Alert, View, Pressable, Image } from "react-native";
import React ,{useState, useContext} from  "react";
import AntDesign from 'react-native-vector-icons/AntDesign'
import { FIREBASE_FIRESTORE } from '../FirebaseConfig';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Player } from "../PlayerContext";
import Dropdown from "./Dropdown";

const safedUser = require("../global").safedUser;
const { resetCount, resetTakenInt } = require("../global");

const SongItem = ({ item, onPress, isPlaying }) => {
  const firestore = FIREBASE_FIRESTORE;
  const [liked, setLiked] = useState(item.liked);
  const {currentTrack, setCurrentTrack} = useContext(Player);

  const handleLike = async () => {
    const likeCollection = doc(firestore, 'user', safedUser.uid, 'like', item.id)

    if(liked) {
      setLiked(false)
      if(currentTrack && currentTrack.id == item.id) {

        const newCurrentTrack = { ...currentTrack };
        newCurrentTrack.liked = false;
        setCurrentTrack(newCurrentTrack);
      }
      console.log(currentTrack, item)

      try {
        await deleteDoc(likeCollection)
      } catch (error) {
        console.log(error);
        Alert.alert(error);
      }
    } else {
      setLiked(true)
      if(currentTrack && currentTrack.id == item.id) {

        const newCurrentTrack = { ...currentTrack };
        newCurrentTrack.liked = true;
        setCurrentTrack(newCurrentTrack);
      }
      console.log(currentTrack, item)

      const track = {
        cover: item?.artwork,
        createdAt: new Date(),
        creator: item?.artist,
        playtime: 0,
        title: item?.title
      }

      try {
        await setDoc(likeCollection, track)
      } catch (error) {
        console.log(error);
        Alert.alert(error);
      }
    }
  }

  const handlePress = () => {
    resetCount();
    resetTakenInt();
    setCurrentTrack(item);
    onPress(item);
  }

  return (
    <Pressable
    onPress={handlePress}
      style={{ flexDirection: "row", alignItems: "center", padding: 10 }}
    >
      <Image
        style={{ width: 50, height: 50, marginRight: 10 }}
        source={{ uri: item?.artwork }}
      />

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={
            isPlaying
              ? {
                  fontWeight: "bold",
                  fontSize: 14,
                  color: "#3FFF00",
                }
              : { fontWeight: "bold", fontSize: 14, color: "white" }
          }
        >
          {item?.title}
        </Text>
        <Text style={{ marginTop: 4, color: "#989898" }}>
          {item?.artist}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 7,
          marginHorizontal: 10,
        }}
      >
        <Pressable
          onPress={handleLike}
        >
          <AntDesign name={(currentTrack && currentTrack?.liked && currentTrack.id === item.id) 
          || (liked && currentTrack?.id !== item.id)  ? "heart" : "hearto"} size={24} color="#1DB954" />
        </Pressable>
        <Dropdown item={item}/>
      </View>
    </Pressable>
  );
};

export default SongItem;

const styles = StyleSheet.create({});
