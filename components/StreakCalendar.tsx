import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LogEntry } from '@/services/database';

interface StreakCalendarProps {
  logs: LogEntry[];
}

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export default function StreakCalendar({ logs }: StreakCalendarProps) {
  // Group logs by date
  const countsByDate = logs.reduce((acc: Record<string, number>, log) => {
    const d = new Date(log.timestamp);
    const dateStr = formatDate(d);
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {});

  // Generate last 4 months (18 weeks * 7 = 126 days)
  const WEEKS = 18;
  const DAYS = WEEKS * 7;
  
  const today = new Date();
  
  // Create a 2D array of weeks containing days
  const grid: { date: string; count: number }[][] = Array.from({ length: WEEKS }, () => []);

  // We want to fill the grid so that the the last cell is 'today'
  // But standard commit graphs have weeks as columns and days as rows.
  // Day 0 is Sunday, ..., Day 6 is Saturday.
  
  // We'll calculate the start date by going back DAYS from today's end of the week.
  // Actually, to make it simple, we generate the last 182 days in order.
  const daysArray = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    daysArray.push({
      date: formatDate(d),
      count: countsByDate[formatDate(d)] || 0,
    });
  }

  // Group into weeks (columns)
  // Let's just chunk them into size of 7 for simplicity
  for (let i = 0; i < WEEKS; i++) {
    grid[i] = daysArray.slice(i * 7, (i + 1) * 7);
  }

  const getColor = (count: number) => {
    if (count === 0) return 'bg-white/5 border-white/10';
    if (count <= 2) return 'bg-brand-purple/30 border-brand-purple/30';
    if (count <= 5) return 'bg-brand-purple/60 border-brand-purple/50';
    return 'bg-brand-purple border-brand-purple';
  };

  return (
    <View className="bg-brand-card p-6 rounded-[32px] border border-white/5">
      <Text className="text-white font-bold mb-4 tracking-widest uppercase text-xs text-center">
        Consistency (Last 4 Months)
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="w-full"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-row self-center">
          {grid.map((week, weekIndex) => (
            <View key={weekIndex} className="flex-col mr-1">
              {week.map((day, dayIndex) => (
                <View
                  key={day.date}
                  className={`w-4 h-4 rounded-sm border mb-1 ${getColor(day.count)}`}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row items-center justify-end mt-4">
        <Text className="text-brand-subtext text-[10px] uppercase font-bold mr-2">Less</Text>
        <View className="w-3 h-3 rounded-sm border bg-white/5 border-white/10 mr-1" />
        <View className="w-3 h-3 rounded-sm border bg-brand-purple/30 border-brand-purple/30 mr-1" />
        <View className="w-3 h-3 rounded-sm border bg-brand-purple/60 border-brand-purple/50 mr-1" />
        <View className="w-3 h-3 rounded-sm border bg-brand-purple border-brand-purple mr-2" />
        <Text className="text-brand-subtext text-[10px] uppercase font-bold">More</Text>
      </View>
    </View>
  );
}
