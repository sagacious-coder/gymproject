import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Meal } from '../types/database.types';

interface MealCardProps {
  meal: Meal & { sortDate?: string };
}

export const MealCard: React.FC<MealCardProps> = ({ meal }) => {
  const protein = Math.max(0, Number(meal.protein) || 0);
  const carbs = Math.max(0, Number(meal.carbs) || 0);
  const fats = Math.max(0, Number(meal.fats) || 0);
  const totalMacros = protein + carbs + fats;

  const formattedDate = meal.sortDate
    ? new Date(meal.sortDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const mealTypeFormatted = (meal.meal_type || 'meal')
    .replace('_', ' ')
    .toUpperCase();

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
          <Ionicons name="nutrition" size={13} color="#10B981" />
          <Text style={styles.typeBadgeText}>{mealTypeFormatted}</Text>
        </View>
        {formattedDate && <Text style={styles.dateText}>{formattedDate}</Text>}
      </View>

      {/* Description & Calories Row */}
      <View style={styles.contentRow}>
        <Text style={styles.description} numberOfLines={2}>
          {meal.description || 'Logged Meal'}
        </Text>
        <View style={styles.caloriesBadge}>
          <Text style={styles.caloriesValue}>{Math.round(meal.calories || 0)}</Text>
          <Text style={styles.caloriesUnit}>kcal</Text>
        </View>
      </View>

      {/* Sleek Horizontal Macro Bar using Flexbox */}
      <View style={styles.macroBarContainer}>
        {totalMacros > 0 ? (
          <>
            {protein > 0 && (
              <View
                style={[
                  styles.macroBarSegment,
                  { flex: protein, backgroundColor: '#10B981' },
                ]}
              />
            )}
            {carbs > 0 && (
              <View
                style={[
                  styles.macroBarSegment,
                  { flex: carbs, backgroundColor: '#38BDF8' },
                ]}
              />
            )}
            {fats > 0 && (
              <View
                style={[
                  styles.macroBarSegment,
                  { flex: fats, backgroundColor: '#F59E0B' },
                ]}
              />
            )}
          </>
        ) : (
          <View
            style={[
              styles.macroBarSegment,
              { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
            ]}
          />
        )}
      </View>

      {/* Macro Legend with Gram Values */}
      <View style={styles.macroLegendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendLabel}>Protein</Text>
          <Text style={styles.legendValue}>{Math.round(protein)}g</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#38BDF8' }]} />
          <Text style={styles.legendLabel}>Carbs</Text>
          <Text style={styles.legendValue}>{Math.round(carbs)}g</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendLabel}>Fats</Text>
          <Text style={styles.legendValue}>{Math.round(fats)}g</Text>
        </View>
      </View>
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
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  description: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  caloriesBadge: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  caloriesValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  caloriesUnit: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  macroBarContainer: {
    flexDirection: 'row',
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
    gap: 2,
  },
  macroBarSegment: {
    height: '100%',
    borderRadius: 3,
  },
  macroLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  legendValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
