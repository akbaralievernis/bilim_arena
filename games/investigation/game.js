/**
 * «Расследование» — сюжетная командная игра.
 *
 * Движок ничего не знает о конкретном деле: сюжет, улики, подозреваемые
 * и учебные задания приходят из файла данных (data/investigations/*.js).
 *
 * Ход игры:
 *   вступление → улики (каждая открывается учебным заданием)
 *   → обвинение (подозреваемый + минимум 3 улики) → разбор
 *
 * Ошибки идут в общую аналитику по навыкам, как в любой другой игре.
 */

import { BaseGame, STATE } from '../../core/engine.js';
import { pick } from '../../core/i18n.js';

export const PHASE = {
  INTRO: 'intro',
  CLUE: 'clue',          // открыта улика, идёт учебное задание
  REVEALED: 'revealed',  // улика открыта, читаем содержание
  ACCUSE: 'accuse',      // команда выбирает виновного и доказательства
  VERDICT: 'verdict'
};

export default class InvestigationGame extends BaseGame {
  static meta = {
    id: 'investigation',
    icon: 'lens',
    title: { ky: 'Тергөө', ru: 'Расследование', en: 'Investigation' },
    goal: {
      ky: 'Уликаларды ачып, көрсөтмөлөрдөгү карама-каршылыкты табуу жана күнөөлүүнү далилдөө',
      ru: 'Открыть улики, найти противоречие в показаниях и доказать вину',
      en: 'Unlock the clues, find the contradiction in the statements and prove who did it'
    },
    how: {
      ky: 'Ар бир улика үчүн окуу тапшырмасын аткарыңыз. Аягында шектүүнү жана эң аз 3 уликаны тандаңыз.',
      ru: 'Для каждой улики выполните учебное задание. В конце выберите подозреваемого и минимум 3 улики.',
      en: 'Solve a learning task to unlock each clue. At the end pick the suspect and at least 3 clues.'
    },
    teamBased: true,
    needsPhones: true,
    minPlayers: 1
  };

  /**
   * @param {object} ctx
   * @param {object} ctx.investigation — данные дела
   */
  constructor(ctx) {
    // Вопросы берём из улик: движок работает с ними как с обычными заданиями
    const questions = (ctx.investigation.clues || []).map((clue) => ({
      id: clue.id,
      skill: clue.skill,
      difficulty: ctx.investigation.difficulty || 2,
      ...clue.question
    }));

    super({ ...ctx, questions, topic: ctx.investigation.topic });

    this.case = ctx.investigation;
    this.phase = PHASE.INTRO;
    this.unlocked = new Set();      // id открытых улик
    this.failedClues = new Set();   // улики, открытые после ошибки (без XP)
    this.votes = new Map();         // playerId -> { suspect, clues[] }
    this.verdict = null;
  }

  get clues() { return this.case.clues; }
  get suspects() { return this.case.suspects; }
  get currentClue() { return this.clues[this.index] || null; }
  get progress() { return Math.round((this.unlocked.size / this.clues.length) * 100); }

  // ─── Ход игры ─────────────────────────────────────────────────────────────

  async start() {
    this.phase = PHASE.INTRO;
    this.state = STATE.RUNNING;
    this.startedAt = Date.now();
    this.index = -1;
    this._update();
    return this;
  }

  /** Вступление прочитано — открываем первую улику */
  async beginInvestigation() {
    this.phase = PHASE.CLUE;
    return this.nextQuestion();
  }

  async nextQuestion() {
    // Все улики открыты — переходим к обвинению
    if (this.index + 1 >= this.clues.length) return this.startAccusation();
    this.phase = PHASE.CLUE;
    return super.nextQuestion();
  }

  /** Улика открывается после задания — даже при ошибке, но без XP за улику */
  revealAnswer() {
    if (this.phase !== PHASE.CLUE) return super.revealAnswer();

    const clue = this.currentClue;
    if (clue) {
      this.unlocked.add(clue.id);
      const anyCorrect = [...this.answers.values()].some((a) => a.correct);
      if (!anyCorrect) this.failedClues.add(clue.id);
    }
    this.phase = PHASE.REVEALED;
    super.revealAnswer();
  }

  /** XP: за верный ответ и за открытую улику, а не за простое участие */
  scoreAnswer({ correct, ms, player }) {
    if (!correct) return 0;
    const s = this.case.scoring || {};
    const speed = Math.max(0, Math.round(30 * (1 - ms / (this.ctx.perQuestionSec * 1000))));
    return (s.answerXP || 10) * 5 + speed + Math.min(40, player.streak * 10);
  }

  // ─── Обвинение ────────────────────────────────────────────────────────────

