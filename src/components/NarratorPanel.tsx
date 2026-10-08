import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  BackHandler,
} from 'react-native';
import { Scenario, Role, LastMoveCard } from '../types/types';
import { NarratorTimerBar } from './NarratorTimerBar';

interface GamePlayer {
  id: number;
  name: string;
  role: Role;
  isAlive: boolean;
  warnings: number;
}

interface Props {
  initialPlayers: { name: string; role: Role }[];
  scenario: Scenario | null;
  onResetGame: () => void;
}

export const NarratorPanel: React.FC<Props> = ({ initialPlayers, scenario, onResetGame }) => {
  const [players, setPlayers] = useState<GamePlayer[]>(() =>
    initialPlayers.map((p, index) => ({
      id: index + 1,
      name: p.name,
      role: p.role,
      isAlive: true,
      warnings: 0,
    }))
  );

  // مخزن کارت‌های حرکت آخر منحصر به سناریوی جاری
  const [lastMoveCards, setLastMoveCards] = useState<LastMoveCard[]>(() =>
    scenario?.lastMoveCards ? [...scenario.lastMoveCards] : []
  );
  const [drawnCard, setDrawnCard] = useState<LastMoveCard | null>(null);

  // وضعیت نمایش تایمر شناور
  const [isTimerVisible, setIsTimerVisible] = useState<boolean>(false);

  // مدال‌ها
  const [activeModal, setActiveModal] = useState<'cards' | 'notes' | 'all_roles' | null>(null);
  const [notes, setNotes] = useState<string>('');

  // مدیریت بازگشت دکمه فیزیکی
  useEffect(() => {
    const handleBackPress = () => {
      confirmExit();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);

  const confirmExit = () => {
    Alert.alert(
      'بازگشت به صفحه اصلی؟',
      'آیا مطمئن هستید که می‌خواهید بازی را تمام کرده و به صفحه انتخاب سناریو برگردید؟',
      [
        { text: 'انصراف', style: 'cancel' },
        { text: 'بله، خروج', style: 'destructive', onPress: onResetGame },
      ]
    );
  };

  // ثبت اخطارها
  const handleAddWarning = (id: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updatedWarnings = p.warnings + 1;
          if (updatedWarnings >= 3) {
            Alert.alert(
              'اخطار حد مجاز',
              `بازیکن ${p.name} به ۳ اخطار رسید و باید از بازی اخراج شود!`
            );
          }
          return { ...p, warnings: updatedWarnings };
        }
        return p;
      })
    );
  };

  const handleToggleAlive = (id: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAlive: !p.isAlive } : p))
    );
  };

  // جابه‌جایی ترتیب بازیکنان
  const movePlayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= players.length) return;
    const updated = [...players];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setPlayers(updated);
  };

  // قرعه‌کشی و حذف از مخزن کارت حرکت آخر
  const drawLastMoveCard = () => {
    if (!lastMoveCards || lastMoveCards.length === 0) {
      Alert.alert('پایان کارت‌ها', 'کارت حرکت دیگری باقی نمانده است.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * lastMoveCards.length);
    const selectedCard = lastMoveCards[randomIndex];

    setDrawnCard(selectedCard);
    setLastMoveCards((prevCards) => prevCards.filter((_, idx) => idx !== randomIndex));
  };

  return (
    <View style={styles.container}>
      {/* تایمر شناور چسبان بالای صفحه */}
      <NarratorTimerBar
        isVisible={isTimerVisible}
        onClose={() => setIsTimerVisible(false)}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={confirmExit} style={styles.exitButton}>
          <Text style={styles.exitButtonText}>اتمام بازی ✕</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>پنل مدیریت راوی</Text>
      </View>

      {/* Players List */}
      <ScrollView contentContainerStyle={styles.playerList}>
        {players.map((p, idx) => (
          <View
            key={p.id}
            style={[styles.playerCard, !p.isAlive && styles.deadCard]}
          >
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => handleToggleAlive(p.id)}
                style={[
                  styles.statusBadge,
                  p.isAlive ? styles.aliveBadge : styles.deadBadge,
                ]}
              >
                <Text style={styles.statusText}>
                  {p.isAlive ? 'زنده' : 'حذف شده'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleAddWarning(p.id)}
                style={styles.warningButton}
              >
                <Text style={styles.warningButtonText}>اخطار ({p.warnings})</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.playerInfoRow}>
              <View style={styles.nameGroup}>
                <Text style={styles.playerName}>{p.name}</Text>
              </View>

              <View style={styles.arrowGroup}>
                <TouchableOpacity onPress={() => movePlayer(idx, 'up')}>
                  <Text style={styles.arrowText}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => movePlayer(idx, 'down')}>
                  <Text style={styles.arrowText}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Sticky Control Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={() => setActiveModal('cards')}
          style={styles.bottomBarButton}
        >
          <Text style={styles.bottomBarText}>🃏 حرکت آخر</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveModal('all_roles')}
          style={styles.bottomBarButton}
        >
          <Text style={styles.bottomBarText}>📜 نمایش نقش‌ها</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsTimerVisible((prev) => !prev)}
          style={[styles.bottomBarButton, isTimerVisible && styles.activeTimerBtn]}
        >
          <Text style={styles.bottomBarText}>⏱ تایمر</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveModal('notes')}
          style={styles.bottomBarButton}
        >
          <Text style={styles.bottomBarText}>📝 یادداشت</Text>
        </TouchableOpacity>
      </View>

      {/* --- MODALS --- */}

      {/* All Roles Modal */}
      <Modal visible={activeModal === 'all_roles'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>نقش تمامی بازیکنان</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {players.map((p) => (
                <View key={p.id} style={styles.roleRow}>
                  <Text style={styles.roleRowText}>{p.name}</Text>
                  <Text style={styles.roleRowRole}>{p.role.name}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>بستن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Last Move Cards Modal */}
      <Modal visible={activeModal === 'cards'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>قرعه‌کشی کارت حرکت آخر</Text>

            {!scenario?.lastMoveCards || scenario.lastMoveCards.length === 0 ? (
              <Text style={styles.emptyCardText}>⚠️ برای این سناریو کارت حرکت آخر تعریف نشده است.</Text>
            ) : (
              <>
                {drawnCard ? (
                  <View style={styles.drawnCardBox}>
                    <Text style={styles.cardTitleText}>{drawnCard.title}</Text>
                    <Text style={styles.cardDescText}>{drawnCard.description}</Text>
                  </View>
                ) : (
                  <Text style={styles.emptyCardText}>
                    جهت قرعه‌کشی کارت کلیک کنید.
                  </Text>
                )}

                <TouchableOpacity
                  onPress={drawLastMoveCard}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>
                    {lastMoveCards.length > 0 ? `قرعه‌کشی (باقیمانده: ${lastMoveCards.length})` : 'کارت‌ها تمام شد'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={[styles.modalCloseButton, { marginTop: 8 }]}
            >
              <Text style={styles.modalCloseText}>بستن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notes Modal */}
      <Modal visible={activeModal === 'notes'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>یادداشت‌های راوی</Text>
            <TextInput
              multiline
              numberOfLines={6}
              value={notes}
              onChangeText={setNotes}
              placeholder="اتفاقات بازی و استعلام‌ها را اینجا یادداشت کنید..."
              placeholderTextColor="#71717a"
              style={styles.notesInput}
            />
            <TouchableOpacity
              onPress={() => setActiveModal(null)}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>ذخیره و بستن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  topBar: {
    backgroundColor: '#09090b',
    borderBottomWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  exitButton: {
    backgroundColor: '#450a0a',
    borderColor: '#991b1b',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  exitButtonText: { color: '#f87171', fontSize: 12, fontWeight: 'bold' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#dc2626' },
  playerList: { padding: 16, paddingBottom: 80 },
  playerCard: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadCard: { opacity: 0.5, borderColor: '#450a0a' },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
  aliveBadge: { backgroundColor: 'rgba(6, 78, 59, 0.3)', borderColor: '#047857' },
  deadBadge: { backgroundColor: 'rgba(127, 29, 29, 0.3)', borderColor: '#b91c1c' },
  statusText: { color: '#f87171', fontSize: 12, fontWeight: 'bold' },
  warningButton: {
    backgroundColor: 'rgba(120, 53, 15, 0.3)',
    borderColor: '#b45309',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  warningButtonText: { color: '#f59e0b', fontSize: 12, fontWeight: 'bold' },
  playerInfoRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  nameGroup: { alignItems: 'flex-end' },
  playerName: { color: '#f4f4f5', fontWeight: 'bold', fontSize: 15 },
  arrowGroup: { justifyContent: 'center', alignItems: 'center' },
  arrowText: { color: '#71717a', fontSize: 10, paddingVertical: 2 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#09090b',
    borderTopWidth: 1,
    borderColor: '#27272a',
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  bottomBarButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeTimerBtn: { backgroundColor: '#450a0a', borderColor: '#991b1b', borderWidth: 1 },
  bottomBarText: { color: '#d4d4d8', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#dc2626', marginBottom: 16, textAlign: 'center' },
  roleRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#18181b' },
  roleRowText: { color: '#f4f4f5', fontSize: 14 },
  roleRowRole: { color: '#f87171', fontWeight: 'bold', fontSize: 14 },
  modalCloseButton: { backgroundColor: '#27272a', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  modalCloseText: { color: '#f4f4f5', fontWeight: 'bold' },
  drawnCardBox: { backgroundColor: '#18181b', borderColor: '#991b1b', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitleText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16, marginBottom: 6, textAlign: 'center' },
  cardDescText: { color: '#d4d4d8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  emptyCardText: { color: '#71717a', textAlign: 'center', marginVertical: 20 },
  actionButton: { backgroundColor: '#b91c1c', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionButtonText: { color: '#ffffff', fontWeight: 'bold' },
  notesInput: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 8, padding: 12, color: '#ffffff', textAlignVertical: 'top', marginBottom: 16, height: 120 },
});