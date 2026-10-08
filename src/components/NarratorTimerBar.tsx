import React, { useState, useEffect, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';

try {
  var Haptics = require('expo-haptics');
} catch (e) {
  Haptics = null;
}

interface TimerBarProps {
  isVisible: boolean;
  onClose: () => void;
}

export const NarratorTimerBar: React.FC<TimerBarProps> = memo(({ isVisible, onClose }) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(45);
  const [initialDuration, setInitialDuration] = useState<number>(45);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isOvertime, setIsOvertime] = useState<boolean>(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState<number>(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- سیستم جابه‌جایی و درگ کامپوننت ---
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // بازخورد ویبره / هپتیک
  const triggerHaptic = (type: 'warning' | 'error') => {
    if (Haptics && Platform.OS !== 'web') {
      if (type === 'warning') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      Vibration.vibrate(type === 'error' ? 400 : 150);
    }
  };

  // منطق تایمر
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (!isOvertime) {
          setSecondsLeft((prev) => {
            const nextVal = prev - 1;

            if (nextVal >= 1 && nextVal <= 3) {
              triggerHaptic('warning');
            }

            if (nextVal <= 0) {
              triggerHaptic('error');
              setIsOvertime(true);
              setOvertimeSeconds(1);
              return 0;
            }

            return nextVal;
          });
        } else {
          setOvertimeSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isOvertime]);

  if (!isVisible) return null;

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setPreset = (seconds: number) => {
    setIsRunning(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    setInitialDuration(seconds);
    setSecondsLeft(seconds);
  };

  const adjustTime = (amount: number) => {
    if (!isOvertime) {
      setSecondsLeft((prev) => Math.max(0, prev + amount));
    }
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    setSecondsLeft(initialDuration);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    setSecondsLeft(initialDuration);
  };

  return (
    <Animated.View
      style={[
        styles.floatingContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
    >
      {/* دستگیره درگ: فقط این بخش رویداد درگ را دریافت می‌کند تا دکمه‌ها قفل نشوند */}
      <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
        <View style={styles.dragHandleBar} />
      </View>

      {/* بخش اصلی نمایش تایمر */}
      <View style={styles.mainRow}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.displayContainer}>
          {isOvertime ? (
            <Text style={[styles.timerText, styles.overtimeText]}>
              +{formatTime(overtimeSeconds)}
            </Text>
          ) : (
            <Text
              style={[
                styles.timerText,
                secondsLeft <= 10 && secondsLeft > 5 && styles.warningText,
                secondsLeft <= 5 && styles.criticalText,
              ]}
            >
              {formatTime(secondsLeft)}
            </Text>
          )}
          {isOvertime && <Text style={styles.overtimeLabel}>وقت اضافه</Text>}
        </View>

        {!isOvertime && (
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(15)}>
              <Text style={styles.adjustText}>+15s</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(-15)}>
              <Text style={styles.adjustText}>-15s</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* دکمه‌های پیش‌فرض زمانی (Presets) */}
      <View style={styles.presetRow}>
        {[15, 30, 45, 60].map((sec) => (
          <TouchableOpacity
            key={sec}
            style={[
              styles.presetBtn,
              initialDuration === sec && !isOvertime && styles.activePresetBtn,
            ]}
            onPress={() => setPreset(sec)}
          >
            <Text style={styles.presetText}>{sec}s</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* اکشن‌های اصلی (شروع، بازنشانی، پایان) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, isRunning ? styles.pauseBtn : styles.startBtn]}
          onPress={handleStartPause}
        >
          <Text style={styles.actionBtnText}>{isRunning ? 'توقف' : 'شروع'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.resetBtn]} onPress={handleReset}>
          <Text style={styles.actionBtnText}>بازنشانی</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.stopBtn]} onPress={handleStop}>
          <Text style={styles.actionBtnText}>پایان</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    top: 70,
    left: 12,
    right: 12,
    zIndex: 999,
    backgroundColor: '#18181b',
    borderColor: '#dc2626',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    backgroundColor: '#3f3f46',
    borderRadius: 2,
  },
  mainRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#27272a',
    borderRadius: 20,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  displayContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  warningText: {
    color: '#f59e0b',
  },
  criticalText: {
    color: '#ef4444',
  },
  overtimeText: {
    color: '#dc2626',
  },
  overtimeLabel: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -4,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 4,
  },
  adjustBtn: {
    backgroundColor: '#27272a',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  adjustText: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#27272a',
    paddingVertical: 6,
    marginHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePresetBtn: {
    backgroundColor: '#b91c1c',
  },
  presetText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: '#16a34a',
  },
  pauseBtn: {
    backgroundColor: '#d97706',
  },
  resetBtn: {
    backgroundColor: '#3f3f46',
  },
  stopBtn: {
    backgroundColor: '#991b1b',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
});