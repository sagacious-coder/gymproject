import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSession } from '../types/database.types';

interface StrengthCardProps {
  session: WorkoutSession & { sortDate?: string };
}

export const StrengthCard: React.FC<StrengthCardProps> = ({ session }) => {
  const isHybrid = session.type === 'hybrid';
  const durationText = session.duration_min ? `${session.duration_min} min` : null;
  const formattedDate = session.sortDate
    ? new Date(session.sortDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.typeBadge}>
          <Ionicons name="barbell" size={14} color="#A855F7" />
          <Text style={styles.typeBadgeText}>
            {isHybrid ? 'HYBRID WORKOUT' : 'STRENGTH WORKOUT'}
          </Text>
        </View>
        {formattedDate && <Text style={styles.dateText}>{formattedDate}</Text>}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {session.title || (isHybrid ? 'Hybrid Workout' : 'Strength Session')}
      </Text>

      {/* Metrics Row (Duration & Exertion) */}
      <View style={styles.metaRow}>
        {durationText && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text style={styles.metaText}>{durationText}</Text>
          </View>
        )}
        {session.perceived_exertion_rpe ? (
          <View style={styles.metaItem}>
            <Ionicons name="flame-outline" size={14} color="#F97316" />
            <Text style={styles.metaText}>RPE {session.perceived_exertion_rpe}</Text>
          </View>
        ) : null}
        {session.activities && session.activities.length > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="layers-outline" size={14} color="#94A3B8" />
            <Text style={styles.metaText}>
              {session.activities.length} {session.activities.length === 1 ? 'exercise' : 'exercises'}
            </Text>
          </View>
        )}
      </View>

      {/* AI Summary */}
      {session.ai_summary ? (
        <View style={styles.aiSummaryContainer}>
          <View style={styles.aiBadgeRow}>
            <Ionicons name="sparkles" size={12} color="#00F0FF" />
            <Text style={styles.aiBadgeText}>AI SUMMARY</Text>
          </View>
          <Text style={styles.aiSummaryText}>{session.ai_summary}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  aiSummaryContainer: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderLeftWidth: 2,
    borderLeftColor: '#00F0FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 2,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  aiBadgeText: {
    color: '#00F0FF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiSummaryText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
});
