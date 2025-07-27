import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { YouTubeAPI, Summarizer } from '@inanutshell/shared';

const App = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>InANutshell</Text>
      <Text style={styles.subtitle}>YouTube Video Summarizer</Text>
      <Text style={styles.description}>
        Share a YouTube video to this app to get an instant summary!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
    lineHeight: 24,
  },
});

export default App;