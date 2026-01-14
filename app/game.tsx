import { getQuestionsForPacks } from '@/lib/game';
import { useGameStore } from '@/store/useGameStore';
import { Ionicons } from '@expo/vector-icons';
import clsx from 'clsx';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GameScreen() {
    const router = useRouter();
    const session = useGameStore(state => state.session);
    const updateScore = useGameStore(state => state.updateCurrentPlayerScore);
    const nextTurn = useGameStore(state => state.nextTurn);
    const endSession = useGameStore(state => state.endSession);

    // New State for "Instant Evaluation" & "Push Your Luck"
    const [revealedIndices, setRevealedIndices] = useState<number[]>([]); // Indices of correctly found answers
    const [wrongIndex, setWrongIndex] = useState<number | null>(null);    // Index of the wrong answer selected (if any)
    
    // Derived state for Round Status
    const isRoundOver = wrongIndex !== null || revealedIndices.length === 5;
    const isRoundLost = wrongIndex !== null;
    
    // Calculate current round score (Exponential: 1, 2, 4, 8, 16)
    // If round is lost (wrongIndex != null), score is 0.
    const currentRoundScore = isRoundLost 
        ? 0 
        : (revealedIndices.length === 0 ? 0 : Math.pow(2, revealedIndices.length - 1));

    // Handle back navigation
    const handleExit = () => {
        Alert.alert(
            "Exit Game",
            "Are you sure you want to quit the current game?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Quit", 
                    style: 'destructive',
                    onPress: () => {
                        endSession();
                        router.replace('/');
                    }
                }
            ]
        );
        return true;
    };

    // Hardware back button should also trigger exit confirmed
    useEffect(() => {
        const backHandler = BackHandler.addEventListener("hardwareBackPress", handleExit);
        return () => backHandler.remove();
    }, []);

    useEffect(() => {
        if (!session || !session.isActive) {
            router.replace('/');
        }
    }, [session]);

    if (!session || !session.isActive) {
        return <View className="flex-1 bg-gray-50 justify-center items-center"><Text className="text-gray-900">Loading...</Text></View>;
    }

    const player = session.players[session.currentPlayerIndex];
    // Wrap around logic for question queue
    const questionId = session.questionQueue[session.currentQuestionIndex % session.questionQueue.length]; 
    
    // Dynamically get questions for the selected packs
    const questionsData = getQuestionsForPacks(session.selectedPackIds);
    const question = questionsData.find(q => q.id === questionId);

    if (!question) {
        return <View className="flex-1 bg-gray-50 justify-center items-center"><Text className="text-gray-900">Error: Question not found</Text></View>;
    }

    const handleOptionClick = (idx: number) => {
        if (isRoundOver) return; 

        // Use functional update to ensure we have the latest state
        setRevealedIndices(prev => {
            if (prev.includes(idx)) return prev; // Already revealed check with latest state
            if (wrongIndex !== null) return prev; // If already wrong in latest state (though wrongIndex is separate state, this is tricky)
            // Actually wrongIndex is separate. If wrongIndex is set, isRoundOver is true.
            // But we can't access updated wrongIndex in this callback easily if it's changing simultaneously.
            // However, usually one click sets one or the other.
            
            const isCorrect = question.correctIndices.includes(idx);
            
            if (isCorrect) {
                 const newRevealed = [...prev, idx];
                 // Score update is handled by useEffect when length is 5
                 return newRevealed;
            } else {
                 setWrongIndex(idx);
                 // Score update (0) is handled by useEffect if needed or just implicit
                 return prev;
            }
        });
    };

    // State to track if we already awarded points this round preventing double surveillance
    const [scoreAwarded, setScoreAwarded] = useState(false);
    
    // We need a local state to track if we manually banked to lock UI
    const [isBanked, setIsBanked] = useState(false);
    
    // Effective round over check includes banking
    const effectiveRoundOver = isRoundOver || isBanked;

    // Reset state when question changes
    useEffect(() => {
        setRevealedIndices([]);
        setWrongIndex(null);
        setIsBanked(false);
        setScoreAwarded(false);
    }, [questionId]);


    // Monitor for Round Completion (All 5 found) or Banking or Busting
    useEffect(() => {
        if (scoreAwarded) return;

        // Case 1: All 5 found
        if (revealedIndices.length === 5) {
            updateScore(16);
            setScoreAwarded(true);
        }
        
        // Case 2: Banked
        // If isBanked is true, we invoke logic.
        // We use currentRoundScore captured in closure or ref? 
        // currentRoundScore is derived from the SAME render cycle state usually.
        // But inside useEffect, dependencies matter.
        else if (isBanked) {
             const points = wrongIndex !== null ? 0 : (revealedIndices.length === 0 ? 0 : Math.pow(2, revealedIndices.length - 1));
             // Note: currentRoundScore variable in component body might differ if not in dep array, 
             // but here we recalculate safely or depend on revealedIndices.
             updateScore(points);
             setScoreAwarded(true);
        }

        // Case 3: Wrong Answer (Bust)
        // If wrongIndex is set, we effectively "add 0". 
        // We might want to mark scoreAwarded to prevent any late banking?
        else if (wrongIndex !== null) {
            // updateScore(0); // Optional, effectively does nothing but good for consistency or logs
            setScoreAwarded(true);
        }

    }, [revealedIndices, wrongIndex, isBanked, scoreAwarded]);

    // Monitor Score for Immediate Game End
    useEffect(() => {
        if (player.score >= session.targetScore) {
             // Small delay to let the UI update and user see the result?
             // User requested "instantly filled... fix it" -> "when this happens its instantly filled" ?
             // Current request: "end screen needs to be shown instantly"
             // So navigate immediately.
             
             // Check if we are already navigating or ending?
             // endSession sets isActive to false.
             if (session.isActive) {
                 endSession();
                 router.replace('/game-over'); 
             }
        }
    }, [player.score, session.targetScore, session.isActive]);




    const handleBankPoints = () => {
        if (isRoundOver) return;
        if (currentRoundScore === 0) return;

        setIsBanked(true); // Triggers Effect
    };

    const handleNext = () => {
        // Just go to next turn. Win condition is handled by Effect.
        // But if we are here, it means we haven't won yet (or effect is pending).
        // If score >= target, effect takes over.
        // Safe to just call nextTurn() or check?
        // If we call nextTurn() while redirecting, it might be fine, or might cause error?
        // Let's check session.isActive.
        if (session.isActive) {
             nextTurn();
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'bottom']}>
            {/* Header */}
            <View className="px-6 py-4 border-b border-gray-200 flex-row justify-between items-center bg-white z-10">
                 <View className="flex-row items-center space-x-4 gap-4">
                     <TouchableOpacity onPress={handleExit} className="p-2 -ml-2 rounded-full active:bg-gray-100">
                         <Ionicons name="arrow-back" size={24} color="black" />
                     </TouchableOpacity>
                     <View>
                         <Text className="text-gray-500 text-sm font-bold">CURRENT PLAYER</Text>
                         <Text className="text-2xl text-gray-900 font-bold">{player.name}</Text>
                     </View>
                 </View>
                 <View className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                     <Text className="text-gray-500 text-xs font-bold text-center">SCORE</Text>
                     <Text className="text-xl text-gray-900 font-bold text-center">{player.score} / {session.targetScore}</Text>
                 </View>
            </View>
            
            {/* Progress Bar for Current Question Score */}
            <View className="flex-row h-2 w-full bg-gray-200">
                {[1, 2, 4, 8, 16].map((scoreStep, idx) => {
                    // Active if we have reached this level (idx < revealedIndices.length)
                    // If we BUSTED, this bar might show red or empty? 
                    // Let's show current progress. If busted, maybe show empty or red?
                    // User request: "progress bar with points". 
                    const isActive = idx < revealedIndices.length;
                    const isBusted = idx === revealedIndices.length && wrongIndex !== null; // The step we failed at? No, we revert to 0 on fail.
                    
                    // Simple progress:
                    // If 1 correct -> first bar filled.
                    // If wrong -> All progress lost/red?
                    
                    let bgClass = "bg-gray-300";
                    if (wrongIndex !== null) {
                         // On wrong, maybe show 0 progress
                         bgClass = "bg-red-100"; 
                    } else if (isActive) {
                        bgClass = "bg-emerald-500";
                    } else if (isBanked && idx >= revealedIndices.length) {
                         bgClass = "bg-gray-200"; // Remainder is light
                    }
                    
                    return (
                        <View key={scoreStep} className={clsx("flex-1 border-r border-gray-50", bgClass)} />
                    );
                })}
            </View>
            <View className="flex-row justify-between px-2 pt-1 pb-4">
                 {[1, 2, 4, 8, 16].map(s => (
                     <Text key={s} className={clsx("text-xs font-bold w-1/5 text-center", 
                        (wrongIndex === null && revealedIndices.length >= [1,2,4,8,16].indexOf(s)+1) ? "text-emerald-600" : "text-gray-400"
                     )}>{s}</Text>
                 ))}
            </View>

            {/* Question */}
            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                 <Text className="text-2xl text-gray-900 font-bold mb-2 text-center leading-8">{question.text}</Text>
                 <Text className="text-gray-500 text-center mb-6 font-medium">
                    Select 5 correct options
                 </Text>

                 <View className="flex-row flex-wrap justify-between pb-10">
                     {question.options.map((opt, idx) => {
                         // Determine styles based on state
                         const isRevealed = revealedIndices.includes(idx);
                         const isWrong = wrongIndex === idx;
                         
                         // Base style
                         let cardClass = "w-[48%] bg-white p-3 mb-3 rounded-xl border-2 border-gray-200 items-center justify-center min-h-[70px] shadow-sm";
                         let textClass = "text-gray-900 text-center font-bold text-sm";
                         
                         if (isRevealed) {
                             // Correctly found
                             cardClass = "w-[48%] bg-emerald-100 p-3 mb-3 rounded-xl border-2 border-emerald-500 items-center justify-center min-h-[70px] shadow-sm";
                             textClass = "text-emerald-800 text-center font-bold text-sm";
                         } else if (isWrong) {
                             // The specific wrong one mistakenly clicked
                             cardClass = "w-[48%] bg-red-100 p-3 mb-3 rounded-xl border-2 border-red-500 items-center justify-center min-h-[70px] shadow-sm";
                             textClass = "text-red-800 text-center font-bold text-sm";
                         } else if (effectiveRoundOver) {
                            // If round is over (banked or lost or won), do we show correct answers?
                            // Usually in these games yes, we show what was missed.
                            if (question.correctIndices.includes(idx)) {
                                 // Missed correct option
                                 cardClass = "w-[48%] bg-white p-3 mb-3 rounded-xl border-2 border-emerald-500/30 items-center justify-center min-h-[70px] shadow-sm";
                                 textClass = "text-emerald-600 opacity-60 text-center font-bold text-sm";
                            } else {
                                 // Irrelevant option, dim it
                                 cardClass = "w-[48%] bg-gray-100 p-3 mb-3 rounded-xl border-2 border-gray-200 items-center justify-center min-h-[70px] shadow-sm";
                                 textClass = "text-gray-400 text-center font-bold text-sm";
                            }
                         }

                         return (
                             <TouchableOpacity 
                                key={idx} 
                                className={cardClass}
                                onPress={() => handleOptionClick(idx)}
                                disabled={effectiveRoundOver || isRevealed}
                             >
                                 <Text className={textClass}>{opt}</Text>
                             </TouchableOpacity>
                         );
                     })}
                 </View>
            </ScrollView>

            {/* Footer / Controls */}
            <View className="p-6 bg-white border-t border-gray-200 pb-8">
                {/* Status or Controls */}
                {!effectiveRoundOver ? (
                    <View>
                        {revealedIndices.length > 0 ? (
                            <View className="items-center">
                                <Text className="text-emerald-600 font-bold text-xl mb-4">
                                    Current Gain: +{currentRoundScore}
                                </Text>
                                <TouchableOpacity 
                                    className="w-full bg-amber-600 py-4 rounded-xl items-center shadow-lg"
                                    onPress={handleBankPoints}
                                >
                                    <Text className="text-white text-xl font-bold">Bank Points & Pass</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View className="items-center">
                                <Text className="text-gray-500 font-bold text-lg mb-2">Tap an option to start</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <View>
                        <View className="flex-row justify-center items-center mb-4">
                            <Text className="text-gray-600 text-lg mr-2">Round Score:</Text>
                            {isRoundLost ? (
                                <Text className="text-3xl font-bold text-red-500">BUST (0)</Text>
                            ) : (
                                <Text className="text-3xl font-bold text-emerald-600">+{currentRoundScore}</Text>
                            )}
                        </View>
                        <TouchableOpacity 
                            className="w-full bg-emerald-600 py-4 rounded-xl items-center shadow-lg active:bg-emerald-700"
                            onPress={handleNext}
                        >
                            <Text className="text-white text-xl font-bold">
                                {player.score >= session.targetScore ? "Finish Game" : "Next Player"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
