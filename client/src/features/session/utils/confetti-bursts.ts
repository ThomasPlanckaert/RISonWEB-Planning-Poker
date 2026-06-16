import confetti from "canvas-confetti";

export function fireConsensusConfetti(streak: number): void {
  const intensity = Math.min(streak, 6);
  confetti({
    particleCount: 100 + intensity * 45,
    spread: 70 + intensity * 8,
    origin: { y: 0.6 }
  });
  if (streak >= 2) {
    window.setTimeout(() => {
      confetti({
        particleCount: 50 + intensity * 20,
        spread: 100,
        origin: { x: 0.25, y: 0.65 }
      });
      confetti({
        particleCount: 50 + intensity * 20,
        spread: 100,
        origin: { x: 0.75, y: 0.65 }
      });
    }, 200);
  }
}

export function fireMatchConfetti(): void {
  confetti({
    particleCount: 35,
    spread: 55,
    startVelocity: 28,
    scalar: 0.85,
    origin: { y: 0.7 }
  });
}
