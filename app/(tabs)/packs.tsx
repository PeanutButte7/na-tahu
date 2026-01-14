import { getAllPacks } from '@/lib/game';
import { useAppStore } from '@/store/useAppStore';
import { ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PacksScreen() {
  const { ownedPackIds, unlockedAll, setUnlockedAll } = useAppStore();
  const allPacks = getAllPacks();
  
  const isOwned = (id: string) =>  unlockedAll || ownedPackIds.includes(id);

  const owned = allPacks.filter(p => isOwned(p.id));
  const available = allPacks.filter(p => !isOwned(p.id));

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-6" edges={['top', 'left', 'right']}>
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-gray-900">Store</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-xl font-bold text-gray-700 mb-3">Owned Packs</Text>
        {owned.map(pack => (
          <View key={pack.id} className="bg-white p-4 rounded-xl mb-4 border border-gray-200 shadow-sm">
             <View className="flex-row justify-between">
                <Text className="text-lg text-gray-900 font-bold">{pack.name}</Text>
                <Text className="text-emerald-600 font-bold">Owned</Text>
             </View>
             <Text className="text-gray-500 mt-1">{pack.description}</Text>
          </View>
        ))}

        <Text className="text-xl font-bold text-gray-700 mb-3 mt-4">Available Packs</Text>
        {available.length === 0 ? (
          <Text className="text-gray-500 italic">No new packs available.</Text>
        ) : (
          available.map(pack => (
            <View key={pack.id} className="bg-white p-4 rounded-xl mb-4 border border-gray-200 shadow-sm opacity-60">
               <View className="flex-row justify-between">
                  <Text className="text-lg text-gray-900 font-bold">{pack.name}</Text>
                  <Text className="text-gray-500 font-bold">{pack.priceDisplay}</Text>
               </View>
               <Text className="text-gray-500 mt-1">{pack.description}</Text>
               <TouchableOpacity disabled className="mt-3 bg-gray-200 p-2 rounded-lg">
                  <Text className="text-gray-500 text-center">Coming Soon</Text>
               </TouchableOpacity>
            </View>
          ))
        )}

        {/* Dev Toggle */}
        <View className="mt-10 border-t border-gray-200 pt-6 flex-row justify-between items-center">
             <Text className="text-gray-500">Dev: Unlock All</Text>
             <Switch value={unlockedAll} onValueChange={setUnlockedAll} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
