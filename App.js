import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import WebViewSegura from './WebViewSegura';
import { paginas } from './paginas';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName={paginas[0].titulo}
          screenOptions={{ headerShown: false, tabBarActiveTintColor: '#176b3a' }}
        >
          {paginas.map((pagina) => (
            <Tab.Screen
              key={pagina.titulo}
              name={pagina.titulo}
              options={{
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name={pagina.icone} size={size} color={color} />
                ),
              }}
            >
              {() => <WebViewSegura pagina={pagina} />}
            </Tab.Screen>
          ))}
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
