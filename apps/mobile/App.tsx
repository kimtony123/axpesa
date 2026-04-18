import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import BuyScreen from './screens/BuyScreen';
import SellScreen from './screens/SellScreen';
import WalletScreen from './screens/WalletScreen';
import POSScreen from './screens/POSScreen';
import MerchantDashboardScreen from './screens/MerchantDashboardScreen';
import FaucetScreen from './screens/FaucetScreen';
import DashboardScreen from './screens/DashboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Buy: '💰',
    Sell: '💸',
    Wallet: '👛',
    More: '📱',
  };
  return (
    <View style={styles.tabIcon}>
      <Text style={styles.tabEmoji}>{icons[name] || '📱'}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{name}</Text>
    </View>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MoreList" 
        component={MoreScreen} 
        options={{ title: 'More' }}
      />
      <Stack.Screen 
        name="Faucet" 
        component={FaucetScreen} 
        options={{ title: 'Token Faucet' }}
      />
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Vault Dashboard' }}
      />
    </Stack.Navigator>
  );
}

function MoreScreen({ navigation }: any) {
  const menuItems = [
    { name: 'Faucet', icon: '🚰', desc: 'Get free test tokens', screen: 'Faucet' },
    { name: 'Dashboard', icon: '📊', desc: 'View vault balances', screen: 'Dashboard' },
  ];

  return (
    <View style={moreStyles.container}>
      {menuItems.map((item) => (
        <View 
          key={item.name}
          style={moreStyles.menuItem}
          onTouchEnd={() => navigation.navigate(item.screen)}
        >
          <Text style={moreStyles.menuIcon}>{item.icon}</Text>
          <View style={moreStyles.menuContent}>
            <Text style={moreStyles.menuName}>{item.name}</Text>
            <Text style={moreStyles.menuDesc}>{item.desc}</Text>
          </View>
          <Text style={moreStyles.menuArrow}>›</Text>
        </View>
      ))}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarShowLabel: false,
        headerStyle: { backgroundColor: '#10B981' },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Africa-China' }} />
      <Tab.Screen name="Buy" component={BuyScreen} options={{ title: 'Buy Stablecoins' }} />
      <Tab.Screen name="Sell" component={SellScreen} options={{ title: 'Sell Stablecoins' }} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen 
        name="More" 
        component={MoreStack}
        options={{ 
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="More" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator>
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="MerchantDashboard" component={MerchantDashboardScreen} options={{ title: 'Merchant Dashboard' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabEmoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#10B981',
    fontWeight: '600',
  },
});

const moreStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  menuDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: '#ccc',
  },
});
