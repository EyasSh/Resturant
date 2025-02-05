import React, { useState } from "react";
import { StyleSheet, Image, TouchableOpacity } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { useRouter } from 'expo-router';
export default function TableCard() {
  const [isOccupied, setIsOccupied] = useState(false);
  const router = useRouter();
  const handlePress = () => {
    setIsOccupied(!isOccupied);
    router.push('../(Menu)/Menu');
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.imageContainer}>
          <Image source={require("@/assets/images/favicon.png")} style={styles.image} />
        </ThemedView>
        <ThemedText style={styles.text}>Table 1</ThemedText>
        <ThemedView style={styles.bottomInfoContainer}>
          <ThemedText style={styles.bottomInfoText}>
            Status: {isOccupied ? "Occupied" : "Not Occupied"}
          </ThemedText>
          <ThemedText style={styles.bottomInfoText}>Window Side Table</ThemedText>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    padding: 10,
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: 'rgb(160, 160, 160)',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  imageContainer: {
    borderRadius: 10,
    backgroundColor: 'transparent',
    marginBottom: 10,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bottomInfoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    backgroundColor: 'transparent',
  },
  bottomInfoText: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
  },
});
