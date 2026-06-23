import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { loadHistory } from "@/utils/storage";
import { useTopScore } from "@/hooks/useTopScore";
import { formatDuration } from "@/utils/format";

export default function HistoryScreen() {
  const router = useRouter();
  const { topScore } = useTopScore();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.topScoreBox}>
        <Text style={styles.topScoreLabel}>TOP SCORE (racha más alta)</Text>
        <Text style={styles.topScoreValue}>{topScore}</Text>
      </View>

      {history.length === 0 ? (
        <Text style={styles.empty}>Todavía no hay sesiones registradas.</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardDate}>{item.date}</Text>
                <Text style={styles.cardStreak}>Racha: {item.streak}</Text>
              </View>
              <Text style={styles.cardReason}>
                {item.reason} · {formatDuration(item.durationSeconds)}
              </Text>
              <View style={styles.cardStats}>
                <Text style={styles.statTotal}>
                  Total: {item.correct + item.wrong}
                </Text>
                <Text style={styles.statCorrect}>✓ {item.correct}</Text>
                <Text style={styles.statWrong}>✗ {item.wrong}</Text>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Volver al menú</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#14283c",
    paddingTop: 32,
    alignItems: "center",
    gap: 12,
  },
  topScoreBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: 14,
    width: "90%",
    alignItems: "center",
  },
  topScoreLabel: {
    color: "#9cf",
    fontSize: 11,
    fontFamily: "monospace",
  },
  topScoreValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  empty: {
    color: "#999",
    fontSize: 13,
    fontFamily: "monospace",
    marginTop: 20,
  },
  list: {
    width: "100%",
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardDate: { color: "#bbd", fontSize: 11, fontFamily: "monospace" },
  cardStreak: { color: "#9cf", fontSize: 13, fontWeight: "700", fontFamily: "monospace" },
  cardReason: { color: "#999", fontSize: 10, fontFamily: "monospace" },
  cardStats: { flexDirection: "row", gap: 10, marginTop: 2 },
  statTotal: { color: "#ddd", fontSize: 11, fontFamily: "monospace" },
  statCorrect: { color: "#8e8", fontSize: 11, fontFamily: "monospace" },
  statWrong: { color: "#e88", fontSize: 11, fontFamily: "monospace" },
  backBtn: {
    borderWidth: 1.5,
    borderColor: "#fff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 28,
    marginBottom: 24,
  },
  backBtnText: { color: "#fff", fontSize: 14, fontWeight: "600", fontFamily: "monospace" },
});