  startAccusation() {
    this._stopTimer();
    this.phase = PHASE.ACCUSE;
    this.state = STATE.RUNNING;
    this.votes.clear();
    this._update();
    return null;
  }

  /** Голос игрока: подозреваемый + выбранные улики */
  submitAccusation(playerId, { suspect, clues }) {
    if (this.phase !== PHASE.ACCUSE) return { ignored: true };
    const required = this.case.final.requiredEvidence || 3;
    const picked = (clues || []).filter((id) => this.unlocked.has(id));
    if (!suspect || picked.length < required) return { error: 'need-evidence', required };

    this.votes.set(playerId, { suspect, clues: picked });
    this._update();

    // Все ответили — можно подводить итог
    if (this.votes.size >= this.players.size && this.players.size > 0) this.finishInvestigation();
    return { ok: true };
  }

  /** Итог команды — по большинству голосов */
  teamAccusation() {
    const suspectCount = {};
    const clueCount = {};
    this.votes.forEach(({ suspect, clues }) => {
      suspectCount[suspect] = (suspectCount[suspect] || 0) + 1;
      clues.forEach((c) => { clueCount[c] = (clueCount[c] || 0) + 1; });
    });

    const suspect = Object.entries(suspectCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const clues = Object.entries(clueCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.max(3, this.case.final.requiredEvidence || 3))
      .map(([id]) => id);

    return { suspect, clues };
  }

  /**
   * Проверка логической цепочки: мало назвать человека —
   * нужно подтвердить его вину уликами.
   */
  checkVerdict({ suspect, clues }) {
    const final = this.case.final;
    const keyClues = final.keyClues || [];
    const matched = clues.filter((id) => keyClues.includes(id));
    const suspectRight = suspect === final.guilty;
    const proofRight = matched.length >= Math.min(keyClues.length, final.requiredEvidence || 3);

    return {
      suspect, clues,
      suspectRight,
      proofRight,
      matchedClues: matched,
      solved: suspectRight && proofRight
    };
  }

  async finishInvestigation() {
    if (this.phase === PHASE.VERDICT) return;
    this.phase = PHASE.VERDICT;
    this.verdict = this.checkVerdict(this.teamAccusation());

    // XP за улики и доказательства — начисляется игрокам
    const s = this.case.scoring || {};
    const clueBonus = (this.unlocked.size - this.failedClues.size) * (s.clueXP || 15);
    const proofBonus = this.verdict.matchedClues.length * (s.evidenceXP || 20);
    const finalBonus = this.verdict.suspectRight ? (s.finalXP || 60) : 0;
    const perPlayer = Math.round((clueBonus + proofBonus + finalBonus) / Math.max(1, this.players.size));
    this.players.forEach((p) => { p.score += perPlayer; });

    return this.finish('solved');
  }

  buildResults(reason) {
    const base = super.buildResults(reason);
    return {
      ...base,
      caseId: this.case.id,
      caseTitle: this.case.title,
      cluesFound: this.unlocked.size,
      cluesTotal: this.clues.length,
      verdict: this.verdict,
      solution: this.case.final.solution
    };
  }

  // ─── Экран телефона ───────────────────────────────────────────────────────

  controllerSpec(playerId) {
    const player = this.players.get(playerId);
    const lang = this.ctx.lang;

    if (this.phase === PHASE.VERDICT || this.state === STATE.FINISHED) {
      return {
        screen: 'end',
        score: player?.score || 0,
        correct: player?.correct || 0,
        total: player?.total || 0
      };
    }

    if (this.phase === PHASE.ACCUSE) {
      // Телефон превращается в бланк обвинения
      return {
        screen: 'accuse',
        sent: this.votes.has(playerId),
        required: this.case.final.requiredEvidence || 3,
        suspects: this.suspects.map((s) => ({
          id: s.id, letter: s.letter, emoji: s.emoji, name: pick(s.name, lang)
        })),
        clues: this.clues
          .filter((c) => this.unlocked.has(c.id))
          .map((c) => ({ id: c.id, icon: c.icon, title: pick(c.title, lang) }))
      };
    }

    if (this.phase === PHASE.INTRO) {
      return { screen: 'wait', team: player?.team || null, score: player?.score || 0 };
    }

    // Фаза улики — обычный экран ответа из базового движка
    const spec = super.controllerSpec(playerId);
    if (spec.screen === 'answer' && this.currentClue) {
      spec.clue = {
        icon: this.currentClue.icon,
        title: pick(this.currentClue.title, lang)
      };
    }
    return spec;
  }

  statusText() {
    return `${this.unlocked.size}/${this.clues.length}`;
  }
}
