import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLogStore } from '@/store/logStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Audio } from 'expo-av';

export default function TimelineScreen() {
  const { logs } = useLogStore();
  const router = useRouter();
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);

  async function playSound(uri: string) {
    try {
      console.log('Loading Sound');
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSound(sound);

      console.log('Playing Sound');
      await sound.playAsync();
    } catch (err) {
      console.error('Failed to play sound', err);
    }
  }

  React.useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View className="flex-1 bg-brand-bg pt-12 px-6">
      <View className="mb-8">
        <Text className="text-brand-subtext text-xs uppercase tracking-[3px] font-bold mb-1">Today, {format(new Date(), 'MMM d')}</Text>
        <Text className="text-3xl font-bold text-white">Timeline</Text>
      </View>

      <View className="flex-1">
        <View className="absolute left-4 top-0 bottom-0 w-1 bg-brand-purple/20 rounded-full" />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {logs.length > 0 ? logs.map((log) => (
            <View key={log.id} className="flex-row mb-8 pl-10">
              <View className="absolute left-2.5 top-0 w-4 h-4 rounded-full bg-brand-purple border-4 border-brand-bg z-10" />
              
              <View className="flex-1 bg-brand-card p-5 rounded-[24px] border border-white/5">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-brand-subtext text-xs font-bold">{format(new Date(log.timestamp), 'h:mm a')}</Text>
                  <View className={`px-2 py-1 rounded-md ${
                    log.productivity > 3 ? 'bg-brand-purple/20' : 
                    log.productivity > 1 ? 'bg-amber-500/20' : 'bg-red-500/20'
                  }`}>
                    <Text className={`text-[10px] font-black uppercase ${
                      log.productivity > 3 ? 'text-brand-purple' : 
                      log.productivity > 1 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {log.productivity > 3 ? 'Deep Work' : log.productivity > 1 ? 'Communication' : 'Distraction'}
                    </Text>
                  </View>
                </View>
                  <Text className="text-white text-lg font-medium mb-3">{log.activity}</Text>
                  
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="pulse" size={14} color="#8B5CF6" />
                      <Text className="text-brand-subtext text-xs ml-2 uppercase font-bold tracking-widest">{log.mood}</Text>
                    </View>
                    
                    {log.audioUri && (
                      <TouchableOpacity 
                        onPress={() => playSound(log.audioUri!)}
                        className="bg-brand-purple/20 px-3 py-1.5 rounded-full flex-row items-center"
                      >
                        <Ionicons name="play-circle" size={16} color="#8B5CF6" />
                        <Text className="text-brand-purple text-[10px] font-black uppercase ml-1.5">Play Note</Text>
                      </TouchableOpacity>
                    )}
                  </View>
              </View>
            </View>
          )) : (
            <View className="items-center justify-center pt-20">
              <Ionicons name="calendar-outline" size={64} color="#1C1B33" />
              <Text className="text-brand-subtext mt-4 text-center">No pulses recorded yet today. Start focusing to see your timeline!</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <TouchableOpacity 
        onPress={() => router.push('/logging' as any)}
        className="absolute bottom-6 right-6 bg-brand-purple w-16 h-16 rounded-full items-center justify-center shadow-2xl shadow-brand-purple/50"
      >
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}
