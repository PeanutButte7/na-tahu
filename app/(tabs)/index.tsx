import { getAllPacks } from '@/lib/game';
import { useAppStore } from '@/store/useAppStore';
import { useGameStore } from '@/store/useGameStore';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const ownedPackIds = useAppStore((state) => state.ownedPackIds);
  const session = useGameStore((state) => state.session);
  const allPacks = getAllPacks();
  const myPacks = allPacks.filter((p) => ownedPackIds.includes(p.id));

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-6" edges={['top', 'left', 'right']}>
      <Text className="text-4xl font-bold text-gray-900 mb-8 mt-4">Quiz MVP</Text>
      
      {session?.isActive && (
        <View className="mb-8">
          <Text className="text-xl text-gray-500 mb-4 font-semibold">Active Session</Text>
          <TouchableOpacity 
            className="bg-emerald-600 p-4 rounded-xl mb-3 active:bg-emerald-700 shadow-sm"
            onPress={() => router.push('/game')}
          >
             <Text className="text-white text-center text-lg font-bold">Resume Game</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Primary CTA */}
      <TouchableOpacity 
        className="bg-emerald-600 p-5 rounded-2xl mb-12 shadow-md active:bg-emerald-700"
        onPress={() => router.push('/game-setup')}
      >
         <Text className="text-white text-center text-xl font-bold">Start New Game</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-gray-900 mb-4">Your Packs</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {myPacks.length === 0 ? (
           <Text className="text-gray-500 italic">No packs owned.</Text>
        ) : (
          myPacks.map(pack => (
            <View key={pack.id} className="bg-white p-4 rounded-xl mb-4 border border-gray-200 shadow-sm">
              <Text className="text-xl text-gray-900 font-bold mb-1">{pack.name}</Text>
              <Text className="text-gray-500">{pack.description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
