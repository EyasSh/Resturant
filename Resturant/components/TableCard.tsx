import React from "react";
import { StyleSheet, Image } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

export default function TableCard() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.imageContainer}>
        <Image source={require("@/assets/images/favicon.png")} style={styles.image} />
      </ThemedView>
      
      <ThemedText style={styles.text}>Table 1</ThemedText>
      
      <ThemedView style={styles.bottomInfoContainer}>
        <ThemedText style={styles.bottomInfoText}>Status: Not Occupied</ThemedText>
        <ThemedText style={styles.bottomInfoText}>Window Side Table</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,            // Fixed width, no stretch horizontally
    padding: 10,           // Container padding
    borderRadius: 10,
    marginVertical: 10,
    backgroundColor: 'rgb(160, 160, 160)',
    
    // Column layout for the overall card
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',

    // iOS Box shadow
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    // Android box shadow
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
    // Stack items in a column
    flexDirection: 'column',
    // Left-align the items so they start near the container’s left edge
    alignItems: 'flex-start',
    // Make this container span full width so padding on the parent is respected
    width: '100%',
    backgroundColor: 'transparent',
  },
  bottomInfoText: 
  {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    },
});
