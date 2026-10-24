import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>GOOD MORNING, ATHLETE</Text>
            <Text style={styles.title}>Daily Readiness</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#FF7A00" />
            <Text style={styles.streakText}>14 Days</Text>
          </View>
        </View>

        {/* Hero Card: Today's AI Suggested Session */}
        <GlassCard style={styles.heroCard} borderColor="#00F0FF">
          <LinearGradient
            colors={['rgba(0, 240, 255, 0.12)', 'rgba(99, 102, 241, 0.05)']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroBadgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>HYBRID PROGRAM</Text>
            </View>
            <Text style={styles.durationText}>55 MIN</Text>
          </View>
          <Text style={styles.heroTitle}>Lower Body Power & 3km Flush Run</Text>
          <Text style={styles.heroDesc}>
            AI adapted today's load: Squats (4x6 @ 80%), followed by low-intensity zone-2 flush.
          </Text>
          <TouchableOpacity style={styles.heroBtn}>
            <Text style={styles.heroBtnText}>Start Guided Session</Text>
            <Ionicons name="arrow-forward" size={16} color="#000000" />
          </TouchableOpacity>
        </GlassCard>

        {/* Nutrition Macro Summary */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Macro Targets</Text>
          <Text style={styles.sectionSub}>1,840 / 2,500 kcal</Text>
        </View>

        <View style={styles.macrosRow}>
          <GlassCard style={styles.macroCard}>
            <Text style={styles.macroValue}>142g</Text>
            <Text style={styles.macroLabel}>Protein / 180g</Text>
            <View style={[styles.progressBar, { width: '78%', backgroundColor: '#00F0FF' }]} />
          </GlassCard>
          <GlassCard style={styles.macroCard}>
            <Text style={styles.macroValue}>190g</Text>
            <Text style={styles.macroLabel}>Carbs / 250g</Text>
            <View style={[styles.progressBar, { width: '76%', backgroundColor: '#10B981' }]} />
          </GlassCard>
          <GlassCard style={styles.macroCard}>
            <Text style={styles.macroValue}>48g</Text>
            <Text style={styles.macroLabel}>Fats / 70g</Text>
            <View style={[styles.progressBar, { width: '68%', backgroundColor: '#F59E0B' }]} />
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  content: {
    padding: 20,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00F0FF',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 122, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    color: '#FF7A00',
    fontWeight: '700',
    fontSize: 12,
  },
  heroCard: {
    padding: 20,
    marginBottom: 28,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: '800',
  },
  durationText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 18,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00F0FF',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  heroBtnText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  macroLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
});
