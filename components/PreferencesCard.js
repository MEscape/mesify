import { StyleSheet, Text, Pressable, Image } from "react-native";
import React, {useContext} from "react";
import { useNavigation } from "@react-navigation/native";
import TrackPlayer from "react-native-track-player";
import { initPlayer } from "./player/musicPlayerServices";
import { Player } from "../PlayerContext";

const PreferencesCard = ({ item }) => {
  const navigation = useNavigation();
  const {currentTrack, setCurrentTrack} = useContext(Player);
  const {isPlaying, setIsPlaying} = useContext(Player);

  function shortenName(name) {
    if (name.length > 12) {
      return name.substring(0, 15) + "...";
    } else {
      return name;
    }
  }

  async function handlePlaySpecific(item) {
    setIsPlaying(true);
    setCurrentTrack(item);
    await initPlayer(item);
    await TrackPlayer.play();
  }

  return (
    <Pressable
      onPress={() =>
        handlePlaySpecific(item)
        /*navigation.navigate("Info", {
          title: item,
        })*/
      }
      style={{ margin: 10 }}
    >
      <Image
        style={{ width: 130, height: 130, borderRadius: 5 }}
        source={{ uri: item?.artwork }}
      />
      <Text
        numberOfLines={item?.title.length > 15 ? 2 : 1}
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: "white",
          marginTop: 10,
        }}
      >
        {shortenName(item?.title)}
      </Text>
    </Pressable>
  );
};

export default PreferencesCard;

const styles = StyleSheet.create({});