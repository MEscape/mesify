import { StyleSheet, Text, Pressable, Image } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

const RecentlyPlayedCard = ({ item }) => {
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
        navigation.navigate("Info", {
          title: item,
        })
      }
      style={{ margin: 10 }}
    >
      <Image
        style={{ width: 130, height: 130, borderRadius: 5 }}
        source={{ uri: item?.cover }}
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

export default RecentlyPlayedCard;

const styles = StyleSheet.create({});
