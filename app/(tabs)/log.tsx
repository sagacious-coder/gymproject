import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { GlowingMicButton } from '../../components/GlowingMicButton';
import { GlassCard } from '../../components/GlassCard';
import { processAudioInput, extractJSONFromText, commitWorkoutToSupabase, commitMealToSupabase } from '../../services/aiLoggingService';
import { useAuth } from '../../hooks/useAuth';

export default function LogScreen() {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [activeMode, setActiveMode] = useState<'all' | 'workout' | 'nutrition' | 'document'>('all');
  const [parsedPreview, setParsedPreview] = useState<{
    type: 'workout' | 'nutrition' | 'document' | null;
    title: string;
    summary: string;
    details: Array<{ label: string; value: string }>;
  } | null>(null);

  // Initialize the new expo-audio hook-based recorder with high quality presets
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Toggle voice recording using expo-audio and process through Groq Whisper & Llama 3
  const toggleRecording = async () => {
    if (audioRecorder.isRecording) {
      // 1. Stop recording
      audioRecorder.stop();
      setIsProcessing(true);

      try {
        const audioUri = audioRecorder.uri;
        if (audioUri && user) {
          // 2. Stream audio to Groq Whisper and extract structured schema with Llama 3
          const { transcript, structuredData } = await processAudioInput(user.id, audioUri);

          // 3. Render live preview breakdown card
          if (structuredData.intent === 'LOG_WORKOUT' && structuredData.workout_data) {
            const act = structuredData.workout_data.activities?.[0];
            setParsedPreview({
              type: 'workout',
              title: structuredData.workout_data.session.title || 'Workout Session',
              summary: structuredData.workout_data.session.ai_summary || transcript,
              details: [
                { label: 'Activity', value: act?.name || 'Workout' },
                { label: 'Sets Logged', value: `${act?.metrics?.length || 1} set(s)` },
                { label: 'Transcript', value: `"${transcript}"` },
              ],
            });
            Alert.alert('Success', 'Workout session analyzed and committed to Supabase!');
          } else if (structuredData.intent === 'LOG_NUTRITION' && structuredData.nutrition_data) {
            const meal = structuredData.nutrition_data.meal;
            setParsedPreview({
              type: 'nutrition',
              title: meal.description || 'Meal Logged',
              summary: `${meal.calories} kcal | ${meal.protein}g Protein | ${meal.carbs}g Carbs | ${meal.fats}g Fats`,
              details: [
                { label: 'Meal Type', value: meal.meal_type },
                { label: 'Calories', value: `${meal.calories} kcal` },
                { label: 'Macros', value: `${meal.protein}P / ${meal.carbs}C / ${meal.fats}F` },
              ],
            });
            Alert.alert('Success', 'Meal and nutritional macros saved to Supabase!');
          } else {
            Alert.alert('AI Parsed', `Recognized intent: ${structuredData.intent}`);
          }
        }
      } catch (error: any) {
        Alert.alert('Processing Error', error?.message || 'Failed to process audio. Please try again.');
        console.error('Audio processing error:', error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // 4. Request microphone permissions and start recording
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (permission.granted) {
        audioRecorder.record();
      } else {
        Alert.alert('Permission Denied', 'Please enable microphone access in your system settings.');
      }
    }
  };

  // Alternative manual text submission through the LLM parser
  const handleTextSubmit = async () => {
    if (!textInput.trim() || !user) return;
    setIsProcessing(true);

    try {
      const structuredData = await extractJSONFromText(textInput);
      if (structuredData.intent === 'LOG_WORKOUT' && structuredData.workout_data) {
        await commitWorkoutToSupabase(user.id, structuredData.workout_data, textInput);
        Alert.alert('Success', 'Workout logged from text input!');
      } else if (structuredData.intent === 'LOG_NUTRITION' && structuredData.nutrition_data) {
        await commitMealToSupabase(user.id, structuredData.nutrition_data.meal);
        Alert.alert('Success', 'Meal logged from text input!');
      }
      setTextInput('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to parse text input.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDocumentPick = (type: 'pdf' | 'camera') => {
    Alert.alert(
      type === 'pdf' ? 'Import PDF / Plan' : 'Camera Food Scanner',
      type === 'pdf'
        ? 'Select a trainer routine or bloodwork lab report. The AI will extract biomarker trends and schedule workouts.'
        : 'Snap a picture of your meal or grocery receipt for instant visual macro calculation.'
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Status Header */}
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>VOICE & AI OMNI-LOGGER</Text>
              <Text style={styles.headerTitle}>What did you do today?</Text>
            </View>
            <View style={styles.aiBadge}>
              <View style={[styles.aiBadgeDot, audioRecorder.isRecording && styles.aiBadgeDotActive]} />
              <Text style={styles.aiBadgeText}>
                {audioRecorder.isRecording ? 'LIVE REC' : 'EXPO AUDIO'}
              </Text>
            </View>
          </Animated.View>

          {/* Quick Mode Filters */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.modesRow}>
            {(['all', 'workout', 'nutrition', 'document'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setActiveMode(mode)}
                style={[
                  styles.modeChip,
                  activeMode === mode && styles.modeChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeChipText,
                    activeMode === mode && styles.modeChipTextActive,
                  ]}
                >
                  {mode === 'all'
                    ? '⚡ Universal'
                    : mode === 'workout'
                    ? '🏋️ Workout / Run'
                    : mode === 'nutrition'
                    ? '🥗 Nutrition'
                    : '📄 Document'}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Central Hero Voice Stage with expo-audio */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.voiceSection}>
            <View style={styles.micContainer}>
              {isProcessing ? (
                <View style={styles.processingState}>
                  <ActivityIndicator size="large" color="#00F0FF" />
                  <Text style={styles.processingText}>AI is analyzing your session...</Text>
                  <Text style={styles.processingSub}>Groq Whisper + Llama 3 70B</Text>
                </View>
              ) : (
                <GlowingMicButton
                  isListening={audioRecorder.isRecording}
                  onPress={toggleRecording}
                  size={88}
                />
              )}
            </View>

            <View style={styles.micStatusContainer}>
              <Text style={styles.micStatusTitle}>
                {audioRecorder.isRecording
                  ? 'Listening intently...'
                  : isProcessing
                  ? 'Extracting Metrics...'
                  : 'Tap to Voice-Dump'}
              </Text>
              <Text style={styles.micStatusDescription}>
                {audioRecorder.isRecording
                  ? 'Listening... Tap again when finished speaking.'
                  : 'Tap to log a workout, run splits, meal, or ask a performance question.'}
              </Text>
            </View>
          </Animated.View>

          {/* Multimodal Quick Importers: Camera & PDF Document */}
          <Animated.View entering={FadeInUp.delay(300).duration(600)} style={styles.multimodalRow}>
            <TouchableOpacity
              onPress={() => handleDocumentPick('camera')}
              activeOpacity={0.8}
              style={styles.multimodalBtnWrapper}
            >
              <GlassCard style={styles.multimodalBtn}>
                <LinearGradient
                  colors={['rgba(0, 240, 255, 0.15)', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="camera-outline" size={24} color="#00F0FF" />
                <View style={styles.multimodalTextCol}>
                  <Text style={styles.multimodalTitle}>Scan Meal / Food</Text>
                  <Text style={styles.multimodalSub}>Photo AI macro estimate</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDocumentPick('pdf')}
              activeOpacity={0.8}
              style={styles.multimodalBtnWrapper}
            >
              <GlassCard style={styles.multimodalBtn}>
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.15)', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />
                <Ionicons name="document-text-outline" size={24} color="#A78BFA" />
                <View style={styles.multimodalTextCol}>
                  <Text style={styles.multimodalTitle}>Import PDF / Lab</Text>
                  <Text style={styles.multimodalSub}>Routines & bloodwork</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </Animated.View>

          {/* Sleek Text Input Alternative */}
          <Animated.View entering={FadeInUp.delay(400).duration(600)}>
            <GlassCard style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="create-outline" size={18} color="#94A3B8" />
                <Text style={styles.inputHeaderLabel}>OR TYPE UNSTRUCTURED LOG</Text>
              </View>

              <TextInput
                value={textInput}
                onChangeText={setTextInput}
                placeholder="e.g. 5km run in 24:30 at 158bpm OR 3 eggs and avocado toast"
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                style={styles.textInput}
              />

              <View style={styles.inputFooter}>
                <Text style={styles.inputHint}>AI parses and normalizes units into Supabase</Text>
                <TouchableOpacity
                  onPress={handleTextSubmit}
                  activeOpacity={0.8}
                  style={styles.submitBtn}
                >
                  <LinearGradient
                    colors={['#00F0FF', '#0072FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitBtnGradient}
                  >
                    <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </Animated.View>

          {/* AI Parsed Result Preview */}
          {parsedPreview && (
            <Animated.View
              entering={FadeInUp.duration(500)}
              layout={Layout.springify()}
              style={styles.previewContainer}
            >
              <GlassCard
                borderColor={parsedPreview.type === 'nutrition' ? '#10B981' : '#00F0FF'}
                style={styles.previewCard}
              >
                <View style={styles.previewHeader}>
                  <View style={styles.previewTitleRow}>
                    <Ionicons
                      name={parsedPreview.type === 'nutrition' ? 'restaurant' : 'barbell'}
                      size={20}
                      color={parsedPreview.type === 'nutrition' ? '#10B981' : '#00F0FF'}
                    />
                    <Text style={styles.previewTitle}>{parsedPreview.title}</Text>
                  </View>
                  <View
                    style={[
                      styles.tagBadge,
                      {
                        backgroundColor:
                          parsedPreview.type === 'nutrition'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(0, 240, 255, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagBadgeText,
                        {
                          color:
                            parsedPreview.type === 'nutrition' ? '#10B981' : '#00F0FF',
                        },
                      ]}
                    >
                      SAVED TO SUPABASE
                    </Text>
                  </View>
                </View>

                <Text style={styles.previewSummary}>{parsedPreview.summary}</Text>

                <View style={styles.detailsGrid}>
                  {parsedPreview.details.map((detail, idx) => (
                    <View key={idx} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{detail.label}</Text>
                      <Text style={styles.detailValue}>{detail.value}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#00F0FF',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.25)',
  },
  aiBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00F0FF',
    marginRight: 6,
  },
  aiBadgeDotActive: {
    backgroundColor: '#EF4444',
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00F0FF',
    letterSpacing: 0.5,
  },
  modesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modeChipActive: {
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    borderColor: '#00F0FF',
  },
  modeChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#00F0FF',
    fontWeight: '700',
  },
  voiceSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  micContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingState: {
    alignItems: 'center',
    padding: 20,
  },
  processingText: {
    color: '#00F0FF',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  processingSub: {
    color: '#94A3B8',
    marginTop: 4,
    fontSize: 12,
  },
  micStatusContainer: {
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  micStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  micStatusDescription: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  multimodalRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  multimodalBtnWrapper: {
    flex: 1,
  },
  multimodalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  multimodalTextCol: {
    marginLeft: 10,
    flex: 1,
  },
  multimodalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  multimodalSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  inputContainer: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  inputHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#94A3B8',
  },
  textInput: {
    color: '#F8FAFC',
    fontSize: 14,
    minHeight: 64,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 10,
  },
  inputHint: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  submitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  submitBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    marginTop: 10,
  },
  previewCard: {
    padding: 18,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  previewSummary: {
    fontSize: 13,
    color: '#CBD5E1',
    marginVertical: 10,
    lineHeight: 18,
  },
  detailsGrid: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  bottomSpacer: {
    height: 100,
  },
});
