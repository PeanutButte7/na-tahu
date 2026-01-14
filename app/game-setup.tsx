import { getAllPacks, getQuestionsForPacks, shuffleArray } from '@/lib/game';
import { useAppStore } from '@/store/useAppStore';
import { useGameStore } from '@/store/useGameStore';
import { usePackStore } from '@/store/usePackStore';
import { FontAwesome } from '@expo/vector-icons';
import clsx from 'clsx';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function GameSetupScreen() {
  const router = useRouter();
  const lastSetup = useGameStore((state) => state.lastSetup);
  const startSession = useGameStore((state) => state.startSession);
  const ownedPackIds = useAppStore((state) => state.ownedPackIds);
  const unlockedAll = useAppStore((state) => state.unlockedAll);

  const remotePacks = usePackStore((state) => state.packs);
  const allPacks = remotePacks ?? getAllPacks();
  const availablePacks = allPacks.filter(p => unlockedAll || ownedPackIds.includes(p.id));

  const [playerCount, setPlayerCount] = useState(2);
  const [targetScore, setTargetScore] = useState(10);
  const [selectedPacks, setSelectedPacks] = useState<string[]>([]);

  useEffect(() => {
    if (lastSetup) {
      setPlayerCount(lastSetup.playerCount);
      setTargetScore(lastSetup.targetScore);
      const validPacks = lastSetup.selectedPackIds.filter(id => 
         unlockedAll || ownedPackIds.includes(id)
      );
      // If we have valid packs from last setup, use them, otherwise default to empty or all owned if none?
      if (validPacks.length > 0) {
          setSelectedPacks(validPacks);
      } else if (ownedPackIds.length > 0) {
          // Auto select first owned pack if nothing selected? No, let user select.
      }
    }
  }, [lastSetup, ownedPackIds, unlockedAll]);

  const togglePack = (id: string) => {
    if (selectedPacks.includes(id)) {
      setSelectedPacks(selectedPacks.filter(p => p !== id));
    } else {
      setSelectedPacks([...selectedPacks, id]);
    }
  };

  const handleStart = () => {
    if (selectedPacks.length === 0) {
      Alert.alert("Error", "Please select at least one pack.");
      return;
    }

    const questions = getQuestionsForPacks(selectedPacks, allPacks);
    if (questions.length === 0) {
         Alert.alert("Error", "Selected packs have no questions.");
         return;
    }

    const questionIds = questions.map(q => q.id);
    const shuffledQ = shuffleArray(questionIds);
    
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: i,
      name: `Player ${i + 1}`,
      score: 0
    }));

    startSession({
      players,
      targetScore,
      currentPlayerIndex: 0,
      selectedPackIds: selectedPacks,
      questionQueue: shuffledQ,
      currentQuestionIndex: 0,
      isActive: true, // This is key
    });
    
    router.replace('/game');
  };

  return (
    <View className="flex-1 bg-gray-50 pt-10">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        
        <View className="mb-8">
            <Text className="text-gray-900 text-lg font-bold mb-3">Number of Players</Text>
            <View className="flex-row bg-white rounded-xl items-center justify-between p-2 border border-gray-200">
                <TouchableOpacity 
                    className={clsx("p-4 rounded-lg", playerCount <= 1 ? "bg-gray-200 opacity-50" : "bg-gray-200")}
                    disabled={playerCount <= 1}
                    onPress={() => setPlayerCount(c => c - 1)}
                >
                    <FontAwesome name="minus" size={20} color="#111827" />
                </TouchableOpacity>
                <Text className="text-3xl font-bold text-gray-900">{playerCount}</Text>
                <TouchableOpacity 
                    className={clsx("p-4 rounded-lg", playerCount >= 5 ? "bg-gray-200 opacity-50" : "bg-gray-200")}
                    disabled={playerCount >= 5}
                    onPress={() => setPlayerCount(c => c + 1)}
                >
                   <FontAwesome name="plus" size={20} color="#111827" />
                </TouchableOpacity>
            </View>
        </View>

        <View className="mb-8">
            <Text className="text-gray-900 text-lg font-bold mb-3">Target Score</Text>
            <View className="flex-row justify-between">
                {[10, 15, 20].map(score => (
                    <TouchableOpacity
                        key={score}
                        onPress={() => setTargetScore(score)}
                        className={clsx(
                            "flex-1 p-4 rounded-xl mx-1 items-center border",
                            targetScore === score 
                                ? "bg-emerald-600 border-emerald-500" 
                                : "bg-white border-gray-200"
                        )}
                    >
                        <Text className={clsx("text-xl font-bold", targetScore === score ? "text-white" : "text-gray-500")}>
                            {score}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View className="mb-8">
            <Text className="text-gray-900 text-lg font-bold mb-3">Select Packs</Text>
            {availablePacks.length === 0 ? (
                <Text className="text-gray-500">No packs owned.</Text>
            ) : (
                availablePacks.map(pack => {
                    const selected = selectedPacks.includes(pack.id);
                    return (
                        <TouchableOpacity
                            key={pack.id}
                            onPress={() => togglePack(pack.id)}
                            className={clsx(
                                "p-4 rounded-xl mb-3 border flex-row items-center justify-between",
                                selected ? "bg-emerald-50 border-emerald-500" : "bg-white border-gray-200"
                            )}
                        >
                            <View className="flex-1">
                                <Text className={clsx("text-lg font-bold", selected ? "text-emerald-900" : "text-gray-700")}>
                                    {pack.name}
                                </Text>
                                <Text className={clsx("text-sm", selected ? "text-emerald-700" : "text-gray-500")}>{pack.description}</Text>
                            </View>
                            {selected && <FontAwesome name="check-circle" size={24} color="#10B981" />}
                        </TouchableOpacity>
                    );
                })
            )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200">
         <TouchableOpacity
            className={clsx(
                "w-full py-4 rounded-xl items-center",
                selectedPacks.length > 0 ? "bg-emerald-600" : "bg-gray-200"
            )}
            disabled={selectedPacks.length === 0}
            onPress={handleStart}
         >
             <Text className={clsx("text-xl font-bold", selectedPacks.length > 0 ? "text-white" : "text-gray-500")}>
                 Start Game
             </Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}
