import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface State { error: Error | null }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <ScrollView style={styles.scroll}>
          <Text style={styles.name}>{error.name}: {error.message}</Text>
          <Text style={styles.stack}>{error.stack}</Text>
        </ScrollView>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => this.setState({ error: null })}
        >
          <Text style={styles.btnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', padding: 24, paddingTop: 60 },
  title:     { fontSize: 18, fontWeight: '700', color: '#F85149', marginBottom: 12 },
  scroll:    { flex: 1, marginBottom: 16 },
  name:      { fontSize: 14, fontWeight: '600', color: '#F0F6FC', marginBottom: 8 },
  stack:     { fontSize: 11, color: '#8B949E', lineHeight: 18 },
  btn:       { backgroundColor: '#21262D', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnText:   { color: '#F0F6FC', fontSize: 15, fontWeight: '600' },
});
