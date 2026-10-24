import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../components/GlassCard';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';
import { askAICoach } from '../../services/aiCoachService';
import { generateAndShareReport } from '../../services/reportService';
import { WorkoutSession } from '../../types/database.types';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportReport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const userName = user?.name || 'Athlete';
      const userId = user?.id;

      // 1. Fetch latest 10 sessions from Supabase
      let query = supabase
        .from('sessions')
        .select('*, activities(*, metrics(*))')
        .order('date', { ascending: false })
        .limit(10);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: sessionRows, error: sessionErr } = await query;
      if (sessionErr) {
        console.warn('Error fetching sessions for PDF report:', sessionErr);
      }

      const sessions: WorkoutSession[] = sessionRows || [];

      // 2. Request 3-sentence executive summary from AI Coach
      let aiSummary =
        'Consistent training session progression observed over the recent recording cycle. Key metabolic and hypertrophy targets remain on track.';

      try {
        const coachPrompt =
          "Write a 3-sentence executive summary of the athlete's recent performance to include in a PDF report.";
        aiSummary = await askAICoach(coachPrompt, {
          athleteName: userName,
          sessionCount: sessions.length,
          sessions: sessions.map((s) => ({
            title: s.title,
            type: s.type,
            duration_min: s.duration_min,
            date: s.date,
          })),
        });
      } catch (aiErr) {
        console.warn('AI summary generation fallback:', aiErr);
      }

      // 3. Generate HTML-to-PDF and launch native share sheet
      await generateAndShareReport(userName, sessions, aiSummary);
    } catch (err: any) {
      console.error('Failed to export PDF report:', err);
      Alert.alert(
        'Export Failed',
        err?.message || 'Could not generate coach report. Please check permissions and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>ATHLETE SETTINGS</Text>
          <Text style={styles.title}>Profile & Goals</Text>
        </View>

        {/* Athlete Overview Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={26} color="#00F0FF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Athlete One'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'athlete@omnifit.dev'}</Text>
            </View>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Goal Targets */}
          <View style={styles.goalRow}>
            <Ionicons name="flag-outline" size={16} color="#6366F1" />
            <Text style={styles.goalText}>Weekly Running Goal: 20 km</Text>
          </View>
          <View style={styles.goalRow}>
            <Ionicons name="nutrition-outline" size={16} color="#10B981" />
            <Text style={styles.goalText}>Daily Nutrition: 2,500 kcal / 180g Protein</Text>
          </View>
          <View style={styles.goalRow}>
            <Ionicons name="hardware-chip-outline" size={16} color="#00F0FF" />
            <Text style={styles.goalText}>AI Intelligence: Groq Llama 3 70B & Vision</Text>
          </View>
        </GlassCard>

        {/* Section: Reports & Exports */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionSubtitle}>REPORTS & EXPORTS</Text>
          <Text style={styles.sectionTitle}>Performance Audits</Text>
        </View>

        {/* Prominent Export PDF Button Card */}
        <TouchableOpacity
          style={styles.exportCard}
          activeOpacity={0.8}
          onPress={handleExportReport}
          disabled={isGenerating}
        >
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.18)', 'rgba(0, 240, 255, 0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.exportContentRow}>
            <View style={styles.exportIconCircle}>
              {isGenerating ? (
                <ActivityIndicator size="small" color="#00F0FF" />
              ) : (
                <Ionicons name="document-text" size={24} color="#00F0FF" />
              )}
            </View>
            <View style={styles.exportTextGroup}>
              <Text style={styles.exportTitle}>Export Coach Report (PDF)</Text>
              <Text style={styles.exportDesc}>
                {isGenerating
                  ? 'Compiling workout history and AI synthesis...'
                  : 'Generate a clean PDF report to send via WhatsApp, email, or save to files.'}
              </Text>
            </View>
            <Ionicons
              name={isGenerating ? 'hourglass-outline' : 'share-outline'}
              size={20}
              color="#00F0FF"
            />
          </View>
        </TouchableOpacity>
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
    paddingBottom: 120,
  },
  header: {
    marginBottom: 20,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  profileCard: {
    padding: 18,
    marginBottom: 28,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  proBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  proBadgeText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 14,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  goalText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: 14,
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
  exportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  exportContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  exportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTextGroup: {
    flex: 1,
  },
  exportTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  exportDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
});
