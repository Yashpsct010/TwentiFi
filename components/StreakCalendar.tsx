import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LogEntry } from '@/services/database';
import { useTheme } from '@/hooks/use-theme';

interface StreakCalendarProps {
  logs: LogEntry[];
}

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export default function StreakCalendar({ logs }: StreakCalendarProps) {
  const t = useTheme();

  // ── All existing logic preserved ─────────────────────────────────────────
  const countsByDate = logs.reduce((acc: Record<string, number>, log) => {
    const d = new Date(log.timestamp);
    const dateStr = formatDate(d);
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {});

  const WEEKS = 17;
  const DAYS = WEEKS * 7;
  const today = new Date();

  const grid: { date: string; count: number }[][] = Array.from({ length: WEEKS }, () => []);

  const daysArray = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    daysArray.push({
      date: formatDate(d),
      count: countsByDate[formatDate(d)] || 0,
    });
  }

  for (let i = 0; i < WEEKS; i++) {
    grid[i] = daysArray.slice(i * 7, (i + 1) * 7);
  }

  // ── Theme-aware cell colors ───────────────────────────────────────────────
  const getCellStyle = (count: number) => {
    if (t.isDark) {
      if (count === 0) return { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.10)' };
      if (count <= 2) return { backgroundColor: 'rgba(107,142,111,0.30)', borderColor: 'rgba(107,142,111,0.30)' };
      if (count <= 5) return { backgroundColor: 'rgba(107,142,111,0.60)', borderColor: 'rgba(107,142,111,0.50)' };
      return { backgroundColor: '#6B8E6F', borderColor: '#6B8E6F' };
    } else {
      if (count === 0) return { backgroundColor: t.colors.border, borderColor: t.colors.border };
      if (count <= 2) return { backgroundColor: '#C6ECC8', borderColor: '#C6ECC8' };
      if (count <= 5) return { backgroundColor: '#88B98C', borderColor: '#88B98C' };
      return { backgroundColor: '#6B8E6F', borderColor: '#6B8E6F' };
    }
  };

  const legendCells = [
    t.isDark ? 'rgba(255,255,255,0.05)' : t.colors.border,
    t.isDark ? 'rgba(107,142,111,0.30)' : '#C6ECC8',
    t.isDark ? 'rgba(107,142,111,0.60)' : '#88B98C',
    '#6B8E6F',
  ];

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-row self-center">
          {grid.map((week, weekIndex) => (
            <View key={weekIndex} className="flex-col mr-1">
              {week.map((day) => (
                <View
                  key={day.date}
                  className="w-4 h-4 rounded-[2px] border mb-1"
                  style={getCellStyle(day.count)}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View className="flex-row items-center justify-end mt-3">
        <Text
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1 }}
          className={`${t.textSubtle} uppercase mr-2`}
        >
          Less
        </Text>
        {legendCells.map((color, i) => (
          <View
            key={i}
            className="w-3 h-3 rounded-[2px] mr-1"
            style={{ backgroundColor: color }}
          />
        ))}
        <Text
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1 }}
          className={`${t.textSubtle} uppercase`}
        >
          More
        </Text>
      </View>
    </View>
  );
}
