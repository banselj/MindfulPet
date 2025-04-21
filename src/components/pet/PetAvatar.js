import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const PetAvatar = ({ petAttributes }) => {
  // In a real implementation, we would determine the pet appearance based on petAttributes
  // For now, we'll use a placeholder
  const petImage = petAttributes?.healthy 
    ? require('../../../assets/images/pet-healthy.png')
    : require('../../../assets/images/pet-sick.png');

  return (
    <View style={styles.avatarContainer}>
      <Image source={petImage} style={styles.petImage} />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  petImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
});

export default PetAvatar;
