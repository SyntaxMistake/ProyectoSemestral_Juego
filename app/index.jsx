import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTopScore } from "@/hooks/useTopScore";

export default function MenuScreen() {
  const router = useRouter();
  const { topScore } = useTopScore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cuenta las ovejas 🐑</Text>
      <Text style={styles.subtitle}>
        Sesión de 5 minutos.{"\n"}
        Acumula racha respondiendo correctamente.{"\n"}
        Un error reinicia la racha pero sigues jugando.
      </Text>

      <View style={styles.topScoreBox}>
        <Text style={styles.topScoreLabel}>TOP SCORE</Text>
        <Text style={styles.topScoreValue}>{topScore}</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => router.push("/game")}>
        <Text style={styles.btnText}>Jugar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, styles.btnSecondary]}
        onPress={() => router.push("/history")}
      >
        <Text style={[styles.btnText, styles.btnTextSecondary]}>
          Ver historial
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a3c1a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "monospace",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    fontFamily: "monospace",
    textAlign: "center",
    lineHeight: 22,
  },
  topScoreBox: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: "center",
    marginVertical: 8,
  },
  topScoreLabel: {
    color: "#9cf",
    fontSize: 12,
    fontFamily: "monospace",
  },
  topScoreValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  btn: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: "80%",
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    fontFamily: "monospace",
  },
  btnTextSecondary: {
    color: "#fff",
  },
});
