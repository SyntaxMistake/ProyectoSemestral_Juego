export function randomSheepCount() {
  return Math.floor(Math.random() * 7) + 3; // 3–9 (corral 3×3 slots sin overlap)
}

export function buildOptions(correct) {
  const set = new Set([correct]);
  while (set.size < 3) {
    const delta = (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = Math.max(1, correct + delta);
    set.add(candidate);
  }
  const arr = Array.from(set);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
