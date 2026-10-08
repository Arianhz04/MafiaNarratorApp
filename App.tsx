import React, { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, BackHandler, Alert } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SplashScreen } from './src/components/SplashScreen';
import { ScenarioSelector } from './src/components/ScenarioSelector';
import { CardDistribution } from './src/components/CardDistribution';
import { NarratorPanel } from './src/components/NarratorPanel';
import { HomeScreen } from './src/components/HomeScreen';
import { CustomGameBuilder } from './src/components/CustomGameBuilder';
import { SavedScenariosScreen } from './src/components/SavedScenariosScreen';
import { Scenario, Role, ScenarioRoleRequirement } from './src/types/types';
import { ALL_ROLES } from './src/data/scenariosData';

const CUSTOM_ROLES_KEY = '@mafia_custom_roles';

type NavigationStep = 'splash' | 'home' | 'custom' | 'saved' | 'presets' | 'distribution' | 'dashboard';

export default function App() {
  const [currentStep, setCurrentStep] = useState<NavigationStep>('splash');

  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [assignedRoles, setAssignedRoles] = useState<Role[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [finalAssignments, setFinalAssignments] = useState<{ name: string; role: Role }[]>([]);
  const [savedCustomRoles, setSavedCustomRoles] = useState<Role[]>([]);

  // بارگذاری همه‌جانبه نقش‌های سفارشی ذخیره‌شده در راه‌اندازی اپلیکیشن
  useEffect(() => {
    const loadGlobalCustomRoles = async () => {
      try {
        const stored = await AsyncStorage.getItem(CUSTOM_ROLES_KEY);
        if (stored) {
          const parsed: Role[] = JSON.parse(stored);
          setSavedCustomRoles(parsed);
        }
      } catch (e) {
        console.error('Error loading global custom roles in App:', e);
      }
    };
    loadGlobalCustomRoles();
  }, [currentStep]);

  // مدیریت کلید بازگشت اندروید
  useEffect(() => {
    const onBackPress = () => {
      if (currentStep === 'splash') {
        return true;
      }
      if (currentStep === 'home') {
        Alert.alert(
          'خروج از بازی',
          'آیا می‌خواهید از بازی خارج شوید؟',
          [
            { text: 'انصراف', style: 'cancel', onPress: () => {} },
            { text: 'خروج', style: 'destructive', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true }
        );
        return true;
      } else if (currentStep === 'custom' || currentStep === 'saved' || currentStep === 'presets') {
        setCurrentStep('home');
        return true;
      } else {
        Alert.alert(
          'بازگشت به صفحه اصلی',
          'آیا مطمئن هستید؟ اطلاعات بازی جاری پاک شده و به صفحه اصلی برمی‌گردید.',
          [
            { text: 'انصراف', style: 'cancel', onPress: () => {} },
            {
              text: 'بازگشت',
              style: 'destructive',
              onPress: () => handleReset(),
            },
          ],
          { cancelable: true }
        );
        return true;
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentStep]);

  const handleReset = () => {
    setSelectedScenario(null);
    setAssignedRoles([]);
    setPlayerNames([]);
    setFinalAssignments([]);
    setCurrentStep('home');
  };

  const handleSelectHomeOption = (option: 'custom' | 'saved' | 'presets') => {
    setCurrentStep(option);
  };

  const handleStartCustomGame = (
    scenario: Scenario,
    count: number,
    names: string[],
    customRolesPool?: Role[]
  ) => {
    setSelectedScenario(scenario);

    const staticRolesPool = Array.isArray(ALL_ROLES)
      ? ALL_ROLES
      : Object.values(ALL_ROLES);

    const providedPool = customRolesPool || [];
    const fullRolesPool = [...providedPool, ...savedCustomRoles, ...staticRolesPool];

    const roles: Role[] = [];
    scenario.defaultRoles?.forEach((req) => {
      const roleDef = fullRolesPool.find((r) => r.id === req.roleId);

      if (roleDef) {
        for (let i = 0; i < (req.count || 1); i++) {
          roles.push(roleDef);
        }
      }
    });

    setAssignedRoles(roles);
    setPlayerNames(names);
    setCurrentStep('distribution');
  };

  const handleSelectScenario = (
    scenario: Scenario,
    playerCount?: number,
    customPlayerNames?: string[]
  ) => {
    if (!scenario) return;

    const count = playerCount || scenario.defaultPlayers || 10;
    setSelectedScenario(scenario);

    const roleRequirements: ScenarioRoleRequirement[] = scenario.defaultRoles
      ? [...scenario.defaultRoles]
      : [];

    if (scenario.scalingRules) {
      const rule = scenario.scalingRules.find((r) => r.playerCount === count);
      if (rule) {
        const extraRoles =
          (rule as any).addedRoles ||
          (rule as any).additionalRoles ||
          (rule as any).roles ||
          (rule as any).roleRequirements;

        if (Array.isArray(extraRoles)) {
          roleRequirements.push(...extraRoles);
        }
      }
    }

    // ترکیب تعاریف نقش‌های سفارشی سناریو، نقش‌های ذخیره‌شده و نقش‌های ایستا
    const staticRolesPool = Array.isArray(ALL_ROLES)
      ? ALL_ROLES
      : Object.values(ALL_ROLES);

    const scenarioCustomRoles = (scenario as any).customRoles || [];
    const fullRolesPool = [...scenarioCustomRoles, ...savedCustomRoles, ...staticRolesPool];

    const roles: Role[] = [];
    roleRequirements.forEach((req) => {
      const roleDef = fullRolesPool.find((r) => r.id === req.roleId);

      if (roleDef) {
        for (let i = 0; i < (req.count || 1); i++) {
          roles.push(roleDef);
        }
      }
    });

    // استفاده از اسامی سفارشی در صورت وجود، در غیر این صورت استفاده از اسامی پیش‌فرض
    const names = customPlayerNames && customPlayerNames.length === count
      ? customPlayerNames
      : Array.from({ length: count }, (_, i) => `بازیکن ${i + 1}`);

    setAssignedRoles(roles);
    setPlayerNames(names);
    setCurrentStep('distribution');
  };

  const handleDistributionComplete = (assignments: { name: string; role: Role }[]) => {
    setFinalAssignments(assignments);
    setCurrentStep('dashboard');
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />

        {/* ۰. اسپلش اسکرین اول بازی */}
        {currentStep === 'splash' && (
          <SplashScreen onFinish={() => setCurrentStep('home')} />
        )}

        {/* ۱. منوی اصلی برنامه */}
        {currentStep === 'home' && (
          <HomeScreen onSelectOption={handleSelectHomeOption} />
        )}

        {/* ۲. بخش ساخت بازی سفارشی */}
        {currentStep === 'custom' && (
          <CustomGameBuilder
            onBack={() => setCurrentStep('home')}
            onStartGame={handleStartCustomGame}
          />
        )}

        {/* ۳. بخش سناریوهای ذخیره‌شده کاربر */}
        {currentStep === 'saved' && (
          <SavedScenariosScreen
            onBack={() => setCurrentStep('home')}
            onSelectScenario={(sc) => handleSelectScenario(sc, sc.defaultPlayers)}
          />
        )}

        {/* ۴. بخش سناریوهای آماده سیستم */}
        {currentStep === 'presets' && (
          <ScenarioSelector onSelectScenario={handleSelectScenario} />
        )}

        {/* ۵. فاز توزیع کارت‌ها */}
        {currentStep === 'distribution' && (
          <CardDistribution
            assignedRoles={assignedRoles}
            playerNames={playerNames}
            onComplete={handleDistributionComplete}
          />
        )}

        {/* ۶. پنل اصلی گرداننده (داشبورد) */}
        {currentStep === 'dashboard' && (
          <NarratorPanel
            initialPlayers={finalAssignments}
            scenario={selectedScenario}
            onResetGame={handleReset}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});