import React, { useState, useMemo, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Role, Scenario, LastMoveCard, TeamSide } from '../types/types';
import { ALL_ROLES } from '../data/rolesData';
import { LAST_MOVE_CARDS } from '../data/scenariosData';

const STORAGE_KEY = '@mafia_custom_scenarios';
const CUSTOM_ROLES_KEY = '@mafia_custom_roles';

interface SelectedRoleMap {
  [roleId: string]: number;
}

interface CustomGameBuilderProps {
  onBack: () => void;
  onStartGame: (
    scenario: Scenario,
    playerCount: number,
    playerNames: string[],
    customRolesPool?: Role[]
  ) => void;
}

// ----------------------------------------------------------------------
// کامپوننت مموایزشده کارت نقش جهت جلوگیری از رندر مجدد کل لیست با هر کلیک
// ----------------------------------------------------------------------
interface RoleCardItemProps {
  role: Role;
  count: number;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onShowDetail: (role: Role) => void;
}

const RoleCardItem = memo(
  ({ role, count, onIncrement, onDecrement, onShowDetail }: RoleCardItemProps) => {
    const rawSide = String(role.side || '').toLowerCase().trim();
    const isCitizen = rawSide === 'citizen' || rawSide === 'citizens';
    const isMafia = rawSide === 'mafia' || rawSide === 'mafias';

    return (
      <View style={styles.roleCard}>
        <TouchableOpacity
          style={styles.roleMetaTouchable}
          onPress={() => onShowDetail(role)}
        >
          <Text style={styles.roleName}>
            {role.name} {role.isCustom ? '⭐' : 'ℹ️'}
          </Text>
          <Text style={styles.roleTeamSideLabel}>
            {isMafia && '🔴 مافیا'}
            {isCitizen && '🔵 شهروند'}
            {!isMafia && !isCitizen && '🟡 مستقل/مجهول'}
          </Text>
        </TouchableOpacity>

        <View style={styles.counterControls}>
          <TouchableOpacity
            onPress={() => onDecrement(role.id)}
            style={styles.roleCountBtn}
          >
            <Text style={styles.roleCountBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.roleCountText}>{count}</Text>
          <TouchableOpacity
            onPress={() => onIncrement(role.id)}
            style={styles.roleCountBtn}
          >
            <Text style={styles.roleCountBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.count === nextProps.count &&
      prevProps.role.id === nextProps.role.id &&
      prevProps.role.name === nextProps.role.name &&
      prevProps.role.side === nextProps.role.side
    );
  }
);

export const CustomGameBuilder: React.FC<CustomGameBuilderProps> = ({
  onBack,
  onStartGame,
}) => {
  // ۱. تعیین تعداد بازیکنان
  const [playerCount, setPlayerCount] = useState<number>(10);

  // ۲. بانک نقش‌ها (شامل نقش‌های سیستم و نقش‌های ساخته‌شده)
  const [availableRoles, setAvailableRoles] = useState<Role[]>(() =>
    Array.isArray(ALL_ROLES) ? ALL_ROLES : Object.values(ALL_ROLES)
  );
  const [selectedRoles, setSelectedRoles] = useState<SelectedRoleMap>({});

  // بارگذاری نقش‌های سفارشی ذخیره‌‌شده از حافظه در زمان اجرا
  useEffect(() => {
    const loadSavedCustomRoles = async () => {
      try {
        const storedRoles = await AsyncStorage.getItem(CUSTOM_ROLES_KEY);
        if (storedRoles) {
          const parsed: Role[] = JSON.parse(storedRoles);
          setAvailableRoles((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newRoles = parsed.filter((r) => !existingIds.has(r.id));
            return [...newRoles, ...prev];
          });
        }
      } catch (e) {
        console.error('Error loading custom roles from storage:', e);
      }
    };
    loadSavedCustomRoles();
  }, []);

  // ۳. جستجو و فیلتر نقش‌ها
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | TeamSide>('ALL');

  // ۴. انتخاب کارت‌های حرکت آخر
  const [selectedCards, setSelectedCards] = useState<string[]>(
    LAST_MOVE_CARDS.map((c) => c.id)
  );

  // ۵. اسامی بازیکنان
  const [playerNames, setPlayerNames] = useState<string[]>(() =>
    Array.from({ length: 10 }, (_, i) => `بازیکن ${i + 1}`)
  );

  useEffect(() => {
    setPlayerNames((prev) =>
      Array.from({ length: playerCount }, (_, i) => prev[i] || `بازیکن ${i + 1}`)
    );
  }, [playerCount]);

  // ۶. وضعیت مدال‌ها
  const [isRoleModalVisible, setIsRoleModalVisible] = useState<boolean>(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState<boolean>(false);
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<Role | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState<boolean>(false);

  // فرم ساخت نقش جدید
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleTeamSide, setNewRoleTeamSide] = useState<TeamSide>('citizen');
  const [newRoleDesc, setNewRoleDesc] = useState<string>('');

  // نام سناریو
  const [scenarioTitle, setScenarioTitle] = useState<string>('');

  // --- محاسبات زنده ---
  const totalSelectedRolesCount = useMemo(() => {
    return Object.values(selectedRoles).reduce((sum, count) => sum + count, 0);
  }, [selectedRoles]);

  const TeamSideCounts = useMemo(() => {
    let citizen = 0;
    let mafia = 0;
    let independent = 0;

    Object.entries(selectedRoles).forEach(([roleId, count]) => {
      const role = availableRoles.find((r) => r.id === roleId);
      if (role && count > 0) {
        const rawSide = String(role.side || '').toLowerCase().trim();
        if (rawSide === 'citizen' || rawSide === 'citizens') citizen += count;
        else if (rawSide === 'mafia' || rawSide === 'mafias') mafia += count;
        else independent += count;
      }
    });

    return { citizen, mafia, independent };
  }, [selectedRoles, availableRoles]);

  const filteredRoles = useMemo(() => {
    return availableRoles.filter((role) => {
      const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase());

      const rawSide = String(role.side || '').toLowerCase().trim();
      let computedSide: TeamSide = 'independent';
      if (rawSide === 'citizen' || rawSide === 'citizens') {
        computedSide = 'citizen';
      } else if (rawSide === 'mafia' || rawSide === 'mafias') {
        computedSide = 'mafia';
      } else {
        computedSide = 'independent';
      }

      const matchesFilter = activeFilter === 'ALL' || computedSide === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [availableRoles, searchQuery, activeFilter]);

  // توابع هندلر با useCallback برای حفظ ثبات رفرنس
  const handleRoleCountChange = useCallback((roleId: string, delta: number) => {
    setSelectedRoles((prev) => {
      const current = prev[roleId] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[roleId];
        return copy;
      }
      return { ...prev, [roleId]: updated };
    });
  }, []);

  const handleIncrement = useCallback(
    (id: string) => handleRoleCountChange(id, 1),
    [handleRoleCountChange]
  );

  const handleDecrement = useCallback(
    (id: string) => handleRoleCountChange(id, -1),
    [handleRoleCountChange]
  );

  const handleShowDetail = useCallback((role: Role) => {
    setSelectedRoleForDetail(role);
    setIsDetailModalVisible(true);
  }, []);

  const handleCreateCustomRole = async () => {
    if (!newRoleName.trim()) {
      Alert.alert('خطا', 'لطفاً نام نقش را وارد کنید.');
      return;
    }

    const customRole: Role = {
      id: `custom_role_${Date.now()}`,
      name: newRoleName.trim(),
      side: newRoleTeamSide,
      description: newRoleDesc.trim() || 'نقش سفارشی ایجادشده توسط کاربر.',
      isCustom: true,
    };

    setAvailableRoles((prev) => [customRole, ...prev]);
    setSelectedRoles((prev) => ({ ...prev, [customRole.id]: 1 }));

    try {
      const stored = await AsyncStorage.getItem(CUSTOM_ROLES_KEY);
      const existingRoles: Role[] = stored ? JSON.parse(stored) : [];
      const updatedCustomRoles = [customRole, ...existingRoles.filter((r) => r.id !== customRole.id)];
      await AsyncStorage.setItem(
        CUSTOM_ROLES_KEY,
        JSON.stringify(updatedCustomRoles)
      );
    } catch (e) {
      console.error('Error saving custom role:', e);
    }

    setNewRoleName('');
    setNewRoleTeamSide('citizen');
    setNewRoleDesc('');
    setIsRoleModalVisible(false);
  };

  const buildScenarioObject = (title: string = 'سناریوی سفارشی'): Scenario => {
    const defaultRoles: { roleId: string; count: number }[] = [];
    Object.entries(selectedRoles).forEach(([roleId, count]) => {
      if (count > 0) {
        defaultRoles.push({ roleId, count });
      }
    });

    const lastMoveCards: LastMoveCard[] = LAST_MOVE_CARDS.filter((card) =>
      selectedCards.includes(card.id)
    );

    return {
      id: `custom_scenario_${Date.now()}`,
      title,
      minPlayers: 3,
      maxPlayers: 40,
      defaultPlayers: playerCount,
      defaultRoles,
      lastMoveCards,
      customRoles: availableRoles,
    } as Scenario & { customRoles?: Role[] };
  };

  const validateAndConfirm = (): Scenario | null => {
    if (totalSelectedRolesCount !== playerCount) {
      Alert.alert(
        'عدم تطابق تعداد نقش‌ها',
        `مجموع نقش‌های انتخاب‌شده (${totalSelectedRolesCount}) با تعداد کل بازیکنان (${playerCount}) برابر نیست.`
      );
      return null;
    }

    if (TeamSideCounts.mafia === 0) {
      Alert.alert('توازن سناریو', 'هیچ نقش مافیایی برای این بازی انتخاب نشده است!');
      return null;
    }

    if (TeamSideCounts.citizen === 0) {
      Alert.alert('توازن سناریو', 'هیچ نقش شهروندی برای این بازی انتخاب نشده است!');
      return null;
    }

    if (TeamSideCounts.mafia >= TeamSideCounts.citizen) {
      Alert.alert(
        'هشدار عدم توازن',
        'تعداد مافیاها بیشتر یا برابر با شهروندان است. این موضوع باعث پایان سریع بازی خواهد شد.'
      );
    }

    return buildScenarioObject();
  };

  const handleSaveScenario = async () => {
    if (!scenarioTitle.trim()) {
      Alert.alert('خطا', 'لطفاً یک نام برای سناریو وارد کنید.');
      return;
    }

    const scenarioToSave = buildScenarioObject(scenarioTitle.trim());

    try {
      const existingData = await AsyncStorage.getItem(STORAGE_KEY);
      const savedScenarios: Scenario[] = existingData ? JSON.parse(existingData) : [];
      savedScenarios.push(scenarioToSave);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(savedScenarios));

      Alert.alert('موفقیت', 'سناریو با موفقیت ذخیره شد.');
      setIsSaveModalVisible(false);
      setScenarioTitle('');
    } catch (e) {
      Alert.alert('خطا', 'خطا در ذخیره‌سازی سناریو.');
    }
  };

  const handleProceedToDistribution = () => {
    const scenario = validateAndConfirm();
    if (scenario) {
      onStartGame(scenario, playerCount, playerNames, availableRoles);
    }
  };

  return (
    <View style={styles.container}>
      {/* هدر بالای صفحه */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>بازگشت ✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ساخت بازی سفارشی</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ۱. تعیین تعداد بازیکنان */}
        <View style={styles.counterCard}>
          <Text style={styles.sectionTitle}>تعداد بازیکنان</Text>
          <View style={styles.playerCountSelector}>
            <TouchableOpacity
              onPress={() => setPlayerCount((p) => Math.max(3, p - 1))}
              style={styles.countAdjustBtn}
            >
              <Text style={styles.countAdjustText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.playerCountDisplay}>{playerCount} نفر</Text>
            <TouchableOpacity
              onPress={() => setPlayerCount((p) => p + 1)}
              style={styles.countAdjustBtn}
            >
              <Text style={styles.countAdjustText}>+</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.statusBadge,
              totalSelectedRolesCount === playerCount
                ? styles.badgeValid
                : styles.badgeInvalid,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              نقش‌های انتخاب‌شده: {totalSelectedRolesCount} از {playerCount}
            </Text>
          </View>

          <Text style={styles.TeamSideSummaryText}>
            🔴 مافیا: {TeamSideCounts.mafia} | 🔵 شهروند: {TeamSideCounts.citizen} | 🟡 مستقل/مجهول: {TeamSideCounts.independent}
          </Text>
        </View>

        {/* ۲. جستجو و فیلتر نقش‌ها */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionHeaderRow}>
            <TouchableOpacity
              onPress={() => setIsRoleModalVisible(true)}
              style={styles.addRoleBtn}
            >
              <Text style={styles.addRoleBtnText}>+ ساخت نقش جدید</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>انتخاب نقش‌ها</Text>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="جستجوی نام نقش..."
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'ALL' && styles.activeChip]}
              onPress={() => setActiveFilter('ALL')}
            >
              <Text style={styles.chipText}>همه</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'citizen' && styles.activeChip]}
              onPress={() => setActiveFilter('citizen')}
            >
              <Text style={styles.chipText}>🔵 شهروند</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'mafia' && styles.activeChip]}
              onPress={() => setActiveFilter('mafia')}
            >
              <Text style={styles.chipText}>🔴 مافیا</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'independent' && styles.activeChip]}
              onPress={() => setActiveFilter('independent')}
            >
              <Text style={styles.chipText}>🟡 مستقل</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rolesList}>
            {filteredRoles.map((role) => (
              <RoleCardItem
                key={role.id}
                role={role}
                count={selectedRoles[role.id] || 0}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                onShowDetail={handleShowDetail}
              />
            ))}
          </View>
        </View>

        {/* ۳. انتخاب کارت‌های حرکت آخر */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>کارت‌های حرکت آخر</Text>
          <Text style={styles.sectionSubtitle}>
            کارت‌هایی که مایلید در این سناریو قابل قرعه‌کشی باشند را علامت بزنید:
          </Text>

          {LAST_MOVE_CARDS.map((card) => {
            const isSelected = selectedCards.includes(card.id);
            return (
              <TouchableOpacity
                key={card.id}
                style={[styles.cardOption, isSelected && styles.cardOptionSelected]}
                onPress={() => {
                  setSelectedCards((prev) =>
                    isSelected ? prev.filter((id) => id !== card.id) : [...prev, card.id]
                  );
                }}
              >
                <Text style={styles.checkboxText}>{isSelected ? '☑️' : '⬛'}</Text>
                <View style={styles.cardOptionTextGroup}>
                  <Text style={styles.cardOptionTitle}>{card.title}</Text>
                  <Text style={styles.cardOptionDesc}>{card.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ۴. ورودی اسامی بازیکنان */}
        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>اسامی بازیکنان (اختیاری)</Text>
          {playerNames.map((name, idx) => (
            <View key={idx} style={styles.nameInputRow}>
              <Text style={styles.nameInputLabel}>بازیکن {idx + 1}:</Text>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={(text) => {
                  const updated = [...playerNames];
                  updated[idx] = text;
                  setPlayerNames(updated);
                }}
                placeholder={`بازیکن ${idx + 1}`}
                placeholderTextColor="#71717a"
              />
            </View>
          ))}
        </View>

        {/* دکمه‌های اقدام پایانی */}
        <View style={styles.bottomActionContainer}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => {
              if (validateAndConfirm()) {
                setIsSaveModalVisible(true);
              }
            }}
          >
            <Text style={styles.saveBtnText}>💾 ذخیره این سناریو</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleProceedToDistribution}
          >
            <Text style={styles.startBtnText}>تأیید و پخش کارت‌ها 🚀</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* مدال ۱: تعریف نقش جدید */}
      <Modal visible={isRoleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>تعریف نقش جدید</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="نام نقش (مثلاً: تفنگدار)"
              placeholderTextColor="#71717a"
              value={newRoleName}
              onChangeText={setNewRoleName}
            />

            <Text style={styles.fieldLabel}>تیم / گروه نقش:</Text>
            <View style={styles.TeamSidePickerRow}>
              {(['citizen', 'mafia', 'independent'] as TeamSide[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[
                    styles.TeamSidePickChip,
                    newRoleTeamSide === f && styles.TeamSidePickChipActive,
                  ]}
                  onPress={() => setNewRoleTeamSide(f)}
                >
                  <Text style={styles.chipText}>
                    {f === 'citizen' && 'شهروند'}
                    {f === 'mafia' && 'مافیا'}
                    {f === 'independent' && 'مستقل'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.modalInput, styles.textArea]}
              multiline
              numberOfLines={3}
              placeholder="توضیحات و قابلیت شب نقش..."
              placeholderTextColor="#71717a"
              value={newRoleDesc}
              onChangeText={setNewRoleDesc}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsRoleModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleCreateCustomRole}
              >
                <Text style={styles.confirmBtnText}>افزودن نقش</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مدال ۲: دریافت نام و ذخیره سناریو */}
      <Modal visible={isSaveModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>ذخیره سناریو</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="نام سناریو (مثلاً: شب‌های دوستانه)"
              placeholderTextColor="#71717a"
              value={scenarioTitle}
              onChangeText={setScenarioTitle}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsSaveModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>انصراف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleSaveScenario}
              >
                <Text style={styles.confirmBtnText}>ذخیره</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* مدال ۳: نمایش توضیحات کامل نقش */}
      <Modal
        visible={isDetailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalBox}>
            <Text style={styles.detailRoleName}>{selectedRoleForDetail?.name}</Text>

            <Text style={styles.detailRoleSide}>
              گروه: {
                String(selectedRoleForDetail?.side || '').toLowerCase().trim() === 'mafia' ? '🔴 مافیا' :
                String(selectedRoleForDetail?.side || '').toLowerCase().trim() === 'citizen' ? '🔵 شهروند' : '🟡 مستقل/مجهول'
              }
            </Text>

            <ScrollView style={styles.detailDescScroll}>
              <Text style={styles.detailRoleDesc}>
                {selectedRoleForDetail?.description || 'توضیحاتی برای این نقش ثبت نشده است.'}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.closeDetailBtn}
              onPress={() => setIsDetailModalVisible(false)}
            >
              <Text style={styles.closeDetailBtnText}>بستن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    color: '#dc2626',
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  counterCard: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f4f4f5',
    marginBottom: 8,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 12,
    textAlign: 'right',
  },
  playerCountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginVertical: 10,
  },
  countAdjustBtn: {
    backgroundColor: '#27272a',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countAdjustText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  playerCountDisplay: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 8,
  },
  badgeValid: {
    backgroundColor: 'rgba(6, 78, 59, 0.4)',
    borderColor: '#059669',
    borderWidth: 1,
  },
  badgeInvalid: {
    backgroundColor: 'rgba(127, 29, 29, 0.4)',
    borderColor: '#dc2626',
    borderWidth: 1,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  TeamSideSummaryText: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 4,
  },
  sectionBox: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addRoleBtn: {
    backgroundColor: '#18181b',
    borderColor: '#2563eb',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  addRoleBtnText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: '#18181b',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  activeChip: {
    borderColor: '#dc2626',
    backgroundColor: '#27272a',
  },
  chipText: {
    color: '#ffffff',
    fontSize: 12,
  },
  rolesList: {
    gap: 8,
  },
  roleCard: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleMetaTouchable: {
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: 10,
  },
  roleName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  roleTeamSideLabel: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleCountBtn: {
    backgroundColor: '#27272a',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleCountBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roleCountText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
    minWidth: 20,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  cardOption: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  cardOptionSelected: {
    borderColor: '#dc2626',
  },
  checkboxText: {
    fontSize: 16,
  },
  cardOptionTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardOptionTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cardOptionDesc: {
    color: '#71717a',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  nameInputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  nameInputLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    width: 70,
    textAlign: 'right',
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: '#ffffff',
    textAlign: 'right',
    fontSize: 13,
  },
  bottomActionContainer: {
    gap: 10,
    marginTop: 10,
    marginBottom: 30,
  },
  saveBtn: {
    backgroundColor: '#18181b',
    borderColor: '#2563eb',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontSize: 15,
  },
  startBtn: {
    backgroundColor: '#b91c1c',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    textAlign: 'right',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 6,
  },
  TeamSidePickerRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: 16,
  },
  TeamSidePickChip: {
    flex: 1,
    backgroundColor: '#18181b',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
  },
  TeamSidePickChipActive: {
    borderColor: '#dc2626',
    backgroundColor: '#27272a',
  },
  modalActionRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#27272a',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#b91c1c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  detailModalBox: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
    alignItems: 'center',
  },
  detailRoleName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 6,
    textAlign: 'center',
  },
  detailRoleSide: {
    fontSize: 13,
    color: '#a1a1aa',
    marginBottom: 12,
  },
  detailDescScroll: {
    width: '100%',
    marginVertical: 10,
  },
  detailRoleDesc: {
    color: '#f4f4f5',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
  },
  closeDetailBtn: {
    backgroundColor: '#27272a',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  closeDetailBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});