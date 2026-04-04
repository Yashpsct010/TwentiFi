import React, { useMemo } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { LogEntry } from '@/services/database';

interface HistoricalInsightsCardProps {
  logs: LogEntry[];
}

export default function HistoricalInsightsCard({ logs }: HistoricalInsightsCardProps) {
  const t = useTheme();
  const [width, setWidth] = React.useState(0);
  const height = 100;

  // Compute 30-day and 60-day stats
  const metrics = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentLogs = logs.filter(l => new Date(l.timestamp) >= thirtyDaysAgo);
    const prevLogs = logs.filter(l => {
      const d = new Date(l.timestamp);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    });

    const recentAvg = recentLogs.length > 0 
      ? recentLogs.reduce((acc, l) => acc + l.productivity, 0) / recentLogs.length 
      : 0;
    const prevAvg = prevLogs.length > 0 
      ? prevLogs.reduce((acc, l) => acc + l.productivity, 0) / prevLogs.length 
      : 0;

    const currentScore = Math.round(recentAvg * 20);
    const prevScore = Math.round(prevAvg * 20);

    let trend = 0;
    if (prevScore > 0) {
      trend = Math.round(((currentScore - prevScore) / prevScore) * 100);
    } else if (currentScore > 0) {
      trend = 100;
    }

    // Weekly distribution for insights
    const days = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    const dayCounts = Array(7).fill(0);
    recentLogs.forEach(l => {
      dayCounts[new Date(l.timestamp).getDay()]++;
    });
    
    let bestDayIdx = 0;
    for (let i = 1; i < 7; i++) {
        if (dayCounts[i] > dayCounts[bestDayIdx]) bestDayIdx = i;
    }
    
    const trendingWord = trend >= 0 ? "upwards" : "downwards";
    const insightText = recentLogs.length > 0 
      ? 'Your focus sessions have been most frequent on ' + days[bestDayIdx] + ' over the last month. Overall baseline productivity is trending ' + trendingWord + '.'
      : 'Log some sessions to generate your historical productivity insights!';

    // Generate 30 daily data points for the graph
    const chartData = Array(30).fill(0);
    const counts = Array(30).fill(0);
    recentLogs.forEach(l => {
      const d = new Date(l.timestamp);
      const diffTime = Math.abs(today.getTime() - d.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 30) {
        chartData[29 - diffDays] += l.productivity * 20;
        counts[29 - diffDays]++;
      }
    });

    // Smooth missing days via carry-over or zero
    for (let i = 0; i < 30; i++) {
      if (counts[i] > 0) {
        chartData[i] /= counts[i];
      } else if (i > 0) {
        chartData[i] = chartData[i-1]; // Flatline carry over
      }
    }

    return { currentScore, trend, insightText, chartData };
  }, [logs]);

  const { currentScore, trend, insightText, chartData } = metrics;
  const trendColor = trend >= 0 ? t.colors.green : t.colors.error;

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  // Build wavy SVG path (Monotone X cubic bezier)
  const pathData = useMemo(() => {
    if (width === 0 || chartData.length === 0) return "";
    
    const minVal = Math.min(...chartData, 0);
    const maxVal = Math.max(...chartData, 100);
    const range = Math.max(maxVal - minVal, 10);
    
    const pts = chartData.map((val, i) => {
      const x = (i / (chartData.length - 1)) * width;
      // Pad graph top/bottom by 10%
      const normalizedY = (val - minVal) / range;
      const y = height - (normalizedY * (height * 0.8) + (height * 0.1)); 
      return { x, y };
    });

    let d = 'M ' + pts[0].x + ',' + pts[0].y;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ' C ' + cx + ',' + p0.y + ' ' + cx + ',' + p1.y + ' ' + p1.x + ',' + p1.y;
    }
    return d;
  }, [chartData, width, height]);

  // Last point for the dot indicator
  const lastX = width > 0 ? width : 0;
  const range = Math.max(Math.max(...chartData, 100) - Math.min(...chartData, 0), 10);
  const normalizedLastY = chartData.length > 0 ? (chartData[chartData.length - 1] - Math.min(...chartData, 0)) / range : 0;
  const lastY = width > 0 ? height - (normalizedLastY * (height * 0.8) + (height * 0.1)) : 0;

  return (
    <View 
      className={`${t.cardBg} border ${t.border} rounded-[4px] p-6 mb-6`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text 
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.5 }}
          className={`${t.textSubtle} uppercase`}
        >
          Historical Insights
        </Text>
        <Ionicons name="time-outline" size={16} color={t.colors.subtext} />
      </View>

      {/* Metrics Row */}
      <View className="flex-row justify-between items-end mb-4">
        <View>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 1.5, marginBottom: 4 }} className={`${t.textSubtle} uppercase`}>
            30-Day Avg
          </Text>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, letterSpacing: -1, lineHeight: 38 }} className={t.textPrimary}>
            {currentScore}
          </Text>
        </View>

        <View className="items-end">
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: trendColor }}>
            {trend > 0 ? '+' : ''}{trend}%
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 0.5, marginTop: 2 }} className={`${t.textSubtle} uppercase`}>
            VS Prev Month
          </Text>
        </View>
      </View>

      {/* Wavy Graph */}
      <View className="w-full relative mt-4 mb-4" style={{ height }} onLayout={handleLayout}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Path 
              d={pathData}
              fill="none"
              stroke={t.colors.green}
              strokeWidth="2.5"
            />
            {/* End point indicator */}
            <Path 
               d={'M ' + (lastX - 4) + ' ' + lastY + ' L ' + lastX + ' ' + (lastY - 4) + ' L ' + lastX + ' ' + (lastY + 4) + ' Z'}
               fill={t.colors.green}
            />
          </Svg>
        )}
      </View>

      {/* Insight Text */}
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }} className={t.textSubtle}>
        {insightText}
      </Text>
    </View>
  );
}
