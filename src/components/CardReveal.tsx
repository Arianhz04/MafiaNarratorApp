import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useGameStore } from '../store/useGameStore';

interface CardRevealProps {
  onFinishReveal: () => void;
}

const getSideColors = (side?: string) => {
  const normalized = String(side || '').toLowerCase().trim();

  if (normalized === 'mafia' || normalized === 'mafias') {
    return {
      border: '#dc2626',
      title: '#ef4444',
    };
  }

  if (normalized === 'citizen' || normalized === 'citizens') {
    return {
      border: '#2563eb',
      title: '#60a5fa',
    };
  }

  return {
    border: '#eab308',
    title: '#facc15',
  };
};

export const CardReveal: React.FC<CardRevealProps> = ({ onFinishReveal }) => {
  const { players } = useGameStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const currentPlayer = players[currentIndex];

  if (!currentPlayer) return null;

  const handleNext = () => {
    setIsRevealed(false);
    if (currentIndex < players.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onFinishReveal();
    }
  };

  const sideColors = getSideColors(currentPlayer.role?.side);

  return (
    <View style={styles.container}>
      <Text style={styles.counter}>
        بازیکن {currentIndex + 1} از {players.length}
      </Text>
      <Text style={styles.playerName}>{currentPlayer.name}</Text>
      <Text style={styles.subtext}>گوشی را به این بازیکن تحویل دهید</Text>

      <View
        style={[
          styles.cardBox,
          isRevealed ? { borderColor: sideColors.border } : null,
        ]}
      >
        {!isRevealed ? (
          <View style={styles.hiddenContainer}>
            <Text style={styles.icon}>🕵️‍♂️</Text>
            <Text style={styles.hiddenText}>برای مشاهده نقش روی دکمه زیر کلیک کنید</Text>
          </View>
        ) : (
          <View style={styles.revealedContainer}>
            <Image
              source={
                typeof currentPlayer.role.image === 'string'
                  ? { uri: currentPlayer.role.image }
                  : currentPlayer.role.image
              }
              style={styles.bgImage}
            />
            <View style={styles.overlay} />
            <View style={styles.roleContent}>
              <Text style={styles.sideBadge}>
                {currentPlayer.role.side === 'mafia' && 'تیم مافیا 🔴'}
                {currentPlayer.role.side === 'citizen' && 'تیم شهروند 🔵'}
                {currentPlayer.role.side === 'independent' && 'نقش مستقل 🟡'}
              </Text>
              <Text style={[styles.roleTitle, { color: sideColors.title }]}>
                {currentPlayer.role.name}
              </Text>
              <Text style={styles.roleDesc}>{currentPlayer.role.description}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={isRevealed ? styles.nextBtn : styles.revealBtn}
        onPress={!isRevealed ? () => setIsRevealed(true) : handleNext}
      >
        <Text style={styles.btnText}>
          {!isRevealed
            ? 'مشاهده نقش 👁️'
            : currentIndex < players.length - 1
            ? 'پنهان‌سازی و نفر بعدی ⏭️'
            : 'پایان تقسیم نقش‌ها 🚀'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, alignItems: 'center', justifyContent: 'center', gap: 12 },
  counter: { color: '#9ca3af', fontSize: 12 },
  playerName: { color: '#ef4444', fontSize: 26, fontWeight: 'bold' },
  subtext: { color: '#6b7280', fontSize: 12, marginBottom: 10 },
  cardBox: { width: '100%', height: 420, backgroundColor: '#111827', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1f2937' },
  hiddenContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 20 },
  icon: { fontSize: 50 },
  hiddenText: { color: '#d1d5db', textAlign: 'center', fontSize: 14 },
  revealedContainer: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  bgImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },
  roleContent: { gap: 8 },
  sideBadge: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-end', fontSize: 12, overflow: 'hidden' },
  roleTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'right' },
  roleDesc: { color: '#e5e7eb', fontSize: 13, textAlign: 'right', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 },
  revealBtn: { width: '100%', backgroundColor: '#dc2626', padding: 16, borderRadius: 12, marginTop: 10 },
  nextBtn: { width: '100%', backgroundColor: '#1f2937', padding: 16, borderRadius: 12, marginTop: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});