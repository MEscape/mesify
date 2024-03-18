import React, { useContext } from 'react';
import { View, Text, Pressable } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { setDoc, doc, deleteDoc } from 'firebase/firestore';
import { FIREBASE_FIRESTORE } from '../../FirebaseConfig';
import { Player } from '../../PlayerContext';
const safedUser = require("../../global").safedUser;

const SongInfo = ({ track }) => {
  const {currentTrack, setCurrentTrack} = useContext(Player);
    const firestore = FIREBASE_FIRESTORE;

    const handleLike = async () => {
      const likeCollection = doc(firestore, 'user', safedUser.uid, 'like', track.id)
  
      console.log(likeCollection);

      if(currentTrack.liked) {
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
        setCurrentTrack(newCurrentTrack);
        

        const trackData = {
          cover: track?.artwork,
          createdAt: new Date(),
          creator: track?.artist,
          playtime: 0,
          title: track?.title
        }
  
        try {
          await setDoc(likeCollection, trackData)
        } catch (error) {
          console.log(error);
          Alert.alert(error);
        }
      }
    }

    function shortenName(name) {
        if (name && name.length > 33) {
          return name.substring(0, 33) + "...";
        } else {
          return name;
        }
    }

    return (
        <View
            style={{
            marginTop: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            }}
        >
            <View>
                <Text
                    style={{ fontSize: 18, fontWeight: "bold", color: "white" }}
                >
                    {shortenName(track?.title)}
                </Text>
                <Text style={{ color: "#D3D3D3", marginTop: 4 }}>
                    {track?.artist}
                </Text>
            </View>

            <Pressable
                onPress={handleLike}
            >
                <AntDesign name={currentTrack?.liked ? "heart" : "hearto"} size={24} color="#1DB954" />
            </Pressable>
        </View>
    );
}

export default SongInfo;