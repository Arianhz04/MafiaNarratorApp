import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Role } from '../types/types';

interface Props {
  assignedRoles: Role[];
  playerNames: string[];
  onComplete: (assignments: { name: string; role: Role }[]) => void;
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

export const CardDistribution: React.FC<Props> = ({
  assignedRoles,
  playerNames,
  onComplete,
}) => {
  // Utility function for shuffling arrays (Fisher-Yates)
  const shuffle = useCallback((array: Role[]): Role[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Deck state and distribution tracking
  const [initialDeck, setInitialDeck] = useState<Role[]>(() =>
    shuffle(assignedRoles)
  );
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState<number>(0);
  const [pickedAssignments, setPickedAssignments] = useState<
    { name: string; role: Role }[]
  >([]);
  const [revealedRole, setRevealedRole] = useState<Role | null>(null);

  // Sync state when assignedRoles prop updates (prevents stale initial state)
  useEffect(() => {
    setInitialDeck(shuffle(assignedRoles));
    setSelectedIndices([]);
    setCurrentPlayerIdx(0);
    setPickedAssignments([]);
    setRevealedRole(null);
  }, [assignedRoles, shuffle]);

  // Restart / Redistribute cards with a fresh shuffle
  const handleRedistribute = () => {
    setInitialDeck(shuffle(assignedRoles));
    setSelectedIndices([]);
    setCurrentPlayerIdx(0);
    setPickedAssignments([]);
    setRevealedRole(null);
  };

  // Select a card blindly
  const handlePickCard = (cardIndex: number) => {
    if (revealedRole !== null) return;

    const chosenRole = initialDeck[cardIndex];
    if (!chosenRole) return;

    const playerName =
      playerNames[currentPlayerIdx] || `بازیکن ${currentPlayerIdx + 1}`;

    setSelectedIndices((prev) => [...prev, cardIndex]);
    setRevealedRole(chosenRole);

    const newAssignment = { name: playerName, role: chosenRole };
    setPickedAssignments((prev) => [...prev, newAssignment]);
  };

  // Move to next player or finish distribution
  const handleNextPlayer = () => {
    const isLastPlayer = currentPlayerIdx + 1 >= playerNames.length;

    setRevealedRole(null);

    if (isLastPlayer) {
      onComplete(pickedAssignments);
    } else {
      setCurrentPlayerIdx((prev) => prev + 1);
    }
  };

  // Safely get role image source
  const imageSource = revealedRole
    ? (revealedRole as any).image || (revealedRole as any).imageUrl
    : null;

  const revealedSideColors = revealedRole ? getSideColors(revealedRole.side) : null;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>پخش کارت‌ها</Text>
          <Text style={styles.subtitle}>
            نوبت:{' '}
            <Text style={styles.playerName}>
              {playerNames[currentPlayerIdx] || `بازیکن ${currentPlayerIdx + 1}`}
            </Text>
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRedistribute}
          style={styles.redistributeButton}
        >
          <Text style={styles.redistributeText}>پخش مجدد کارت‌ها</Text>
        </TouchableOpacity>
      </View>

      {/* Face-Down Deck or Revealed Role View */}
      {revealedRole === null ? (
        <ScrollView contentContainerStyle={styles.cardsGrid}>
          {initialDeck.map((_, idx) => {
            if (selectedIndices.includes(idx)) return null;

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => handlePickCard(idx)}
                style={styles.cardBack}
              >
                <Text style={styles.cardQuestionMark}>؟</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.revealedContainer,
            revealedSideColors ? { borderColor: revealedSideColors.border } : null,
          ]}
        >
          <Text style={styles.roleLabel}>نقش شما:</Text>

          {/* Role Image Display */}
          {imageSource ? (
            <Image
              source={
                typeof imageSource === 'string'
                  ? { uri: imageSource }
                  : imageSource
              }
              style={styles.roleImage}
              resizeMode="contain"
            />
          ) : null}

          <Text
            style={[
              styles.roleTitle,
              revealedSideColors ? { color: revealedSideColors.title } : null,
            ]}
          >
            {revealedRole.name}
          </Text>
          <Text style={styles.roleDescription}>
            {revealedRole.description || 'نقش شما برای این مسابقه تعیین شد.'}
          </Text>

          <TouchableOpacity
            onPress={handleNextPlayer}
            style={styles.hideCardButton}
          >
            <Text style={styles.hideCardText}>
              {currentPlayerIdx + 1 >= playerNames.length
                ? 'پایان و ورود به پنل راوی'
                : 'کارت را مخفی کن و بده به نفر بعدی'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  headerTextGroup: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 4,
  },
  playerName: {
    color: '#f87171',
    fontWeight: 'bold',
  },
  redistributeButton: {
    backgroundColor: '#18181b',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  redistributeText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  cardBack: {
    width: '28%',
    height: 110,
    backgroundColor: '#18181b',
    borderColor: '#991b1b',
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardQuestionMark: {
    fontSize: 32,
    fontWeight: '900',
    color: '#dc2626',
  },
  revealedContainer: {
    backgroundColor: '#09090b',
    borderColor: '#b91c1c',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginVertical: 'auto',
    width: '100%',
  },
  roleLabel: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 8,
  },
  roleImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleDescription: {
    fontSize: 13,
    color: '#d4d4d8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  hideCardButton: {
    backgroundColor: '#b91c1c',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  hideCardText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});