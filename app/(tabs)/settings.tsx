import { useAppStore } from '@/store/useAppStore';
import { useGameStore } from '@/store/useGameStore';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const resetPacks = useAppStore((state) => state.resetPacks);
  const resetGameData = useGameStore((state) => state.resetGameData);

  const handleReset = () => {
    Alert.alert(
        "Reset App Data",
        "Are you sure you want to delete all data? This cannot be undone.",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Reset", 
                style: "destructive", 
                onPress: () => {
                    resetPacks();
                    resetGameData();
                    Alert.alert("Success", "App data has been reset.");
                }
            }
        ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-6" edges={['top', 'left', 'right']}>
      <Text className="text-3xl font-bold text-gray-900 mb-8">Settings</Text>
      
      <View className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
         <Text className="text-gray-900 text-lg font-bold mb-2">Data Management</Text>
         <TouchableOpacity 
            className="bg-red-600 p-4 rounded-lg active:bg-red-700"
            onPress={handleReset}
         >
            <Text className="text-white text-center font-bold">Reset App Data</Text>
         </TouchableOpacity>
         <Text className="text-gray-500 text-sm mt-3">
             Clears all game sessions and restores default packs.
         </Text>
      </View>
    </SafeAreaView>
  );
}
