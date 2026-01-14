import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981', // Emerald-600
        tabBarStyle: {
            position: 'absolute',
            bottom: 24,
            left: 20,
            right: 20,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            paddingBottom: 0,
            overflow: 'hidden',
        },
        tabBarBackground: () => (
            <View
                style={{
                    ...StyleSheet.absoluteFillObject,
                    borderRadius: 32,
                    shadowColor: '#000',
                    shadowOffset: {
                        width: 0,
                        height: 12,
                    },
                    shadowOpacity: 0.15,
                    shadowRadius: 24,
                    elevation: 8,
                }}
            >
                <BlurView
                    intensity={Platform.OS === 'ios' ? 95 : 85}
                    tint="light"
                    experimentalBlurMethod="none"
                    style={{
                        ...StyleSheet.absoluteFillObject,
                        borderRadius: 32,
                        overflow: 'hidden',
                        backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.4)',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                    }}
                />
            </View>
        ),
        headerShown: false,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="packs"
        options={{
          title: 'Store',
          tabBarIcon: ({ color }) => <TabBarIcon name="shopping-bag" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
