import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { GlassCard } from '../../components/GlassCard';
import { Ionicons } from '@expo/vector-icons';

export default function DietScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>NUTRITION & MACROS</Text>
        <Text style={styles.title}>Fuel Log</Text>

        <GlassCard style={styles.card} borderColor="#10B981">
          <View style={styles.row}>
            <Ionicons name="sunny-outline" size={20} color="#10B981" />
            <Text style={styles.cardTitle}>Breakfast (Logged via Voice)</Text>
          </View>
          <Text style={styles.desc}>3 eggs scrambled, 2 slices sourdough toast, half avocado, black coffee.</Text>
          <View style={styles.macroPillRow}>
            <View style={styles.macroPill}><Text style={styles.macroPillText}>540 kcal</Text></View>
            <View style={styles.macroPill}><Text style={styles.macroPillText}>32g P</Text></View>
            <View style={styles.macroPill}><Text style={styles.macroPillText}>45g C</Text></View>
            <View style={styles.macroPill}><Text style={styles.macroPillText}>22g F</Text></View>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0E' },
  content: { padding: 20, paddingBottom: 110 },
  subtitle: { fontSize: 11, fontWeight: '700', color: '#10B981', letterSpacing: 1.5 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginTop: 4, marginBottom: 20 },
  card: { padding: 18, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  desc: { fontSize: 13, color: '#94A3B8', lineHeight: 18, marginBottom: 12 },
  macroPillRow: { flexDirection: 'row', gap: 8 },
  macroPill: { backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  macroPillText: { color: '#F1F5F9', fontSize: 11, fontWeight: '700' },
});
