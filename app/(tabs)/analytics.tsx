import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useAnalyticsData } from '../../hooks/useAnalyticsData';
import { askAICoach } from '../../services/aiCoachService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 40; // Full screen minus 20px padding on each side

type MetricTab = 'strength' | 'cardio';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState<MetricTab>('strength');
  const { strengthChartData, cardioChartData, isLoading, refetch } = useAnalyticsData();

  // AI Coach Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'Hey athlete! I have analyzed your 30-day strength volume and cardio pace data. Ask me anything about your progress, recovery, or training tweaks.',
    },
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const isStrength = activeTab === 'strength';
  const hasStrengthData = strengthChartData.length > 0;
  const hasCardioData = cardioChartData.length > 0;

  // Chart configuration conforming to prompt specs
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'rgba(255, 255, 255, 0)',
    backgroundGradientTo: 'rgba(255, 255, 255, 0)',
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    decimalPlaces: isStrength ? 0 : 2,
    color: (opacity = 1) =>
      isStrength
        ? `rgba(139, 92, 246, ${opacity})`
        : `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#00F0FF',
    },
    propsForBackgroundLines: {
      stroke: 'rgba(255, 255, 255, 0.08)',
      strokeDasharray: '4 4',
    },
  };

  // Safe data builder for LineChart (handles single point by duplicating so LineChart doesn't divide by 0)
  const getStrengthChartPayload = () => {
    if (strengthChartData.length === 1) {
      return {
        labels: [strengthChartData[0].date, strengthChartData[0].date],
        datasets: [
          {
            data: [strengthChartData[0].totalVolume, strengthChartData[0].totalVolume],
            color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };
    }
    return {
      labels: strengthChartData.map((d) => d.date),
      datasets: [
        {
          data: strengthChartData.map((d) => d.totalVolume),
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  const getCardioChartPayload = () => {
    if (cardioChartData.length === 1) {
      return {
        labels: [cardioChartData[0].date, cardioChartData[0].date],
        datasets: [
          {
            data: [cardioChartData[0].averagePace, cardioChartData[0].averagePace],
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };
    }
    return {
      labels: cardioChartData.map((d) => d.date),
      datasets: [
        {
          data: cardioChartData.map((d) => d.averagePace),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  };

  // Key KPI stats
  const totalStrengthVolume = strengthChartData.reduce((acc, d) => acc + d.totalVolume, 0);
  const peakStrengthVolume = strengthChartData.reduce((max, d) => Math.max(max, d.totalVolume), 0);

  const bestCardioPace = cardioChartData.reduce(
    (best, d) => (best === 0 ? d.averagePace : Math.min(best, d.averagePace)),
    0
  );
  const avgOverallPace =
    cardioChartData.length > 0
      ? cardioChartData.reduce((acc, d) => acc + d.averagePace, 0) / cardioChartData.length
      : 0;

  // Handle sending chat message to Groq AI Coach
  const handleSendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isThinking) return;

    const userMessage: ChatMessage = { role: 'user', text: trimmed };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsThinking(true);

    try {
      const aiReply = await askAICoach(trimmed, {
        strength: strengthChartData,
        cardio: cardioChartData,
      });
      setChatMessages((prev) => [...prev, { role: 'ai', text: aiReply }]);
    } catch (err: any) {
      console.warn('AI Coach Error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text:
            err?.message ||
            'Sorry, I had trouble analyzing your workout data. Please check your Groq API key or try again.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#00F0FF"
              colors={['#00F0FF']}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.subtitle}>DYNAMIC PERFORMANCE ENGINE</Text>
            <Text style={styles.title}>Analytics</Text>
          </View>

          {/* Segmented Pill Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleTab,
                isStrength && styles.activeTabStrength,
              ]}
              onPress={() => setActiveTab('strength')}
              activeOpacity={0.8}
            >
              {isStrength && (
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.4)', 'rgba(0, 240, 255, 0.2)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Ionicons
                name="barbell"
                size={16}
                color={isStrength ? '#00F0FF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.toggleText,
                  isStrength && styles.toggleTextActive,
                ]}
              >
                Strength
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleTab,
                !isStrength && styles.activeTabCardio,
              ]}
              onPress={() => setActiveTab('cardio')}
              activeOpacity={0.8}
            >
              {!isStrength && (
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.4)', 'rgba(0, 240, 255, 0.2)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
              )}
              <Ionicons
                name="footsteps"
                size={16}
                color={!isStrength ? '#00F0FF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.toggleText,
                  !isStrength && styles.toggleTextActive,
                ]}
              >
                Cardio
              </Text>
            </TouchableOpacity>
          </View>

          {/* KPI Summary Cards */}
          {isStrength ? (
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>30-DAY VOLUME</Text>
                <Text style={styles.kpiValue}>
                  {totalStrengthVolume > 0
                    ? `${totalStrengthVolume.toLocaleString()} kg`
                    : '--'}
                </Text>
                <Text style={styles.kpiSub}>Total load lifted</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>PEAK SESSION</Text>
                <Text style={styles.kpiValue}>
                  {peakStrengthVolume > 0
                    ? `${peakStrengthVolume.toLocaleString()} kg`
                    : '--'}
                </Text>
                <Text style={styles.kpiSub}>Max single-day volume</Text>
              </View>
            </View>
          ) : (
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>BEST PACE</Text>
                <Text style={styles.kpiValue}>
                  {bestCardioPace > 0 ? `${bestCardioPace.toFixed(2)}` : '--'}
                </Text>
                <Text style={styles.kpiSub}>min/km</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>AVG PACE (30D)</Text>
                <Text style={styles.kpiValue}>
                  {avgOverallPace > 0 ? `${avgOverallPace.toFixed(2)}` : '--'}
                </Text>
                <Text style={styles.kpiSub}>min/km across sessions</Text>
              </View>
            </View>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#00F0FF" />
              <Text style={styles.loadingText}>Synthesizing 30-day analytics...</Text>
            </View>
          )}

          {/* Chart Container / Empty State */}
          {!isLoading && (
            <>
              {isStrength ? (
                hasStrengthData ? (
                  <View style={styles.chartGlassCard}>
                    <LinearGradient
                      colors={['rgba(139, 92, 246, 0.08)', 'rgba(0, 240, 255, 0.03)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.chartHeader}>
                      <View>
                        <View style={styles.badgeRow}>
                          <Ionicons name="barbell-outline" size={13} color="#D8B4FE" />
                          <Text style={styles.chartBadgeText}>STRENGTH PROGRESSION</Text>
                        </View>
                        <Text style={styles.chartTitle}>Volume Progression (kg)</Text>
                      </View>
                      <Text style={styles.timeRangeText}>Last 30 Days</Text>
                    </View>

                    <LineChart
                      data={getStrengthChartPayload()}
                      width={CHART_WIDTH}
                      height={220}
                      chartConfig={chartConfig}
                      bezier
                      style={styles.chartStyle}
                      yAxisSuffix=" kg"
                      withInnerLines
                      withOuterLines={false}
                      withShadow
                    />
                  </View>
                ) : (
                  <View style={styles.emptyCard}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="bar-chart-outline" size={30} color="#94A3B8" />
                    </View>
                    <Text style={styles.emptyTitle}>Not enough data to generate charts yet.</Text>
                    <Text style={styles.emptySubtitle}>
                      Log your strength workouts with weight and reps to see your volume progression curve.
                    </Text>
                  </View>
                )
              ) : hasCardioData ? (
                <View style={styles.chartGlassCard}>
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.08)', 'rgba(0, 240, 255, 0.03)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.chartHeader}>
                    <View>
                      <View style={styles.badgeRow}>
                        <Ionicons name="footsteps-outline" size={13} color="#34D399" />
                        <Text style={[styles.chartBadgeText, { color: '#34D399' }]}>
                          CARDIO EFFICIENCY
                        </Text>
                      </View>
                      <Text style={styles.chartTitle}>Average Pace (min/km)</Text>
                    </View>
                    <Text style={styles.timeRangeText}>Last 30 Days</Text>
                  </View>

                  <LineChart
                    data={getCardioChartPayload()}
                    width={CHART_WIDTH}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chartStyle}
                    yAxisSuffix=" m"
                    withInnerLines
                    withOuterLines={false}
                    withShadow
                  />
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="speedometer-outline" size={30} color="#94A3B8" />
                  </View>
                  <Text style={styles.emptyTitle}>Not enough data to generate charts yet.</Text>
                  <Text style={styles.emptySubtitle}>
                    Log running or cardio sessions with distance and time to plot your pace trend line.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Section: Ask your AI Coach */}
          <View style={styles.coachSectionHeader}>
            <View style={styles.coachTitleRow}>
              <Ionicons name="sparkles" size={18} color="#00F0FF" />
              <Text style={styles.coachSectionTitle}>Ask your AI Coach</Text>
            </View>
            <Text style={styles.coachSubtitle}>Powered by Llama-3 70B & 30-Day Trends</Text>
          </View>

          {/* Glassmorphic Chat Container */}
          <View style={styles.chatCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Chat Messages */}
            <View style={styles.messagesContainer}>
              {chatMessages.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageRow,
                    msg.role === 'user' ? styles.messageRowUser : styles.messageRowAi,
                  ]}
                >
                  {msg.role === 'ai' && (
                    <View style={styles.aiAvatar}>
                      <Ionicons name="fitness" size={14} color="#00F0FF" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        msg.role === 'user' ? styles.userText : styles.aiText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                </View>
              ))}

              {isThinking && (
                <View style={[styles.messageRow, styles.messageRowAi]}>
                  <View style={styles.aiAvatar}>
                    <Ionicons name="fitness" size={14} color="#00F0FF" />
                  </View>
                  <View style={[styles.bubble, styles.aiBubble, styles.thinkingBubble]}>
                    <ActivityIndicator size="small" color="#00F0FF" />
                    <Text style={styles.thinkingText}>AI Coach is analyzing...</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Text Input Row */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask about your volume, pace, or overload..."
                placeholderTextColor="#64748B"
                returnKeyType="send"
                onSubmitEditing={handleSendChat}
                editable={!isThinking}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!chatInput.trim() || isThinking) && styles.sendBtnDisabled,
                ]}
                onPress={handleSendChat}
                disabled={!chatInput.trim() || isThinking}
                activeOpacity={0.8}
              >
                {isThinking ? (
                  <ActivityIndicator size="small" color="#0A0A0E" />
                ) : (
                  <Ionicons name="send" size={15} color="#0A0A0E" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0E',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 130,
  },
  header: {
    marginBottom: 20,
    marginTop: 4,
  },
  subtitle: {
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
  // Pill Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    overflow: 'hidden',
  },
  activeTabStrength: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  activeTabCardio: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  toggleText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  // KPI Summary
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  kpiSub: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  // Chart Glass Card
  chartGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
    paddingBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 28,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  chartBadgeText: {
    color: '#D8B4FE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chartTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  timeRangeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  chartStyle: {
    marginVertical: 4,
    borderRadius: 16,
    paddingRight: 16,
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  // Empty State
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 28,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  // AI Coach Section
  coachSectionHeader: {
    marginBottom: 12,
  },
  coachTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coachSectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  coachSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  chatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  messagesContainer: {
    gap: 12,
    marginBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#00F0FF',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  userText: {
    color: '#0A0A0E',
    fontWeight: '600',
  },
  aiText: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 8,
  },
  sendBtn: {
    backgroundColor: '#00F0FF',
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(0, 240, 255, 0.3)',
  },
});
