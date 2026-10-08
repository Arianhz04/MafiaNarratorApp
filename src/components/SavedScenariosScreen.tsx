import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Scenario } from '../types/types';

const STORAGE_KEY = '@mafia_custom_scenarios';

interface SavedScenariosScreenProps {
  onBack: () => void;
  onSelectScenario: (scenario: Scenario) => void;
}

export const SavedScenariosScreen: React.FC<SavedScenariosScreenProps> = ({
  onBack,
  onSelectScenario,
}) => {
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);

  const loadScenarios = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setSavedScenarios(JSON.parse(data));
      }
    } catch (e) {
      Alert.alert('خطا', 'خطا در بارگذاری سناریوهای ذخیره‌شده.');
    }
  };

  useEffect(() => {
    loadScenarios();
  }, []);

  const handleDeleteScenario = (id: string) => {
    Alert.alert(
      'حذف سناریو',
      'آیا از حذف این سناریو اطمینان دارید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            const updated = savedScenarios.filter((s) => s.id !== id);
            setSavedScenarios(updated);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>بازگشت ✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سناریوهای ذخیره‌شده شما</Text>
      </View>

      {savedScenarios.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>هیچ سناریوی ذخیره‌شده‌ای یافت نشد.</Text>
          <Text style={styles.emptySubtext}>
            می‌توانید از بخش «ساخت بازی سفارشی»، سناریوی دلخواه خود را بسازید و ذخیره کنید.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedScenarios}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  onPress={() => handleDeleteScenario(item.id)}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>

              <Text style={styles.cardDesc}>
                تعداد بازیکنان: {item.defaultPlayers} نفر
              </Text>

              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => onSelectScenario(item)}
              >
                <Text style={styles.selectBtnText}>انتخاب و شروع بازی 🎮</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#27272a',
    marginTop: 20,
  },
  backButton: {
    backgroundColor: '#18181b',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  backText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
  },
  cardDesc: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'right',
    marginBottom: 16,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 16,
  },
  selectBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#71717a',
    fontSize: 13,
    textAlign: 'center',
  },
});