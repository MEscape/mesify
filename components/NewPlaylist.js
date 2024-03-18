import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import { Modal, TextInput, Pressable, Text, View, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { FIREBASE_FIRESTORE } from '../FirebaseConfig';
import { Player } from '../PlayerContext';
import { encode as base64Encode } from 'base-64';
import * as Progress from 'react-native-progress';
import { ytsearch } from '../api';

const NewPlaylist = ({ userProfile }) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistLink, setPlaylistLink] = useState('');
  const [playlistGenre, setPlaylistGenre] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0.0);
  const [isExportVisible, setIsExportVisible] = useState(false);
  const [errorName, setErrorName] = useState('');
  const [errorGenre, setErrorGenre] = useState('');
  const [errorLink, setErrorLink] = useState('');
  const {playlists, setPlaylists} = useContext(Player);
  const firestore = FIREBASE_FIRESTORE;
  const progressBarWidth = Dimensions.get('window').width - 120;

  async function handleAddPlaylist() {
    setIsDropdownVisible(!isDropdownVisible);
    setErrorGenre('');
    setErrorName('');
    setPlaylistGenre('');
    setPlaylistName('');
  }

  async function handleCreatePlaylist(state = true) {
    if(playlistName.trim() !== '') { 
        setErrorName('');
        if(playlistGenre.trim() !== '') {
          setIsDropdownVisible(false);

          let playlistData = {
              category: playlistGenre,
              cover: '',
              playtime: 0,
              new: state,
            };
        
            try {
              const playlistCollectionRef = doc(firestore, 'user', userProfile.uid, 'playlist', playlistName);
              const playlistDoc = await getDoc(playlistCollectionRef);

              if (playlistDoc.exists()) {
                setErrorName('Unter diesem Namen existiert bereits eine Playlist.');
                setErrorLink('Unter diesem Namen existiert bereits eine Playlist.');

                return null;
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

                return songDoc;
              }
            } catch (error) {
              console.error('Error adding playlist document: ', error);
              Alert.alert('Beim Erstellen der Playlist ist ein Fehler aufgetreten.');

              return null;
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
    setIsExportVisible(!isExportVisible);
  }

  const extractPlaylistId = (spotifyPlaylistUrl) => {
    try {
      // Extrahiere die ID aus der Playlist-URL
      const regex = /playlist\/(\w+)/;
      const match = spotifyPlaylistUrl.match(regex);
      
      // Rückgabe der extrahierten Playlist-ID
      if (match && match.length > 1) {
          return match[1];
      } else {
          return null; // Wenn keine Übereinstimmung gefunden wurde
      }
    } catch (error) {
      Alert.alert(error)
      console.error("Fehler beim Extrahieren der Playlist-ID:", error);
      return null;
    }
  }

  async function getToken(clientId, clientSecret) {
    try {
      const authOptions = {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + base64Encode(`${clientId}:${clientSecret}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      };

      const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
      const data = await response.json();
      
      return data.access_token;
    } catch (error) {
      Alert.alert(error)
      console.error('Error during token exchange:', error);
      return null;
    }
  }

  async function getPlaylistData(playlistId, accessToken) {
    try {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (response.ok) {
        const playlistData = await response.json();
        return playlistData;
      } else {
        Alert.alert(`Failed to fetch playlist data: ${response.status}`);
        console.error('Failed to fetch playlist data:', response.status);
        return null;
      }
    } catch (error) {
      Alert.alert(`Error fetching playlist data: ${error}`);
      console.error('Error fetching playlist data:', error);
      return null;
    }
  }

  async function handleSearch(text, playlistName) {
    try {
      let response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${text}&type=video&maxResults=1&key=AIzaSyDjvrqw9eY8fBTOQkyUCccXY5pzHIURSqU`)
      let json = await response.json()
  
      if(json && !('error' in json)) {
        console.log("B");
        let video = json.items[0]
        const id = video.id.videoId
        const title = video.snippet.title
        const artist = video.snippet.channelTitle
        const artwork = video.snippet.thumbnails.medium.url
  
        video =  { createdAt: new Date(), title: title, creator: artist, cover: artwork }

        const song = doc(firestore, 'user', userProfile.uid, 'playlist', playlistName, 'song', id);
        await setDoc(song, video);
      } else {
        let json = (await ytsearch(text))[0]

        console.log(json)
  
        if(json && json.id && json.title && json.artist && json.artwork) {
          const id = json.id
          const title = json.title
          const artist = json.artist
          const artwork = json.artwork
  
          video =  { timestamp: new Date(), title: title, creator: artist, cover: artwork }
        
          const song = doc(firestore, 'user', userProfile.uid, 'playlist', playlistName, 'song', id);
          await setDoc(song, video);
        }
      }
    } catch(error) {
      console.log('search', error);
      Alert.alert(error);
    }
}

  const handleAddingWithYt = async (tracks, playlistName) => {
    setProgress(0.0);
    setShow(true);

    const totalTracks = tracks.length;
    let completedTracks = 0;

    for (const trackData of tracks) {
      const track = trackData.track;
      await handleSearch(`${track.name} ${track.artists[0].name}`, playlistName);
      completedTracks++;
      setProgress(completedTracks / totalTracks);
    }
  };

  const handleImportPlaylist = async () => {
    if(playlistLink.trim() !== '') { 
      setErrorLink('');
      if(playlistGenre.trim() !== '') {
        setErrorGenre('');
        const playlistId = extractPlaylistId(playlistLink);

        if(playlistId) {
          const accessToken = await getToken(
            '9d13712e2baf475b903d7e27a203afec', 
            'a241ca7466d54e38b21b7492b6c03e45'
          );

          const playlistData = await getPlaylistData(playlistId, accessToken);
          setPlaylistName(playlistData.name);
          const ok = await handleCreatePlaylist(false);

          if(ok && playlistData) {

            const unsubscribe = onSnapshot(ok, async (doc) => {
              if (doc.exists()) {
                console.log('Dokument wurde erfolgreich erstellt');

                try {
                  const tracks = playlistData.tracks.items;
                  await handleAddingWithYt(tracks, playlistData.name);
                  await deleteDoc(doc.ref);
                } catch (e) {
                  console.error('snapshot', e, doc, ok);
                } finally {
                  unsubscribe();
                  setShow(false);
                  setIsExportVisible(false);
                }
              }
            });
          }
        }
      } else {
        setErrorGenre('Bitte gib einen Genre für die Playlist ein.');
      }
    } else {
        setErrorLink('Bitte gib einen Share-Link für die Playlist ein.');
    }
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
                Playlist hinzufügen
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
                <Pressable onPress={() => { setIsDropdownVisible(false); setErrorName(''); setErrorGenre(''); }} style={{ flex: 1, marginRight: 5, borderWidth: 1, borderColor: 'white', borderRadius: 5 }}>
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

        <Modal
        visible={isExportVisible}
        transparent={true}
        animationType="slide"
        >
        <LinearGradient colors={["#040306", "#131624"]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: '80%', padding: 20, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 20, textAlign: 'center' }}>
              Playlist hinzufügen
            </Text>
            <TextInput
                placeholder="Playlist Link eingeben"
                placeholderTextColor="grey"
                value={playlistLink}
                onChangeText={text => setPlaylistLink(text)}
                style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                    color: 'white', 
                    padding: 10, 
                    borderRadius: 5, 
                    marginBottom: 20, 
                    borderColor: errorLink ? 'red' : 'white', // Texteingabe rot färben, wenn ein Fehler auftritt
                    borderWidth: errorLink ? 1 : 0 // Texteingabe umranden, wenn ein Fehler auftritt
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
            {errorLink || errorGenre ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{errorLink || errorGenre}</Text> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pressable onPress={() => {setIsExportVisible(false); setErrorLink(''); }} style={{ flex: 1, marginRight: 5, borderWidth: 1, borderColor: 'white', borderRadius: 5 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', padding: 10, textAlign: 'center' }}>Abbrechen</Text>
                </Pressable>
                <Pressable onPress={handleImportPlaylist} style={{ flex: 1, marginLeft: 5, borderRadius: 5 }}>
                <LinearGradient colors={["#1DB954", "#1DB954"]} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 5 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', padding: 10, textAlign: 'center' }}>Importieren</Text>
                </LinearGradient>
                </Pressable>
            </View>
            {show && (
                <Progress.Bar 
                  progress={progress} 
                  color={"#1DB954"} 
                  width={progressBarWidth} 
                  style={{ width: "100%", alignSelf: 'flex-start', marginTop: 20 }} 
                />
              )
            }
            </View>
        </LinearGradient>
        </Modal>
    </>
  );
};

export default NewPlaylist;
