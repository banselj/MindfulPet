import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useSelector } from 'react-redux';
import PetService from '../../services/pet/PetService';

const ARPetView = ({ onClose }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const pet = useSelector(state => state.pet);
  const [arMode, setArMode] = useState('follow'); // 'follow', 'static', 'playful'

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleCapture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync();
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        // Show success message
      } catch (error) {
        console.error('Failed to take photo:', error);
      }
    }
  };

  const toggleARMode = () => {
    const modes = ['follow', 'static', 'playful'];
    const currentIndex = modes.indexOf(arMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setArMode(modes[nextIndex]);
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        ref={ref => setCameraRef(ref)}
        type={Camera.Constants.Type.back}
      >
        <View style={styles.overlay}>
          {/* AR Pet Renderer would go here */}
          {/* This is a placeholder for the actual AR implementation */}
          <View style={[
            styles.petPlaceholder,
            arMode === 'follow' && styles.followMode,
            arMode === 'playful' && styles.playfulMode
          ]}>
            <Text style={styles.petText}>🐾</Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.button}
              onPress={toggleARMode}
            >
              <Text style={styles.buttonText}>
                Mode: {arMode.charAt(0).toUpperCase() + arMode.slice(1)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleCapture}
            >
              <Text style={styles.buttonText}>📸</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Pet Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {PetService.generateFeedback()[0] || 'I love exploring with you!'}
            </Text>
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  petPlaceholder: {
    position: 'absolute',
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    left: '50%',
    marginLeft: -50,
    marginTop: -50,
  },
  followMode: {
    transform: [{ scale: 1.2 }],
  },
  playfulMode: {
    transform: [{ scale: 1.1 }, { rotate: '10deg' }],
  },
  petText: {
    fontSize: 40,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 25,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
  },
  statusContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 10,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ARPetView;
