import { StyleSheet, Text, Alert, View, SafeAreaView, Pressable, TextInput, ScrollView } from "react-native";
import React ,{ useState } from "react";
import { LinearGradient } from "react-native-linear-gradient";
import Icon from 'react-native-vector-icons/Entypo'
import { FIREBASE_AUTH } from "../FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const auth = FIREBASE_AUTH;

    async function authenticate ()  {
        if(email && password) {
            try {
                await signInWithEmailAndPassword(
                    auth,
                    email, 
                    password
                );
            } catch(error) {
                if(error.code == 'auth/invalid-credential')
                    Alert.alert('Flasche Anmeldedaten')
                else if(error.code == 'auth/invalid-email')
                    Alert.alert('Flasches Email-Format')
                else
                    Alert.alert(error)
            }
        }
    }

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps='handled'
        >
            <LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1 }}>
            <SafeAreaView>
                <View style={{ height: 40 }} />
                <Icon
                    style={{ textAlign: "center" }}
                    name="spotify"
                    size={80}
                    color="white"
                />
                <Text
                    style={{
                        color: "white",
                        fontSize: 40,
                        fontWeight: "bold",
                        textAlign: "center",
                        marginTop: 40,
                    }}
                >
                    Millionen von Songs kostenlos auf Mesify!
                </Text>
        
                <View style={{ height: 80 }} />

                <TextInput
                    style={styles.input}
                    placeholder="E-Mail"
                    placeholderTextColor="#C0C0C0"
                    onChangeText={text => setEmail(text)}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Passwort"
                    placeholderTextColor="#C0C0C0"
                    secureTextEntry
                    onChangeText={text => setPassword(text)}
                />
        
                <Pressable
                    onPress={authenticate}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>Einlogen</Text>
                </Pressable>
            </SafeAreaView>
            </LinearGradient>
        </ScrollView>
      );
};
  
export default LoginScreen;
  
const styles = StyleSheet.create({
    input: {
        backgroundColor: "#131624",
        padding: 10,
        marginLeft: "auto",
        marginRight: "auto",
        width: 300,
        borderRadius: 25,
        marginVertical:10,
        borderColor:"#C0C0C0",
        borderWidth:0.8,
        color: "white",
    },
    button: {
        padding: 10,
        marginLeft: "auto",
        marginRight: "auto",
        width: 300,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        flexDirection:"row",
        alignItems:"center",
        marginVertical:10,
        borderColor:"#C0C0C0",
        borderWidth:0.8,
        backgroundColor:"#1DB954"
    },
    buttonText: {
        fontWeight:"500",
        color:"white",
        textAlign:"center",
        flex:1
    }
});
