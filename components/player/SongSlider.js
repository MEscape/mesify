import Slider from '@react-native-community/slider';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import TrackPlayer, { useProgress } from 'react-native-track-player';

const SongSlider = () => {
    const { position, duration } = useProgress();
    const [sliderValue, setSliderValue] = useState(position);

    useEffect(() => {
        setSliderValue(position);
    }, [position]);

    const handleValueChange = async (value) => {
        await TrackPlayer.seekTo(value);
        setSliderValue(value);
    };

    return (
        <View style={{ marginTop: 10 }}>
            <Slider
                style={{width: '100%', height: 40}}
                minimumValue={0}
                maximumValue={duration}
                value={sliderValue}
                onValueChange={handleValueChange}
                minimumTrackTintColor="white"
                maximumTrackTintColor="gray"
                thumbTintColor="white"
            />
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(position)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
        </View>
    );
};

const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const styles = StyleSheet.create({
    timeContainer: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        color: 'white',
        fontSize: 15,
        color: '#D3D3D3',
    },
});

export default SongSlider;