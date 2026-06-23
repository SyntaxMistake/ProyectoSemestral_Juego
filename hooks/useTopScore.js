import { useEffect, useState } from "react";
import { loadTopScore, saveTopScore } from "@/utils/storage";

export function useTopScore() {
  const [topScore, setTopScore] = useState(0);

  useEffect(() => {
    loadTopScore().then(setTopScore);
  }, []);

  async function maybeUpdate(candidate) {
    if (candidate > topScore) {
      setTopScore(candidate);
      await saveTopScore(candidate);
    }
  }

  return { topScore, maybeUpdate };
}
