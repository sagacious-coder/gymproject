import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';
import { useHomeFeed, TimelineItem } from '../../hooks/useHomeFeed';
import { StrengthCard } from '../../components/StrengthCard';
import { CardioCard } from '../../components/CardioCard';
import { MealCard } from '../../components/MealCard';
import { GlassCard } from '../../components/GlassCard';

export default function HomeScreen() {
  const { data, isLoading, refetch } = useHomeFeed();

  const renderItem = ({ item, index }: { item: TimelineItem; index: number }) => {
    let content: React.ReactNode = null;

    // Check if the item is a Meal
    if ('meal_type' in item && item.meal_type) {
      content = <MealCard meal={item} />;
    } else if ('type' in item) {
      if (item.type === 'cardio') {
        content = <CardioCard session={item} />;
      } else if (item.type === 'strength' || item.type === 'hybrid') {
        content = <StrengthCard session={item} />;
      } else {
        // Fallback for mobility, yoga, recovery, or other session types
        content = <StrengthCard session={item} />;
      }
    }

    if (!content) return null;

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100).springify()}
        layout={Layout.springify()}
      >
        {content}
      </Animated.View>
    );
  };

  const keyExtractor = (item: TimelineItem) => {
    if ('meal_type' in item) {
      return `meal-${item.id}`;
    }
    return `session-${item.id}`;
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Greeting & Streak */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greetingSub}>GOOD MORNING, ATHLETE</Text>
          <Text style={styles.greetingTitle}>Daily Readiness</Text>
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

      {/* Timeline Section Title */}
      <View style={styles.timelineSectionHeader}>
        <View>
          <Text style={styles.sectionSubtitle}>CHRONOLOGICAL STREAM</Text>
          <Text style={styles.sectionTitle}>Activity Timeline</Text>
        </View>
        {data.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{data.length} logs</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color="#00F0FF" />
          <Text style={styles.emptyLoadingText}>Loading timeline activity...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="calendar-outline" size={28} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>No activity logged yet</Text>
        <Text style={styles.emptyText}>
          Workouts, cardio sessions, and meals will appear here chronologically as you log them.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.contentList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#00F0FF"
            colors={['#00F0FF']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  contentList: {
    padding: 20,
    paddingBottom: 120,
  },
  headerContainer: {
    marginBottom: 8,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  greetingSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00F0FF',
    letterSpacing: 1.5,
  },
  greetingTitle: {
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
    marginBottom: 24,
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
  timelineSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 10,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyLoadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
