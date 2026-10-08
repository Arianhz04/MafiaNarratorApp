import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput
} from 'react-native';
import { PRESET_SCENARIOS } from '../data/scenariosData';
import { Scenario } from '../types/types';
import { useGameStore } from '../store/useGameStore';

interface Props {
  onSelectScenario: (scenario: Scenario, playerCount: number, playerNames?: string[]) => void;
}

export const ScenarioSelector: React.FC<Props> = ({ onSelectScenario }) => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(PRESET_SCENARIOS[0]);
  const [playerCount, setPlayerCount] = useState<number>(PRESET_SCENARIOS[0].defaultPlayers);
  
  // دریافت تابع تنظیم اسامی از Zustand store
  const setPlayerNamesStore = useGameStore((state) => state.setPlayerNames);

  // State اسامی بازیکنان
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: playerCount }, (_, i) => `بازیکن ${i + 1}`)
  );

  // همگام‌‌سازی تعداد ورودی‌ها با تغییر تعداد بازیکنان
  useEffect(() => {
    setNames((prev) =>
      Array.from({ length: playerCount }, (_, i) => prev[i] || `بازیکن ${i + 1}`)
    );
  }, [playerCount]);

  const availableCounts = useMemo(() => {
    const counts = new Set<number>([selectedScenario.defaultPlayers]);
    if (selectedScenario.scalingRules) {
      selectedScenario.scalingRules.forEach((rule) => counts.add(rule.playerCount));
    }
    return Array.from(counts).sort((a, b) => a - b);
  }, [selectedScenario]);

  const handleScenarioChange = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setPlayerCount(scenario.defaultPlayers);
  };

  const handleNameChange = (index: number, text: string) => {
    const updated = [...names];
    updated[index] = text;
    setNames(updated);
  };

  const handleSubmit = () => {
    // ذخیره اسامی در استور قبل از ورود به مرحله بعد
    if (setPlayerNamesStore) {
      setPlayerNamesStore(names);
    }
    // ارسال اسامی سفارشی وارد شده به صفحه اصلی برنامه
    onSelectScenario(selectedScenario, playerCount, names);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>انتخاب سناریو</Text>

      {/* Scenario List */}
      <View style={styles.listContainer}>
        {PRESET_SCENARIOS.map((sc) => {
          const isSelected = sc.id === selectedScenario.id;
          return (
            <TouchableOpacity
              key={sc.id}
              activeOpacity={0.8}
              onPress={() => handleScenarioChange(sc)}
              style={[styles.scenarioCard, isSelected && styles.selectedCard]}
            >
              <Text style={styles.scenarioTitle}>{sc.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Allowed Player Count Option Buttons */}
      <View style={styles.playerCountBox}>
        <Text style={styles.label}>تعداد بازیکنان مجاز:</Text>
        <View style={styles.buttonRow}>
          {availableCounts.map((count) => (
            <TouchableOpacity
              key={count}
              onPress={() => setPlayerCount(count)}
              style={[styles.countButton, playerCount === count && styles.selectedCountButton]}
            >
              <Text style={[styles.countText, playerCount === count && styles.selectedCountText]}>
                {count} نفر
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Player Names Input List */}
      <View style={styles.namesBox}>
        <Text style={styles.label}>نام بازیکنان (اختیاری):</Text>
        {names.map((name, index) => (
          <View key={index} style={styles.nameRow}>
            <Text style={styles.nameLabel}>بازیکن {index + 1}:</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(text) => handleNameChange(index, text)}
              placeholder={`بازیکن ${index + 1}`}
              placeholderTextColor="#888"
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleSubmit}
        style={styles.submitButton}
      >
        <Text style={styles.submitButtonText}>تایید و ادامه</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 24,
  },
  listContainer: {
    width: '100%',
    marginBottom: 24,
  },
  scenarioCard: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedCard: {
    backgroundColor: '#18181b',
    borderColor: '#dc2626',
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 6,
    textAlign: 'right',
  },
  playerCountBox: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  namesBox: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e4e4e7',
    marginBottom: 16,
    textAlign: 'right',
    width: '100%',
  },
  nameLabel: {
    fontSize: 14,
    color: '#a1a1aa',
    width: 70,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  countButton: {
    backgroundColor: '#27272a',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  selectedCountButton: {
    backgroundColor: '#dc2626',
  },
  countText: {
    color: '#d4d4d8',
    fontWeight: 'bold',
  },
  selectedCountText: {
    color: '#ffffff',
  },
  nameRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    width: '100%',
  },
  input: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    textAlign: 'right',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444',
  },
  submitButton: {
    backgroundColor: '#b91c1c',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});