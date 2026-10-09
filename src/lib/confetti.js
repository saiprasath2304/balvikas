import confetti from 'canvas-confetti';

export function celebrate(color) {
  const colors = color ? [color, '#f5b301', '#ffffff'] : ['#f97316', '#f5b301', '#7a1f2b', '#16a34a'];
  confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors }), 250);
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors }), 400);
}
