import React, { useEffect, useState } from 'react';
import { Alert } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navigation from "./StackNavigator";
import { FIREBASE_AUTH, FIREBASE_FIRESTORE, FIREBASE_STORAGE } from './FirebaseConfig';
import { ModalPortal } from 'react-native-modals';
import { PlayerContext } from './PlayerContext';
import { showMessage } from 'react-native-flash-message';
import packageJson from './package.json';
import { getDownloadURL, listAll, ref } from 'firebase/storage';
import { downloadAndInstallApk } from './apkDownloader';
import BootSplash from "react-native-bootsplash";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const firestore = FIREBASE_FIRESTORE;
  const storage = FIREBASE_STORAGE;

  const isVersionGreaterThan = (v1, v2) => {
    const parts1 = v1.split('-').map(part => parseInt(part));
    const parts2 = v2.split('.').map(part => parseInt(part));
  
    for (let i = 0; i < parts1.length; i++) {
      if (parts1[i] > parts2[i]) {
        return true;
      } else if (parts1[i] < parts2[i]) {
        return false;
      }
    }
  
    return false;
  };

  function sortBasedOnName(a, b) {
    const nameToNumber = (name) => {
      const parts = name.split('-'); // Dateinamen in Segmente aufteilen
      // Segmente in Zahlen umwandeln und zu einer einzigen Zahl zusammensetzen
      return parts.reduce((acc, val) => acc * 10 + parseInt(val), 0);
    };
    
    // Vergleich der umgewandelten Namen
    return nameToNumber(b.name) - nameToNumber(a.name);
  }

  async function versionControll() {
    const version = packageJson.version;
    const folderRef = ref(storage, 'appVersion');

    try {
      const files = await listAll(folderRef);

      if(files.items.length > 0) {
        files.items.sort(sortBasedOnName);
        const latest = files.items[0];
    
        const url = await getDownloadURL(latest);
        const storageVersion = latest.name.split('.').slice(0, -1).join('.');

        if (isVersionGreaterThan(storageVersion, version)) {
          showMessage({
            message: "Neu App Version verfügbar.",
            type: "warning",
            duration: 10000,
            onPress: async () => {
              const apk = await downloadAndInstallApk(url);
              if(apk)
                Alert.alert(`Neue Apk befindet sich unter (Downloads): ${apk}, installiere sie und deintalliere diese alte App.`)
            },
          });
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    versionControll();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('user').then((storedUser) => {
      if (storedUser !== null) 
        setUser(JSON.parse(storedUser));
      
      setLoading(false);
    })
    .then(async () => await BootSplash.hide({ fade: true }));
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        if (state.isInternetReachable) {
          showMessage({
            message: "Internetverbindung ist stabil.",
            type: "success",
          });
        } else {
          showMessage({
            message: "Keine Internetverbindung.",
            type: "default",
          });
        }
      } else {
        showMessage({
          message: "Internetverbindung unterbrochen.",
          type: "danger",
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    onAuthStateChanged(FIREBASE_AUTH, async (user) => {
      if(user) {
        try {
          const userDoc = doc(firestore, 'user', user.uid)
          const userData = (await getDoc(userDoc)).data()
          setUser(user.uid);

          AsyncStorage.setItem('user', JSON.stringify({ 
            uid: user.uid,
            username: userData.username,
            img: userData?.img
          }));
        } catch (error) {
          Alert.alert(error);
        }
      } else {
        setUser(null);
      }
    });
  }, []);

  if (!loading) {
    return (
      <>
        <PlayerContext>
          <Navigation user={user} />
          <ModalPortal />
        </PlayerContext>
      </>
    );
  }
}

export default App;
