import React, { useEffect } from 'react';
import { View, Text, ImageBackground, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { useQuoteStore } from '@/store/quoteStore';
import { useSettingsStore } from '@/store/settingsStore';
import { generateDailyQuote } from '@/services/gemini';

export default function WisdomPulse() {
  const t = useTheme();
  const { quote, author, keyword, hasQuoteForToday, setQuote } = useQuoteStore();
  const geminiApiKey = useSettingsStore(s => s.geminiApiKey);

  useEffect(() => {
    // If we don't have a quote for today, fetch one
    if (!hasQuoteForToday() && geminiApiKey) {
      generateDailyQuote(geminiApiKey).then((data) => {
        setQuote(data.quote, data.author, data.keyword);
      }).catch((e) => {
        console.log("Wisdom pulse quote error:", e);
      });
    }
  }, [geminiApiKey, hasQuoteForToday, setQuote]);

  // Construct a reliable abstract image URL based on keyword using Picsum
  // Adding blur for a premium, moody aesthetic that ensures text legibility
  const encodedKeyword = encodeURIComponent(keyword || "focus");
  const imageUrl = `https://picsum.photos/seed/${encodedKeyword}/800/600?blur=4`;

  return (
    <View className="mt-8 mb-4">
      <Text
        style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
        className={`${t.textSubtle} uppercase mb-3`}
      >
        Wisdom Pulse
      </Text>
      
      <View className="rounded-[4px] overflow-hidden">
        <ImageBackground
          source={{ uri: imageUrl }}
          style={{ width: '100%', minHeight: 220, justifyContent: 'flex-end' }}
        >
          {/* Translucent dark overlay for text legibility */}
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)' }} />
          
          <View className="p-6">
            <Text
              style={{ 
                fontFamily: "Inter_400Regular", 
                fontSize: 16, 
                lineHeight: 26,
                fontStyle: 'italic',
                color: '#FAFAF8' // Always bright white for contrast on darkened image
              }}
              className="mb-4"
            >
              &quot;{quote}&quot;
            </Text>
            
            <View className="flex-row items-center border-l-2 border-[#6B8E6F] pl-3">
               <Text
                 style={{ 
                   fontFamily: "Inter_600SemiBold", 
                   fontSize: 11, 
                   letterSpacing: 2,
                   color: '#D0B6AE' // Subtle warm text
                 }}
                 className="uppercase"
               >
                 {author}
               </Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    </View>
  );
}
