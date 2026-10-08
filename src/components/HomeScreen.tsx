import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HomeScreenProps {
  onSelectOption: (option: 'custom' | 'saved' | 'presets') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectOption }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.content}>
        <Text style={styles.mainTitle}>دستیار هوشمند مافیا</Text>
        <Text style={styles.subTitle}>مدیریت حرفه‌ای و ساخت سناریوهای دلخواه</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.menuButton, styles.primaryBtn]}
            onPress={() => onSelectOption('custom')}
          >
            <Text style={styles.iconText}>✨</Text>
            <View style={styles.textWrapper}>
              <Text style={styles.buttonTitle}>ساخت بازی سفارشی</Text>
              <Text style={styles.buttonDesc}>
                تعیین تعداد بازیکنان، چیدمان نقش‌ها و افزودن کارت‌های حرکت آخر
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.secondaryBtn]}
            onPress={() => onSelectOption('saved')}
          >
            <Text style={styles.iconText}>💾</Text>
            <View style={styles.textWrapper}>
              <Text style={styles.buttonTitle}>سناریوهای ذخیره‌شده شما</Text>
              <Text style={styles.buttonDesc}>دسترسی به سناریوهای شخصی‌سازی‌شده قبلی</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.tertiaryBtn]}
            onPress={() => onSelectOption('presets')}
          >
            <Text style={styles.iconText}>📜</Text>
            <View style={styles.textWrapper}>
              <Text style={styles.buttonTitle}>سناریوهای آماده سیستم</Text>
              <Text style={styles.buttonDesc}>شب‌های مافیا، پدرخوانده، زودیاک، بازپرس و ...</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 16,
  },
  menuButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  primaryBtn: {
    backgroundColor: '#18181b',
    borderColor: '#dc2626',
  },
  secondaryBtn: {
    backgroundColor: '#18181b',
    borderColor: '#2563eb',
  },
  tertiaryBtn: {
    backgroundColor: '#18181b',
    borderColor: '#059669',
  },
  iconText: {
    fontSize: 28,
    marginLeft: 12,
  },
  textWrapper: {
    flex: 1,
    alignItems: 'flex-end',
  },
  buttonTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  buttonDesc: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'right',
  },
});