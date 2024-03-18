import { collection, doc, setDoc } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Modal, TextInput, Pressable, Text, View, Alert } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { FIREBASE_FIRESTORE } from '../FirebaseConfig';
import { Player } from '../PlayerContext';

const NewPlaylist = ({ userProfile, handleImportPlaylist }) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistGenre, setPlaylistGenre] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [errorName, setErrorName] = useState('');
  const [errorGenre, setErrorGenre] = useState('');
  const {playlists, setPlaylists} = useContext(Player);
  const firestore = FIREBASE_FIRESTORE;

  async function handleAddPlaylist() {
    setIsDropdownVisible(!isDropdownVisible);
    setErrorGenre('');
    setErrorName('');
    setPlaylistGenre('');
    setPlaylistName('');
  }

  async function handleCreatePlaylist() {
    if(playlistName.trim() !== '') { 
        setErrorName('');
        if(playlistGenre.trim() !== '') {
          setIsDropdownVisible(false);

          let playlistData = {
              category: playlistGenre,
              cover: '',
              playtime: 0,
              new: true,
            };
        
            try {
              const playlistCollectionRef = doc(firestore, 'user', userProfile.uid, 'playlist', playlistName);
              const playlistDoc = await getDoc(playlistCollectionRef);
              if (playlistDoc.exists()) {
                setErrorName('Unter diesem Namen existiert bereits eine Playlist.');
              } else {
                await setDoc(playlistCollectionRef, {
                  ...playlistData
                });
  
                const songsCollectionRef = collection(playlistCollectionRef, 'song');
                const songDoc = doc(songsCollectionRef);
                await setDoc(songDoc, {});
  
                let newPlaylists = [ ...playlists ];
                playlistData.name = playlistName;
                newPlaylists.push(playlistData);
                setPlaylists(newPlaylists);
          
                setErrorName('');
                setErrorGenre('');
              }
            } catch (error) {
              console.error('Error adding playlist document: ', error);
              Alert.alert('Beim Erstellen der Playlist ist ein Fehler aufgetreten.');
            }
        } else {
            setErrorGenre('Bitte gib einen Genre für die Playlist ein.');
        }
    } else {
        setErrorName('Bitte gib einen Namen für die Playlist ein.');
    }
  };

  const handleSpotifyImport = () => {
    setIsDropdownVisible(!isDropdownVisible);
    handleImportPlaylist()
  }

  return (
    <>
        <Pressable onPress={handleAddPlaylist}>
            <FontAwesome name="plus" size={24} color="white" />
        </Pressable>

        <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="slide"
        >
        <LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '80%', padding: 20, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' }}>
                Gib einen Namen für deine Playlist ein.
            </Text>
            <TextInput
                placeholder="Playlist Namen eingeben"
                placeholderTextColor="grey"
                value={playlistName}
                onChangeText={text => setPlaylistName(text)}
                style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white', 
                    padding: 10, 
                    borderRadius: 5, 
                    marginBottom: 20, 
                    borderColor: errorName ? 'red' : 'white', // Texteingabe rot färben, wenn ein Fehler auftritt
                    borderWidth: errorName ? 1 : 0 // Texteingabe umranden, wenn ein Fehler auftritt
                }}
            />
            <TextInput
                placeholder="Playlist Genre eingeben"
                placeholderTextColor="grey"
                value={playlistGenre}
                onChangeText={text => setPlaylistGenre(text)}
                style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white', 
                    padding: 10, 
                    borderRadius: 5, 
                    marginBottom: 20, 
                    borderColor: errorGenre ? 'red' : 'white', // Texteingabe rot färben, wenn ein Fehler auftritt
                    borderWidth: errorGenre ? 1 : 0 // Texteingabe umranden, wenn ein Fehler auftritt
                }}
            />
            {errorName || errorGenre ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{errorName || errorGenre}</Text> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pressable onPress={() => setIsDropdownVisible(false)} style={{ flex: 1, marginRight: 5, borderWidth: 1, borderColor: 'white', borderRadius: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', padding: 10, textAlign: 'center' }}>Abbrechen</Text>
                </Pressable>
                <Pressable onPress={handleCreatePlaylist} style={{ flex: 1, marginLeft: 5, borderRadius: 5 }}>
                <LinearGradient colors={["#1DB954", "#1DB954"]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 5 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', padding: 10, textAlign: 'center' }}>Erstellen</Text>
                </LinearGradient>
                </Pressable>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 10 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'white', marginHorizontal: 5 }} />
              <Text style={{ color: 'white', marginHorizontal: 10 }}>oder</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'white', marginHorizontal: 5 }} />
            </View>
            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <Pressable onPress={handleSpotifyImport} style={{ width: "100%", borderWidth: 1, borderColor: 'white', borderRadius: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', paddingVertical: 10, paddingHorizontal: 20, textAlign: "center" }}>Von Spotify importieren</Text>
              </Pressable>
            </View>
            </View>
        </LinearGradient>
        </Modal>
    </>
  );
};

export default NewPlaylist;
