import { StyleSheet, Text, View, Pressable, Image } from "react-native";
import React from  "react";

const PlaylistItem = ({ item, onPress }) => {


  const handlePress = () => {
    onPress(item);
  }

  return (
    <Pressable
    onPress={handlePress}
      style={{ flexDirection: "row", alignItems: "center", gap:8, marginVertical:10 }}
    >
        <Image
            source={{
                uri: item?.cover
            }}
            style={{ width: 50, height: 50, borderRadius: 4 }}
        />
        <View>
            <Text style={{color:"white"}}>{item?.name}</Text>
            <Text style={{color:"#989898", marginTop:7}}>{item?.category}</Text>
        </View>
    </Pressable>
  );
};

export default PlaylistItem;

const styles = StyleSheet.create({});
