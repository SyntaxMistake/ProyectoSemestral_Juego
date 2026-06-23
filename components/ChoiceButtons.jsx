import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function ChoiceButtons({ options, correctCount, phase, onSelect }) {
  const canAnswer = phase === "answering";
  const answered = phase === "returning" || phase === "done";

  return (
    <View style={styles.row}>
      {options.map((val) => {
        const isCorrect = val === correctCount;
        return (
          <TouchableOpacity
            key={val}
            style={[
              styles.btn,
              answered && isCorrect && styles.correct,
              !canAnswer && styles.disabled,
            ]}
            onPress={() => canAnswer && onSelect(val)}
            activeOpacity={canAnswer ? 0.7 : 1}
          >
            <Text style={[styles.btnText, answered && isCorrect && styles.correctText]}>
              {val}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#f4f4f4",
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#aaa",
    alignItems: "center",
  },
  correct: {
    backgroundColor: "#bfe8bf",
    borderColor: "#3a7d2a",
  },
  disabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    fontFamily: "monospace",
  },
  correctText: {
    color: "#1a5c1a",
  },
});
