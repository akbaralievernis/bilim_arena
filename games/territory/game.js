/**
 * Аймакты басып алуу / Захват территории.
 *
 * Учебная цель: командное закрепление темы. Класс делится на две команды,
 * каждый верный ответ открывает клетку карты. Побеждает команда,
 * захватившая больше территорий — а не та, что быстрее кликает.
 */

import { BaseGame } from '../../core/engine.js';
import { el } from '../../core/ui.js';
import { t } from '../../core/i18n.js';

export default class TerritoryGame extends BaseGame {
  static meta = {
    id: 'territory',
    icon: 'map',
    title: { ky: 'Аймакты басып алуу', ru: 'Захват территории', en: 'Capture the territory' },
    goal: {
      ky: 'Команда менен суроолорго жооп берип, картанын аймактарын ээлөө',
      ru: 'Командой отвечать на вопросы и захватывать территории карты',
      en: 'Answer as a team and capture areas of the map'
    },
    how: {
      ky: 'Ар бир суроого телефондон жооп бериңиз. Кайсы команда туура жана тез жооп берсе, ошол клетканы ээлейт.',
      ru: 'Отвечайте на вопрос с телефона. Команда, ответившая верно и быстрее, забирает клетку.',
      en: 'Answer from your phone. The team that answers correctly and faster takes the cell.'
    },
    teamBased: true,
    needsPhones: true,
    minPlayers: 2
  };

  constructor(ctx) {
    super(ctx);
    this.cells = Array.from({ length: ctx.cellCount || 12 }, () => null); // null | 'A' | 'B'
    this.lastCapture = null;
  }

  /** Захват клетки той командой, которая первой дала верный ответ */
  revealAnswer() {
    if (this.state === 'reveal' || this.state === 'finished') return;

    const correctAnswers = [...this.answers.entries()]
      .filter(([, a]) => a.correct)
      .map(([playerId, a]) => ({ playerId, ms: a.ms, team: this.players.get(playerId)?.team }))
      .sort((a, b) => a.ms - b.ms);

    // Команда с бОльшим числом верных ответов; при равенстве — кто быстрее
    const byTeam = { A: [], B: [] };
    correctAnswers.forEach((a) => { if (a.team) byTeam[a.team].push(a); });

    let winnerTeam = null;
    if (byTeam.A.length !== byTeam.B.length) {
      winnerTeam = byTeam.A.length > byTeam.B.length ? 'A' : 'B';
    } else if (byTeam.A.length > 0) {
      winnerTeam = byTeam.A[0].ms <= byTeam.B[0].ms ? 'A' : 'B';
    } else if (correctAnswers.length) {
      winnerTeam = correctAnswers[0].team; // игра без команд
    }

    if (winnerTeam) {
      const free = this.cells.findIndex((c) => c === null);
      if (free >= 0) {
        this.cells[free] = winnerTeam;
        this.lastCapture = free;
      }
    } else {
      this.lastCapture = null;
    }

    super.revealAnswer();
  }

  /** Счёт команды — это захваченные клетки */
  teamScores() {
    return this.cells.reduce((acc, c) => {
      if (c) acc[c] += 1;
      return acc;
    }, { A: 0, B: 0 });
  }

  /** Игра кончается, когда карта заполнена или вопросы закончились */
  async nextQuestion() {
    if (this.cells.every((c) => c !== null)) return this.finish('map-full');
    return super.nextQuestion();
  }

  renderBoardExtra(container) {
    container.innerHTML = '';
    const score = this.teamScores();
    const total = this.cells.length;

    const map = el('div', {
      class: 'territory-map',
      style: `--cols:${Math.ceil(Math.sqrt(total))}`,
      role: 'img',
      'aria-label': `${t('board_team_a')}: ${score.A}, ${t('board_team_b')}: ${score.B}`
    });

    this.cells.forEach((owner, i) => {
      map.append(el('div', {
        class: `cell ${owner ? 'owned team-' + owner.toLowerCase() : ''} ${i === this.lastCapture ? 'just' : ''}`
      }, owner || String(i + 1)));
    });

    const aPct = Math.round((score.A / total) * 100);
    const bPct = Math.round((score.B / total) * 100);

    container.append(
      el('div', { class: 'row between team-scores' },
        el('div', { class: 'team-badge team-a' }, `${t('board_team_a')}: ${score.A}`),
        el('div', { class: 'team-badge team-b' }, `${t('board_team_b')}: ${score.B}`)
      ),
      el('div', { class: 'versus-bar' },
        el('i', { class: 'a', style: `width:${aPct}%` }),
        el('i', { class: 'b', style: `width:${bPct}%` })
      ),
      map
    );
  }

  statusText() {
    return t('game_waiting_answers', { answered: this.answers.size, total: this.players.size });
  }
}
