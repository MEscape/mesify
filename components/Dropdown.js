import React, { useState, useRef, useContext } from 'react';
import { Pressable, View, Text, StyleSheet, Dimensions, Modal, Share } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import { addToWaitingQueue } from './player/musicPlayerServices';
import { Player } from '../PlayerContext';
import { showMessage } from 'react-native-flash-message';
import { setWaitingQueue } from '../global';
import PlaylistCollection from './PlaylistCollection';

const Dropdown = ({ item }) => {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const {currentTrack, setCurrentTrack} = useContext(Player);
  const {skipEnabled, setSkipEnabled} = useContext(Player);
  const [modalVisible, setModalVisible] = useState(false);
  
  const dotRef = useRef(null);

  const handleAdditional = () => {
    if (dotRef.current) {
      dotRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPosition({ top: pageY + height + 10, right: Dimensions.get('window').width - pageX - width });
        setIsDropdownVisible(!isDropdownVisible);
      });
    }
  };

  const handleAddToPlaylist = () => {
    setIsDropdownVisible(false);
    setModalVisible(true);
  }

  const handleRemoveFromPlaylist = () => {

  }

  const handleWaitingQueue = async () => {
    setSkipEnabled(false);
    setWaitingQueue(item);
    setIsDropdownVisible(false);

    showMessage({
        message: `${item.title} wurde der Warteschlange hinzugefügt.`,
        type: "success",
    });

    await addToWaitingQueue(currentTrack, item);
    setSkipEnabled(true);
  }

  const handleArtist = () => {

  }

  const handleShare = async () => {
    const url = 'https://www.youtube.com/watch?v=' + item.id;
    const message = `Hör dir "${item.title}" von ${item.artist} an: ${url}`;
    const options = {
      message: message,
      url: url,
      title: 'Teilen über:',
      subject: 'Teilen über:',
    };
  
    try {
      const result = await Share.share(options);
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Teilen wurde durch eine Aktivität (z. B. E-Mail) abgeschlossen
          console.log(`Erfolgreich über ${result.activityType} geteilt`);
        } else {
          // Teilen wurde direkt abgeschlossen
          console.log('Erfolgreich geteilt');
        }
      } else if (result.action === Share.dismissedAction) {
        // Teilen wurde abgebrochen
        console.log('Teilen abgebrochen');
      }
    } catch (error) {
      alert(error.message);
    }
  }

  const handleAddedSong = (added) => {
    setModalVisible(false);

    if(added)
      showMessage({
          message: `${item.title} wurde der Playlist hinzugefügt.`,
          type: "success",
      });
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={handleAdditional} ref={dotRef}>
        <Entypo name="dots-three-vertical" size={24} color={"#C0C0C0"} />
      </Pressable>

      <Modal visible={isDropdownVisible} transparent={true} animationType="fade">
        <Pressable style={styles.backdrop} onPress={handleAdditional} />
        <View style={[styles.dropdown, { top: dropdownPosition.top, right: dropdownPosition.right }]}>
          <Pressable style={styles.menuItem} onPress={handleAddToPlaylist}>
            <Text style={styles.menuText}>Zu Playlist hinzufügen</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={handleRemoveFromPlaylist}>
            <Text style={styles.menuText}>Aus Playlist entfernen</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={handleWaitingQueue}>
            <Text style={styles.menuText}>In die Warteschlange</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={handleArtist}>
            <Text style={styles.menuText}>Künstler anzeigen</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={handleShare}>
            <Text style={styles.menuText}>Teilen</Text>
          </Pressable>
        </View>
      </Modal>

      <PlaylistCollection
        modalVisible={modalVisible}
        setModalVisible={setIsDropdownVisible}
        song={item}
        onPress={(added) => handleAddedSong(added)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: '#212121',
    borderRadius: 10,
    padding: 10,
    elevation: 3,
    zIndex: 1000,
    minWidth: 160,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
  }
});

export default Dropdown;
