import { getQuestionsForPacks, shuffleArray } from '@/lib/game';
import { useGameStore } from '@/store/useGameStore';
import { usePackStore } from '@/store/usePackStore';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GameOverScreen() {
    const router = useRouter();
    const session = useGameStore(state => state.session);
    const lastSetup = useGameStore(state => state.lastSetup);
    const startSession = useGameStore(state => state.startSession);
    const remotePacks = usePackStore((state) => state.packs);

    if (!session) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <Text className="text-gray-900">No game data.</Text>
                <TouchableOpacity onPress={() => router.replace('/')}>
                    <Text className="text-emerald-600 mt-4">Go Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];

    const handlePlayAgain = () => {
        if (!lastSetup) return router.replace('/game-setup');

        const questions = getQuestionsForPacks(lastSetup.selectedPackIds, remotePacks ?? undefined);
        const questionIds = questions.map(q => q.id);
        const shuffledQ = shuffleArray(questionIds);

        const newPlayers = Array.from({ length: lastSetup.playerCount }, (_, i) => ({
            id: i,
            name: `Player ${i + 1}`,
            score: 0
        }));

        startSession({
            players: newPlayers,
            targetScore: lastSetup.targetScore,
            currentPlayerIndex: 0,
            selectedPackIds: lastSetup.selectedPackIds,
            questionQueue: shuffledQ,
            currentQuestionIndex: 0,
            isActive: true,
        });

        router.replace('/game');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-6">
            <Text className="text-gray-500 text-xl font-bold mb-2">WINNER</Text>
            <Text className="text-5xl text-emerald-600 font-bold mb-8 text-center">{winner.name}</Text>
            
            <View className="w-full bg-white rounded-2xl p-6 mb-10 border border-gray-200 shadow-sm">
                <Text className="text-gray-900 text-lg font-bold mb-4 border-b border-gray-200 pb-2">Final Scores</Text>
                {sortedPlayers.map((p, idx) => (
                    <View key={p.id} className="flex-row justify-between mb-3">
                        <Text className="text-gray-600 text-lg">{idx + 1}. {p.name}</Text>
                        <Text className="text-gray-900 text-lg font-bold">{p.score}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity 
                className="w-full bg-emerald-600 py-4 rounded-xl items-center mb-4 shadow-lg active:bg-emerald-700"
                onPress={handlePlayAgain}
            >
                <Text className="text-white text-xl font-bold">Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                className="w-full bg-gray-200 py-4 rounded-xl items-center mb-4 active:bg-gray-300"
                onPress={() => router.replace('/game-setup')}
            >
                <Text className="text-gray-900 text-xl font-bold">New Game</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => router.replace('/')}
            >
                <Text className="text-gray-500 text-lg font-bold p-2">Back to Home</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
