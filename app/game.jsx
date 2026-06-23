import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GameCanvas } from "@/components/GameCanvas";
import { ChoiceButtons } from "@/components/ChoiceButtons";
import { useSessionStore } from "@/store/sessionStore";
import { useTopScore } from "@/hooks/useTopScore";
import { saveSession } from "@/utils/storage";
import { SESSION_SECONDS } from "@/constants/game";
import { formatTime } from "@/utils/format";

export default function GameScreen() {
  const router = useRouter();
  const { topScore, maybeUpdate } = useTopScore();
  const {
    streak,
    correctCount: correctTotal,
    wrongCount: wrongTotal,
    incrementStreak,
    resetStreak,
    incrementCorrect,
    incrementWrong,
    resetSession,
  } = useSessionStore();

  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);
  const [phase, setPhase] = useState("releasing");
  const [feedback, setFeedback] = useState(null);
  const [options, setOptions] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [sheepEnteredCount, setSheepEnteredCount] = useState(0);

  const sessionStart = useRef(Date.now());
  const countAnim = useRef(new Animated.Value(1)).current;

  // Countdown timer
  useEffect(() => {
    resetSession();
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          handleFinish("tiempo agotado");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function handleSheepReady(count, opts) {
    setCorrectCount(count);
    setOptions(opts);
    setPhase("answering");
  }

  function handleAnswer(val) {
    if (phase !== "answering") return;
    const correct = val === correctCount;
    if (correct) {
      incrementStreak();
      incrementCorrect();
      maybeUpdate(streak + 1);
      setFeedback({ text: "¡Correcto!", correct: true });
    } else {
      resetStreak();
      incrementWrong();
      setFeedback({ text: "Incorrecto. Veamos cuántas eran...", correct: false });
    }
    setPhase("returning");
  }

  function handleSheepEntered(count) {
    setSheepEnteredCount(count);
    countAnim.setValue(1.4);
    Animated.spring(countAnim, {
      toValue: 1,
      tension: 120,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }

  function handleReturnDone() {
    setFeedback(null);
    setSheepEnteredCount(0);
    setPhase("releasing");
  }

  async function handleFinish(reason) {
    const playedSeconds = Math.round((Date.now() - sessionStart.current) / 1000);
    await saveSession({
      streak,
      reason,
      date: new Date().toLocaleString(),
      durationSeconds: playedSeconds,
      correct: correctTotal,
      wrong: wrongTotal,
    });
    router.replace("/");
  }

  function confirmEnd() {
    Alert.alert(
      "Terminar sesión",
      "¿Seguro que quieres terminar? Se guardará tu racha actual.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, terminar",
          style: "destructive",
          onPress: () => handleFinish("terminada por el usuario"),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
      {/* Top HUD */}
      <View style={styles.hud}>
        <View style={styles.hudBox}>
          <Text style={styles.hudText}>{formatTime(secondsLeft)}</Text>
        </View>
        <View style={styles.hudBox}>
          <Text style={styles.hudText}>Racha: {streak}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.endBtn} onPress={confirmEnd}>
        <Text style={styles.endBtnText}>Terminar sesión</Text>
      </TouchableOpacity>

      {/* Canvas */}
      <GameCanvas
        phase={phase}
        onSheepReady={handleSheepReady}
        onReturnDone={handleReturnDone}
        onSheepEntered={handleSheepEntered}
        correctCount={correctCount}
      />

      {/* Sheep entry counter — visible during return animation */}
      {phase === "returning" && sheepEnteredCount > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.countOverlay, { transform: [{ scale: countAnim }] }]}
        >
          <Text style={styles.countNumber}>{sheepEnteredCount}</Text>
        </Animated.View>
      )}

      {/* Bottom choice box */}
      <View style={styles.choiceBox}>
        <Text style={styles.choiceLabel}>¿Cuántas ovejas hay en pantalla?</Text>
        <ChoiceButtons
          options={options}
          correctCount={correctCount}
          phase={phase}
          onSelect={handleAnswer}
        />
        {feedback && (
          <Text
            style={[
              styles.feedback,
              { color: feedback.correct ? "#1a7a3a" : "#a33" },
            ]}
          >
            {feedback.text}
          </Text>
        )}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3a7228",
  },
  gameArea: {
    flex: 1,
    margin: 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#5a9e3a",
  },
  hud: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  hudBox: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hudText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
    fontFamily: "monospace",
  },
  endBtn: {
    position: "absolute",
    top: 46,
    right: 10,
    backgroundColor: "rgba(150,40,40,0.85)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
  },
  endBtnText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "monospace",
  },
  countOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  countNumber: {
    fontSize: 110,
    fontWeight: "900",
    color: "rgba(255,255,255,0.93)",
    fontFamily: "monospace",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 14,
  },
  choiceBox: {
    position: "absolute",
    bottom: 12,
    left: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 10,
    padding: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#ccc",
    zIndex: 10,
  },
  choiceLabel: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
    textAlign: "center",
  },
  feedback: {
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
  },
});
