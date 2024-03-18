import { StyleSheet, Text, View, Pressable } from "react-native";
import React ,{useContext, useEffect} from  "react";
import AntDesign from 'react-native-vector-icons/AntDesign'
import { FIREBASE_FIRESTORE } from '../FirebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { Player } from "../PlayerContext";

const safedUser = require("../global").safedUser;

const SearchItem = ({ result, onPress }) => {
    const {searchHistory, setSearchHistory} = useContext(Player);
    const firestore = FIREBASE_FIRESTORE;

  const handleDelete = async () => {
    const userDoc = doc(firestore, 'user', safedUser.uid)
    let searchArray = [ ...searchHistory ];

    const index = searchArray.indexOf(result);
    if (index !== -1) 
        searchArray.splice(index, 1);

    setSearchHistory(searchArray)
    await updateDoc(userDoc, { search: searchArray });
  }

  const handlePress = () => {
    onPress(result);
  }

  return (
    <Pressable
    onPress={handlePress}
      style={{ flexDirection: "row", alignItems: "center", padding: 10 }}
    >
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={
            { fontWeight: "bold", fontSize: 14, color: "white" }
          }
        >
          {result}
        </Text>

      </View>

        <Pressable
            onPress={handleDelete}
        >
            <AntDesign name="delete" size={20} color={"#C0C0C0"} />
        </Pressable>
    </Pressable>
  );
};

export default SearchItem;

const styles = StyleSheet.create({});
