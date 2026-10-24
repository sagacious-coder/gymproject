import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutSession, CardioMetricPayload } from '../types/database.types';

interface CardioCardProps {
  session: WorkoutSession & { sortDate?: string };
}

export const CardioCard: React.FC<CardioCardProps> = ({ session }) => {
  // Parse JSONB payload from the first available activity metric
  let metricPayload: CardioMetricPayload | null = null;
  if (session.activities && session.activities.length > 0) {
    for (const act of session.activities) {
      if (act.metrics && act.metrics.length > 0) {
        const payload = act.metrics[0].payload as CardioMetricPayload;
        if (payload) {
          metricPayload = payload;
          break;
        }
      }
    }
  }

  const distanceKm = metricPayload?.distance_km ?? 0;
  const timeSeconds =
    metricPayload?.time_seconds ??
    (session.duration_min ? session.duration_min * 60 : 0);

  // Calculate Pace (min/km)
  let paceFormatted = '--:-- /km';
  if (metricPayload?.pace_min_km && metricPayload.pace_min_km > 0) {
    const mins = Math.floor(metricPayload.pace_min_km);
    const secs = Math.round((metricPayload.pace_min_km - mins) * 60);
    paceFormatted = `${mins}'${secs.toString().padStart(2, '0')}" /km`;
  } else if (distanceKm > 0 && timeSeconds > 0) {
    const paceDecimal = timeSeconds / 60 / distanceKm;
    const mins = Math.floor(paceDecimal);
    const secs = Math.round((paceDecimal - mins) * 60);
    paceFormatted = `${mins}'${secs.toString().padStart(2, '0')}" /km`;
  }

  // Format Time duration
  const formatDuration = (totalSeconds: number) => {
    if (!totalSeconds) return session.duration_min ? `${session.duration_min}m` : '--:--';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      {/* Distinct Cyan/Blue Glassmorphic Gradient Accent */}
      <LinearGradient
        colors={['rgba(0, 240, 255, 0.12)', 'rgba(56, 189, 248, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.typeBadge}>
          <Ionicons name="footsteps" size={13} color="#00F0FF" />
          <Text style={styles.typeBadgeText}>CARDIO WORKOUT</Text>
        </View>
        {formattedDate && <Text style={styles.dateText}>{formattedDate}</Text>}
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {session.title || 'Cardio Session'}
      </Text>

      {/* Hero Stats Row (Distance & Pace Highlighted) */}
      <View style={styles.statsContainer}>
        {/* Distance Stat */}
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>DISTANCE</Text>
          <View style={styles.statValueRow}>
            <Text style={styles.statPrimaryValue}>
              {distanceKm > 0 ? distanceKm.toFixed(2) : '--'}
            </Text>
            <Text style={styles.statUnit}>km</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        {/* Pace Stat */}
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>AVG PACE</Text>
          <View style={styles.statValueRow}>
            <Ionicons name="speedometer-outline" size={14} color="#00F0FF" style={styles.statIcon} />
            <Text style={styles.statPrimaryValue}>{paceFormatted}</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        {/* Duration / Time Stat */}
        <View style={styles.statColumn}>
          <Text style={styles.statLabel}>TIME</Text>
          <View style={styles.statValueRow}>
            <Ionicons name="timer-outline" size={14} color="#38BDF8" style={styles.statIcon} />
            <Text style={styles.statSecondaryValue}>{formatDuration(timeSeconds)}</Text>
          </View>
        </View>
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
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#00F0FF',
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
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  statPrimaryValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  statSecondaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statUnit: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  statIcon: {
    marginRight: 2,
    alignSelf: 'center',
  },
  aiSummaryContainer: {
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
    borderLeftWidth: 2,
    borderLeftColor: '#00F0FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
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
