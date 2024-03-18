import { StyleSheet, Text, Pressable, Image } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

const ArtistCard = ({ item }) => {
  const navigation = useNavigation();

  function shortenName(name) {
    if (name.length > 12) {
      return name.substring(0, 15) + "...";
    } else {
      return name;
    }
  }

  return (
    <Pressable
      onPress={() =>
        navigation.navigate("Artist", {
          name: item,
        })
      }
      style={{ margin: 10 }}
    >
      <Image
        style={{ width: 130, height: 130, borderRadius: 5 }}
        source={{ uri: item?.logo }}
      />
      <Text
        numberOfLines={item?.name.length > 15 ? 2 : 1}
        style={{
          fontSize: 13,
          fontWeight: "500",
          color: "white",
          marginTop: 10,
        }}
      >
        {shortenName(item?.name)}
      </Text>
    </Pressable>
  );
};

export default ArtistCard;

const styles = StyleSheet.create({});
