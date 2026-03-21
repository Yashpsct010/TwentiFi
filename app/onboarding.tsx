import { useSettingsStore } from '@/store/settingsStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to TwentiFi',
    description: 'Log your life in 20-minute pulses. Build the ultimate habit of awareness and action.',
    icon: 'pulse' as const,
  },
  {
    id: '2',
    title: 'Voice Logging & AI Insights',
    description: 'Just speak. We use AI to transcribe your entries and give you deep insights into your vibe.',
    icon: 'mic' as const,
  },
  {
    id: '3',
    title: 'Maintain Your Streak',
    description: 'Keep your momentum going. Visualize your consistency with our new streak calendar.',
    icon: 'flame' as const,
  },
  {
    id: '4',
    title: 'Powered by Gemini',
    description: 'Paste your free API key to unlock the AI.',
    icon: 'sparkles' as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const {
    geminiApiKey,
    setGeminiApiKey,
    setHasCompletedOnboarding,
  } = useSettingsStore();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = () => {
    setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  };

  const openAiStudio = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  const renderItem = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
    const content = (
      <>
        <View className={`w-32 h-32 rounded-full bg-brand-purple/20 items-center justify-center border border-brand-purple/50 ${index === 3 ? 'mb-4 mt-8' : 'mb-8'}`}>
          <Ionicons name={item.icon} size={64} color="#8B5CF6" />
        </View>
        <Text className={`text-3xl font-black text-white text-center tracking-wide ${index === 3 ? 'mb-2' : 'mb-4'}`}>
          {item.title}
        </Text>
        <Text className={`text-brand-subtext text-center text-lg leading-relaxed ${index === 3 ? 'mb-6' : 'mb-12'}`}>
          {item.description}
        </Text>

        {index === 3 && (
          <View className="w-full">
            <View className="flex-row items-center justify-center mb-6 py-2 px-4 rounded-full bg-brand-purple/20 self-center border border-brand-purple/30">
              <Text className="text-brand-purple font-black text-[10px] uppercase tracking-widest mr-2">
                Scroll Down for Setup
              </Text>
              <Ionicons name="chevron-down" size={14} color="#8B5CF6" />
            </View>

            <Image 
              source={require('@/assets/images/aistudio-guide.gif')} 
              className="w-full h-[320px] mb-8"
              resizeMode="contain"
            />
            <View className="bg-brand-card p-4 rounded-2xl border border-white/5 flex-row items-center mb-4">
              <Ionicons name="key-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 text-white ml-3 text-base"
                placeholder="Paste Gemini API Key here"
                placeholderTextColor="#4B5563"
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity onPress={openAiStudio} className="mb-8">
              <Text className="text-brand-purple text-center font-bold underline">
                Get a free API key from Google AI Studio
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );

    if (index === 3) {
      return (
        <ScrollView 
          style={{ width }} 
          className="flex-1 px-8" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingTop: 20, paddingBottom: 40 }}
        >
          {content}
        </ScrollView>
      );
    }

    return (
      <View style={{ width }} className="flex-1 items-center justify-center px-8">
        {content}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View className="px-8 pb-12 pt-4">
        <View className="flex-row justify-center mb-8 gap-2">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === index ? 'w-8 bg-brand-purple' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </View>

        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={finishOnboarding}
            className="px-6 py-4"
          >
            <Text className="text-brand-subtext font-bold uppercase tracking-widest text-sm">
              Skip
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            className="bg-brand-purple px-10 py-4 rounded-full shadow-lg shadow-brand-purple/50 flex-row items-center"
          >
            <Text className="text-white font-black uppercase tracking-widest mr-2">
              {currentIndex === SLIDES.length - 1 ? "Let's Go" : 'Next'}
            </Text>
            <Ionicons
              name={currentIndex === SLIDES.length - 1 ? 'rocket' : 'arrow-forward'}
              size={18}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
