import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import LovifyScreen from './Onboarding/LovifyScreen';
import HomeScreen from './Home/HomeScreen';
import DrawerContent from './Home/DrawerContent';
import SettingsScreen from './Home/SettingsScreen';
import AboutUs from './Home/AboutUs';
import ContactUs from './Home/ContactUs';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// ✅ Drawer Navigator Wrapper
const DrawerNavigator = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.4)',
        drawerContentStyle: { backgroundColor: '#101031' },
      }}
      drawerContent={props => <DrawerContent {...props} onLogout={onLogout} />}
    >
      <Drawer.Screen name="HomeScreen" component={HomeScreen} />
      <Drawer.Screen name="SettingsScreen" component={SettingsScreen} />
      <Drawer.Screen name="AboutUs" component={AboutUs} />
      <Drawer.Screen name="ContactUs" component={ContactUs} />
    </Drawer.Navigator>
  );
};

// ✅ Main App Navigator
const AppNavigator = ({
  isLoggedIn,
  onLogin,
  onLogout,
}: {
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <Stack.Screen name="Home">
            {props => <DrawerNavigator {...props} onLogout={onLogout} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="Onboarding">
            {props => <LovifyScreen {...props} onLogin={onLogin} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
