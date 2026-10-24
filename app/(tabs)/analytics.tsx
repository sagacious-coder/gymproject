import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { GlassCard } from '../../components/GlassCard';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>DYNAMIC REPORTING ENGINE</Text>
        <Text style={styles.title}>Performance Analytics</Text>

        {/* Dynamic Sport Toggle / Overview */}
        <GlassCard style={styles.card} borderColor="#6366F1">
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardBadge}>CARDIO ENGINE</Text>
              <Text style={styles.cardTitle}>Aerobic Pace & Lactate Threshold</Text>
            </View>
            <Ionicons name="trending-up" size={24} color="#6366F1" />
          </View>
          <Text style={styles.cardText}>
            Average 5K Pace dropped from 5:12/km to 4:54/km over the last 30 days (-18s/km improvement).
          </Text>
        </GlassCard>

        {/* Strength Progress */}
        <GlassCard style={styles.card} borderColor="#10B981">
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.cardBadge, { color: '#10B981' }]}>STRENGTH ENGINE</Text>
              <Text style={styles.cardTitle}>1RM Progression & Muscle Split</Text>
            </View>
            <Ionicons name="barbell-outline" size={24} color="#10B981" />
          </View>
          <Text style={styles.cardText}>
            Calculated Flat Bench 1RM: 126 kg (+4.5% this month). Chest & posterior chain volume is well balanced.
          </Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0E' },
  content: { padding: 20, paddingBottom: 110 },
  subtitle: { fontSize: 11, fontWeight: '700', color: '#6366F1', letterSpacing: 1.5 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginTop: 4, marginBottom: 20 },
  card: { padding: 18, marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBadge: { fontSize: 10, fontWeight: '800', color: '#6366F1', letterSpacing: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  cardText: { fontSize: 13, color: '#94A3B8', marginTop: 10, lineHeight: 18 },
});
