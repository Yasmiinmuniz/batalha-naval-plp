export function mapDifficultyToApi(value) {
  const map = {
    basic: 'basic',
    intermediate: 'intermediate',
    advanced: 'advanced',
    easy: 'basic',
    medium: 'intermediate',
    hard: 'advanced',
  };

  return map[value] || 'basic';
}

export function modeLabel(mode) {
  return mode === 'dynamic' ? 'Dinâmico' : 'Campanha';
}