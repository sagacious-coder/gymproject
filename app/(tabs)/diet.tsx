import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInUp,
  Layout,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useDietData } from '../../hooks/useDietData';
import { MealCard } from '../../components/MealCard';
import { Meal } from '../../types/database.types';

export default function DietScreen() {
  const router = useRouter();
  const { goals, consumedMacros, todayMeals, isLoading, refetch } = useDietData();

  // Calorie calculations
  const calorieGoal = goals.daily_calories || 2500;
  const calorieConsumed = Math.round(consumedMacros.calories);
  const calorieRemaining = calorieGoal - calorieConsumed;
  const caloriePercent = Math.min(100, Math.max(0, (calorieConsumed / calorieGoal) * 100));

  // Macro percentages capped at 100% for visual bars
  const proteinGoal = goals.daily_protein_g || 180;
  const proteinConsumed = Math.round(consumedMacros.protein);
  const proteinVisualPercent = Math.min(100, Math.max(0, (proteinConsumed / proteinGoal) * 100));
  const proteinActualPercent = Math.round((proteinConsumed / proteinGoal) * 100);

  const carbsGoal = goals.daily_carbs_g || 250;
  const carbsConsumed = Math.round(consumedMacros.carbs);
  const carbsVisualPercent = Math.min(100, Math.max(0, (carbsConsumed / carbsGoal) * 100));
  const carbsActualPercent = Math.round((carbsConsumed / carbsGoal) * 100);

  const fatsGoal = goals.daily_fats_g || 70;
  const fatsConsumed = Math.round(consumedMacros.fats);
  const fatsVisualPercent = Math.min(100, Math.max(0, (fatsConsumed / fatsGoal) * 100));
  const fatsActualPercent = Math.round((fatsConsumed / fatsGoal) * 100);

  // Reanimated shared values for smooth 800ms bar fills
  const calorieProgress = useSharedValue(0);
  const proteinProgress = useSharedValue(0);
  const carbsProgress = useSharedValue(0);
  const fatsProgress = useSharedValue(0);

  useEffect(() => {
    calorieProgress.value = withTiming(caloriePercent, { duration: 800 });
    proteinProgress.value = withTiming(proteinVisualPercent, { duration: 800 });
    carbsProgress.value = withTiming(carbsVisualPercent, { duration: 800 });
    fatsProgress.value = withTiming(fatsVisualPercent, { duration: 800 });
  }, [caloriePercent, proteinVisualPercent, carbsVisualPercent, fatsVisualPercent]);

  const calorieAnimatedStyle = useAnimatedStyle(() => ({
    width: `${calorieProgress.value}%`,
  }));

  const proteinAnimatedStyle = useAnimatedStyle(() => ({
    width: `${proteinProgress.value}%`,
  }));

  const carbsAnimatedStyle = useAnimatedStyle(() => ({
    width: `${carbsProgress.value}%`,
  }));

  const fatsAnimatedStyle = useAnimatedStyle(() => ({
    width: `${fatsProgress.value}%`,
  }));

  const handleNavigateToLog = () => {
    router.push('/(tabs)/log');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Screen Title */}
      <View style={styles.titleSection}>
        <Text style={styles.subtitle}>NUTRITION & MACROS</Text>
        <Text style={styles.title}>Fuel Dashboard</Text>
      </View>

      {/* Hero Section: Calorie Summary Glassmorphic Card */}
      <View style={styles.heroCard}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.12)', 'rgba(0, 240, 255, 0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Ionicons name="flame" size={14} color="#10B981" />
            <Text style={styles.heroBadgeText}>CALORIE BUDGET</Text>
          </View>
          <Text style={styles.heroStatusText}>
            {calorieRemaining >= 0
              ? `${calorieRemaining.toLocaleString()} kcal left`
              : `${Math.abs(calorieRemaining).toLocaleString()} kcal over`}
          </Text>
        </View>

        {/* Primary Calorie Text Display */}
        <View style={styles.calorieRow}>
          <Text style={styles.calorieConsumedText}>
            {calorieConsumed.toLocaleString()}
          </Text>
          <Text style={styles.calorieDivider}>/</Text>
          <Text style={styles.calorieGoalText}>
            {calorieGoal.toLocaleString()}
          </Text>
          <Text style={styles.calorieUnit}>kcal</Text>
        </View>

        {/* Modern Horizontal Calorie Progress Bar with Animation */}
        <View style={styles.calorieProgressTrack}>
          <Animated.View style={[styles.calorieProgressBar, calorieAnimatedStyle]}>
            <LinearGradient
              colors={['#10B981', '#00F0FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </View>

        {/* Calorie Stats Footer */}
        <View style={styles.calorieFooterRow}>
          <Text style={styles.calorieFooterLabel}>
            {Math.round((calorieConsumed / calorieGoal) * 100)}% of daily target reached
          </Text>
          <Text style={styles.calorieBurnTarget}>
            Target: {calorieGoal} kcal
          </Text>
        </View>
      </View>

      {/* Macro Progress Bars Glassmorphic Card */}
      <View style={styles.macroDashboardCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <View style={styles.macroHeaderRow}>
          <View style={styles.macroHeaderTitleRow}>
            <Ionicons name="pie-chart-outline" size={16} color="#00F0FF" />
            <Text style={styles.macroCardTitle}>Macro Targets</Text>
          </View>
          <Text style={styles.macroSub}>Grams consumed today</Text>
        </View>

        {/* 1. Protein Progress Bar (Green) with Reanimated Animation */}
        <View style={styles.macroBarItem}>
          <View style={styles.macroLabelRow}>
            <View style={styles.macroNameGroup}>
              <View style={[styles.macroIndicatorDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.macroName}>Protein</Text>
            </View>
            <View style={styles.macroValuesGroup}>
              <Text style={styles.macroCurrentValue}>{proteinConsumed}g</Text>
              <Text style={styles.macroGoalValue}>/ {proteinGoal}g</Text>
              <Text style={[styles.macroPercentBadge, { color: '#34D399' }]}>
                {proteinActualPercent}%
              </Text>
            </View>
          </View>
          <View style={styles.macroTrack}>
            <Animated.View
              style={[
                styles.macroFill,
                { backgroundColor: '#10B981' },
                proteinAnimatedStyle,
              ]}
            />
          </View>
        </View>

        {/* 2. Carbs Progress Bar (Blue) with Reanimated Animation */}
        <View style={styles.macroBarItem}>
          <View style={styles.macroLabelRow}>
            <View style={styles.macroNameGroup}>
              <View style={[styles.macroIndicatorDot, { backgroundColor: '#38BDF8' }]} />
              <Text style={styles.macroName}>Carbohydrates</Text>
            </View>
            <View style={styles.macroValuesGroup}>
              <Text style={styles.macroCurrentValue}>{carbsConsumed}g</Text>
              <Text style={styles.macroGoalValue}>/ {carbsGoal}g</Text>
              <Text style={[styles.macroPercentBadge, { color: '#38BDF8' }]}>
                {carbsActualPercent}%
              </Text>
            </View>
          </View>
          <View style={styles.macroTrack}>
            <Animated.View
              style={[
                styles.macroFill,
                { backgroundColor: '#38BDF8' },
                carbsAnimatedStyle,
              ]}
            />
          </View>
        </View>

        {/* 3. Fats Progress Bar (Orange) with Reanimated Animation */}
        <View style={styles.macroBarItem}>
          <View style={styles.macroLabelRow}>
            <View style={styles.macroNameGroup}>
              <View style={[styles.macroIndicatorDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.macroName}>Fats</Text>
            </View>
            <View style={styles.macroValuesGroup}>
              <Text style={styles.macroCurrentValue}>{fatsConsumed}g</Text>
              <Text style={styles.macroGoalValue}>/ {fatsGoal}g</Text>
              <Text style={[styles.macroPercentBadge, { color: '#FB923C' }]}>
                {fatsActualPercent}%
              </Text>
            </View>
          </View>
          <View style={styles.macroTrack}>
            <Animated.View
              style={[
                styles.macroFill,
                { backgroundColor: '#F59E0B' },
                fatsAnimatedStyle,
              ]}
            />
          </View>
        </View>
      </View>

      {/* Section Header for Today's Meals */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionSubtitle}>DAILY LOG</Text>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
        </View>
        {todayMeals.length > 0 && (
          <View style={styles.mealCountBadge}>
            <Text style={styles.mealCountText}>{todayMeals.length} meals</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color="#10B981" />
          <Text style={styles.emptyLoadingText}>Loading fuel log...</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.emptyCard}
        activeOpacity={0.8}
        onPress={handleNavigateToLog}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.04)', 'rgba(255, 255, 255, 0.01)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.emptyIconWrapper}>
          <Ionicons name="restaurant-outline" size={28} color="#10B981" />
        </View>
        <Text style={styles.emptyTitle}>No Meals Logged Today</Text>
        <Text style={styles.emptyDescription}>
          Tap the center "+" button or tap here to scan a meal or use instant voice logging.
        </Text>
        <View style={styles.emptyActionBtn}>
          <Ionicons name="mic" size={15} color="#000000" />
          <Text style={styles.emptyActionBtnText}>Log First Meal</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={todayMeals}
        renderItem={({ item, index }: { item: Meal; index: number }) => (
          <Animated.View
            entering={FadeInUp.delay(index * 100).springify()}
            layout={Layout.springify()}
          >
            <MealCard meal={item} />
          </Animated.View>
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.contentList}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#10B981"
            colors={['#10B981']}
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
  titleSection: {
    marginBottom: 20,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  // Hero Calorie Card
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  heroBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroStatusText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  calorieConsumedText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  calorieDivider: {
    color: '#64748B',
    fontSize: 24,
    fontWeight: '400',
  },
  calorieGoalText: {
    color: '#94A3B8',
    fontSize: 22,
    fontWeight: '700',
  },
  calorieUnit: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '700',
  },
  calorieProgressTrack: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  calorieProgressBar: {
    height: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  calorieFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calorieFooterLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  calorieBurnTarget: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  // Macro Dashboard Card
  macroDashboardCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  macroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  macroHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroCardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  macroSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  macroBarItem: {
    marginBottom: 14,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  macroValuesGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  macroCurrentValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  macroGoalValue: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  macroPercentBadge: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  macroTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Section Header
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
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
  mealCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mealCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  // Empty State Card
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyLoadingText: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 8,
  },
  emptyIconWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDescription: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  emptyActionBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
});
