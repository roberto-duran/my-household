// Helper script to find the SQLite database location
// Run this in your app to get the exact path for TablePlus

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export const getDatabasePath = () => {
  if (Platform.OS === 'web') {
    console.log('🌐 Web version uses IndexedDB (not a file)');
    console.log('💡 Use browser DevTools → Application → Storage → IndexedDB → HouseholdDB');
    return null;
  }

  const dbPath = `${FileSystem.documentDirectory}SQLite/household.db`;
  
  console.log('📱 Platform:', Platform.OS);
  console.log('📂 Database file location:', dbPath);
  console.log('💾 Document directory:', FileSystem.documentDirectory);
  
  if (Platform.OS === 'ios') {
    console.log('🍎 iOS: Database is in app sandbox. Access via:');
    console.log('   1. Xcode → Window → Devices and Simulators');
    console.log('   2. Select your device/simulator');
    console.log('   3. Find your app → Download Container');
    console.log('   4. Navigate to AppData/Documents/SQLite/household.db');
  }
  
  if (Platform.OS === 'android') {
    console.log('🤖 Android: Database location varies by device:');
    console.log('   • Emulator: ~/.android/avd/[emulator-name]/userdata-qemu.img');
    console.log('   • Device (rooted): /data/data/host.exp.exponent/databases/');
    console.log('   • Use adb: adb shell run-as your.package.name');
  }
  
  return dbPath;
};

// Call this function in your app to see the path
console.log('🔍 Finding database location...');
getDatabasePath(); 