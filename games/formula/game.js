/**
 * Формула-беттеш / Формула-бой.
 *
 * Учебная цель: беглый счёт и уверенность в вычислениях. Класс делится
 * на две команды, между ними — канат. После каждого задания канат
 * тянет та команда, у которой больше доля верных ответов (а не та,
 * где больше людей). Если верно ответили все в команде — рывок двойной.
 * Канат дошёл до края — команда победила досрочно.
 *
 * Задания — из банка темы: ввод числа и выбор ответа.
 */

import { BaseGame } from '../../core/engine.js';
import { el } from '../../core/ui.js';
import { t } from '../../core/i18n.js';

/** Сколько рывков от центра до победы */
const LIMIT = 4;

export default class FormulaGame extends BaseGame {
  static meta = {
    id: 'formula',
    icon: 'swords',
    title: { ky: 'Формула-беттеш', ru: 'Формула-бой', en: 'Formula battle' },
    goal: {
      ky: 'Тез жана так эсептеп, командаң менен арканды өз тарабыңа тартуу',
      ru: 'Считать быстро и точно и перетянуть канат на сторону своей команды',
      en: 'Calculate fast and accurately to pull the rope to your side'
    },
    how: {
      ky: 'Класс эки командага бөлүнөт. Туура жооп берген окуучулардын үлүшү көп болгон команда арканды тартат. Командада баары туура жооп берсе — эки эсе күчтүү тартуу. Аркан четке жетсе — жеңиш!',
      ru: 'Класс делится на две команды. Канат тянет команда, в которой больше доля верных ответов. Если в команде верно ответили все — рывок двойной. Канат дошёл до края — победа!',
      en: 'The class splits into two teams. The team with the larger share of correct answers pulls the rope. If everyone in a team is right, the pull is double. Reach the edge to win!'
    },
    teamBased: true,
    needsPhones: true,
    minPlayers: 2,
    subjects: ['math', 'physics', 'chemistry', 'economics', 'finance'],
    questions: 10
  };

  /** Для счёта подходят ввод ответа и выбор (без «поиска ошибки» и сортировки) */
  static questionFilter = (q) => ['input', 'choice'].includes(q.type || 'choice') && !q.errorHunt;

  constructor(ctx) {
    super(ctx);
    this.rope = 0;         // < 0 — к команде A, > 0 — к команде B
    this.pull = null;      // { team, power } — рывок в этом раунде
    this.victory = null;   // 'A' | 'B' — канат дошёл до края
  }

  /** Доля верных ответов в команде и средняя скорость верных */
  teamRound(team) {
    const members = [...this.players.values()].filter((p) => p.team === team);
    const right = members.map((p) => this.answers.get(p.id)).filter((a) => a?.correct);
    const avgMs = right.length ? right.reduce((s, a) => s + a.ms, 0) / right.length : Infinity;
    return { size: members.length, right: right.length, share: members.length ? right.length / members.length : 0, avgMs };
  }

  revealAnswer() {
    if (this.state === 'reveal' || this.state === 'finished') return;

    const A = this.teamRound('A');
    const B = this.teamRound('B');
    let team = null;
    if (A.share !== B.share) team = A.share > B.share ? 'A' : 'B';
    else if (A.right > 0) team = A.avgMs <= B.avgMs ? 'A' : 'B'; // поровну — решает скорость

    this.pull = null;
    if (team) {
      const r = team === 'A' ? A : B;
      const power = r.size > 0 && r.right === r.size ? 2 : 1;
      this.rope = Math.max(-LIMIT, Math.min(LIMIT, this.rope + (team === 'A' ? -power : power)));
      this.pull = { team, power };
      if (Math.abs(this.rope) >= LIMIT) this.victory = team;
    }
    super.revealAnswer();
  }

  async nextQuestion() {
    if (this.victory) return this.finish('rope');
    this.pull = null;
    return super.nextQuestion();
  }

  /** Победитель — сторона, куда перетянут канат; при ничьей по канату — по очкам */
  buildResults(reason) {
    const r = super.buildResults(reason);
    if (this.rope !== 0) r.winner = this.rope < 0 ? 'A' : 'B';
    r.rope = { position: this.rope, limit: LIMIT };
    return r;
  }

  renderBoardExtra(container) {
    // Узел не выходит за дорожку: 6%…94%
    const pct = 6 + ((this.rope + LIMIT) / (2 * LIMIT)) * 88;
    const reveal = this.state === 'reveal';
    const teamName = (x) => (x === 'A' ? t('board_team_a') : t('board_team_b'));

    let note = t('fb_hint');
    if (reveal) {
      note = this.pull
        ? t(this.pull.power > 1 ? 'fb_pull_double' : 'fb_pull', { team: teamName(this.pull.team) })
        : t('fb_no_pull');
    }

    container.replaceChildren(el('div', { class: 'rope-box' },
      el('div', { class: 'rope-teams' },
        el('b', { class: 'team-a' }, `◀ ${teamName('A')}`),
        el('b', { class: 'team-b' }, `${teamName('B')} ▶`)
      ),
      el('div', { class: 'rope-track', role: 'img', 'aria-label': `${this.rope}` },
        el('i', { class: 'rope-line' }),
        el('i', { class: 'rope-center' }),
        el('span', { class: 'rope-knot', style: `left:${pct}%`, 'aria-hidden': 'true' })
      ),
      el('p', { class: `rope-note ${reveal && this.pull ? `pull-${this.pull.team}` : ''}` }, note)
    ));
  }

  statusText() {
    return t('game_waiting_answers', { answered: this.answers.size, total: this.players.size });
  }
}
