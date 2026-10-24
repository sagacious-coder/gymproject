import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { GlassCard } from '../../components/GlassCard';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.subtitle}>ATHLETE SETTINGS</Text>
        <Text style={styles.title}>Profile & Goals</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.label}>Weekly Running Goal: 20 km</Text>
          <Text style={styles.label}>Daily Target: 2,500 kcal / 180g Protein</Text>
          <Text style={styles.label}>AI Model: Gemini 1.5 Flash / Groq Llama 3</Text>
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0E' },
  content: { padding: 20 },
  subtitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.5 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginTop: 4, marginBottom: 20 },
  card: { padding: 18, gap: 10 },
  label: { fontSize: 14, color: '#CBD5E1' },
});
