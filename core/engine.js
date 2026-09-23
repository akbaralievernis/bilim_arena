/**
 * Bilim Arena — игровой движок.
 *
 * Все игры платформы подключаются как модули и получают одинаковый
 * жизненный цикл: start → pause/resume → finish → showResults.
 * Движок сам считает очки, время, ведёт разбор ошибок по навыкам
 * и сохраняет результат — игре остаётся только рисовать себя.
 */

import { pick } from './i18n.js';
import { shuffleOptions } from './curriculum.js';
import { recordAnswer, recordGame } from './progress.js';

/** Состояния игры */
export const STATE = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  REVEAL: 'reveal',
  FINISHED: 'finished'
};

/**
 * Базовая игра. Наследники обязаны реализовать renderBoard()
 * и могут переопределить scoreAnswer() и controllerSpec().
 */
export class BaseGame {
  /** Описание игры — показывается на экране «перед игрой» */
  static meta = {
    id: 'base',
    title: { ky: 'Оюн', ru: 'Игра', en: 'Game' },
    goal: { ky: '', ru: '', en: '' },
    how: { ky: '', ru: '', en: '' },
    teamBased: false,
    needsPhones: false,
    minPlayers: 1
  };

  /**
   * @param {object} ctx
   * @param {Array}  ctx.questions   — вопросы из curriculum.getQuestions()
   * @param {string} ctx.topic       — id темы
   * @param {string} ctx.lang        — язык интерфейса
   * @param {number} ctx.perQuestionSec
   * @param {object} ctx.room        — комната realtime (или null для соло)
   * @param {function} ctx.onUpdate  — вызывается при любом изменении состояния
   */
  constructor(ctx) {
    this.ctx = { perQuestionSec: 25, lang: 'ky', ...ctx };
    this.state = STATE.IDLE;
    this.index = -1;
    this.current = null;      // текущий вопрос с перемешанными вариантами
    this.answers = new Map(); // playerId -> { value, correct, ms }
    this.log = [];            // полная история ответов (для разбора ошибок)
    this.players = new Map(); // playerId -> { id, name, team, score, correct, total }
    this.startedAt = 0;
    this.timer = null;
    this.timeLeft = 0;
  }

  get meta() { return this.constructor.meta; }
  get questionCount() { return this.ctx.questions.length; }
  get isTeamGame() { return this.meta.teamBased; }

  // ── Игроки ────────────────────────────────────────────────────────────────
  addPlayer({ id, name, team = null }) {
    if (!this.players.has(id)) {
      this.players.set(id, { id, name, team, score: 0, correct: 0, total: 0, streak: 0 });
    } else {
      Object.assign(this.players.get(id), { name });
    }
    this._update();
    return this.players.get(id);
  }

  removePlayer(id) {
    this.players.delete(id);
    this._update();
  }

  playerList() {
    return [...this.players.values()].sort((a, b) => b.score - a.score);
  }

  /** Делит игроков на две команды поровну */
  splitTeams() {
    const ids = [...this.players.keys()];
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    ids.forEach((id, i) => { this.players.get(id).team = i % 2 === 0 ? 'A' : 'B'; });
    this._update();
  }

  teamScores() {
    const t = { A: 0, B: 0 };
    this.players.forEach((p) => { if (p.team) t[p.team] += p.score; });
    return t;
  }

  // ── Жизненный цикл ────────────────────────────────────────────────────────
  async start() {
    this.state = STATE.RUNNING;
    this.startedAt = Date.now();
    this.index = -1;
    await this.nextQuestion();
    return this;
  }

  pause() {
    if (this.state !== STATE.RUNNING) return;
    this.state = STATE.PAUSED;
    this._stopTimer();
    this._update();
  }

  resume() {
    if (this.state !== STATE.PAUSED) return;
    this.state = STATE.RUNNING;
    this._startTimer(this.timeLeft);
    this._update();
  }

  /** Следующий вопрос (или конец игры) */
  async nextQuestion() {
    this._stopTimer();
    this.index += 1;
    if (this.index >= this.questionCount) return this.finish('completed');

    const q = this.ctx.questions[this.index];
    const shuffled = q.type === 'input' ? null : shuffleOptions(q, this.ctx.lang);
    this.current = {
      raw: q,
      number: this.index + 1,
      prompt: pick(q.prompt, this.ctx.lang),
      explain: pick(q.explain, this.ctx.lang),
      type: q.type || 'choice',
      options: shuffled ? shuffled.options.map((o) => o.text) : null,
      correctIndex: shuffled ? shuffled.correctIndex : null,
      answer: q.answer || null,
      skill: q.skill,
      startedAt: Date.now()
    };
    this.answers.clear();
    this.state = STATE.RUNNING;
    this._startTimer(this.ctx.perQuestionSec);
    this._update();
    return this.current;
  }

  /** Ответ игрока. value — индекс варианта или строка для ввода */
  handleAnswer(playerId, value) {
    if (this.state !== STATE.RUNNING || !this.current) return { ignored: true };
    if (this.answers.has(playerId)) return { ignored: true }; // один ответ на вопрос

    const player = this.players.get(playerId);
    if (!player) return { ignored: true };

    const ms = Date.now() - this.current.startedAt;
    const correct = this.checkAnswer(value);
    const points = this.scoreAnswer({ correct, ms, player });

    this.answers.set(playerId, { value, correct, ms, points });
    player.total += 1;
    if (correct) { player.correct += 1; player.streak += 1; } else { player.streak = 0; }
    player.score += points;

    this.log.push({
      playerId, playerName: player.name, questionId: this.current.raw.id,
      skill: this.current.skill, correct, ms, value
    });

    this._update();

    // Все ответили — не ждём таймер
    if (this.answers.size >= this.players.size && this.players.size > 0) {
      this.revealAnswer();
    }
    return { correct, points, ms };
  }

  checkAnswer(value) {
    if (!this.current) return false;
    if (this.current.type === 'input') {
      const given = String(value).trim().toLowerCase().replace(/\s+/g, '');
      return (this.current.answer || []).some((a) => String(a).trim().toLowerCase().replace(/\s+/g, '') === given);
    }
    return Number(value) === this.current.correctIndex;
  }

  /** Очки за ответ. Быстрый верный ответ ценится выше — но только верный. */
  scoreAnswer({ correct, ms, player }) {
    if (!correct) return 0;
    const limit = this.ctx.perQuestionSec * 1000;
    const speedBonus = Math.max(0, Math.round(50 * (1 - ms / limit)));
    const streakBonus = Math.min(50, player.streak * 10);
    return 100 + speedBonus + streakBonus;
  }

  /** Показ правильного ответа (пауза между вопросами) */
  revealAnswer() {
    if (this.state === STATE.REVEAL || this.state === STATE.FINISHED) return;
    this._stopTimer();
    this.state = STATE.REVEAL;
    this._update();
  }

  async finish(reason = 'manual') {
    if (this.state === STATE.FINISHED) return this.results;
    this._stopTimer();
    this.state = STATE.FINISHED;
    this.results = this.buildResults(reason);
    await this.saveResult();
    this._update();
    return this.results;
  }

  // ── Результаты ────────────────────────────────────────────────────────────

  /** Разбор: сколько ошибок по каждому навыку + список ошибочных вопросов */
  buildResults(reason = 'manual') {
    const bySkill = {};
    const mistakes = [];

    this.log.forEach((entry) => {
      const s = bySkill[entry.skill] || (bySkill[entry.skill] = { ok: 0, total: 0 });
      s.total += 1;
      if (entry.correct) s.ok += 1;
      else {
        const q = this.ctx.questions.find((x) => x.id === entry.questionId);
        mistakes.push({
          questionId: entry.questionId,
          skill: entry.skill,
          prompt: pick(q?.prompt, this.ctx.lang),
          explain: pick(q?.explain, this.ctx.lang),
          playerId: entry.playerId,
          playerName: entry.playerName
        });
      }
    });

    const players = this.playerList();
    const totalAnswers = this.log.length;
    const correctAnswers = this.log.filter((e) => e.correct).length;

    let winner = null;
    if (this.isTeamGame) {
      const t = this.teamScores();
      winner = t.A === t.B ? 'draw' : (t.A > t.B ? 'A' : 'B');
    } else if (players.length) {
      winner = players[0].id;
    }

    return {
      gameId: this.meta.id,
      topic: this.ctx.topic,
      reason,
      durationSec: Math.round((Date.now() - this.startedAt) / 1000),
      questionCount: this.index + 1,
      totalAnswers,
      correctAnswers,
      accuracy: totalAnswers ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
      players,
      teams: this.isTeamGame ? this.teamScores() : null,
      winner,
      bySkill,
      mistakes,
      /** Навыки, где меньше 70% верных — их стоит повторить */
      weakSkills: Object.entries(bySkill)
        .filter(([, s]) => s.total > 0 && s.ok / s.total < 0.7)
        .map(([skill, s]) => ({ skill, ok: s.ok, total: s.total }))
        .sort((a, b) => (a.ok / a.total) - (b.ok / b.total))
    };
  }

  /** Сохраняет прогресс. Для доски — только у самого ученика на его устройстве. */
  async saveResult() {
    const r = this.results;
    if (this.ctx.solo) {
      for (const entry of this.log) {
        await recordAnswer({
          topic: this.ctx.topic, skill: entry.skill, correct: entry.correct,
          questionId: entry.questionId, timeMs: entry.ms, gameId: this.meta.id
        });
      }
      await recordGame({
        gameId: this.meta.id, topic: this.ctx.topic,
        score: r.players[0]?.score || 0,
        correct: r.correctAnswers, total: r.totalAnswers
      });
    }
    return r;
  }

  /** Вопросы, где были ошибки — для кнопки «Повторить тему» */
  wrongQuestionIds() {
    return [...new Set(this.log.filter((e) => !e.correct).map((e) => e.questionId))];
  }

  // ── Экран телефона ────────────────────────────────────────────────────────
  /**
   * Описание того, что показать на телефоне ученика.
   * Один контроллер обслуживает все игры — поэтому это данные, а не HTML.
   */
  controllerSpec(playerId) {
    const player = this.players.get(playerId);
    const answered = this.answers.get(playerId);

    if (this.state === STATE.FINISHED) {
      return { screen: 'end', score: player?.score || 0, correct: player?.correct || 0, total: player?.total || 0 };
    }
    if (this.state === STATE.REVEAL) {
      return {
        screen: 'reveal',
        correct: answered?.correct ?? null,
        correctText: this.current?.options?.[this.current.correctIndex] ?? (this.current?.answer?.[0] || ''),
        explain: this.current?.explain || '',
        score: player?.score || 0
      };
    }
    if (this.state === STATE.RUNNING && this.current) {
      if (answered) return { screen: 'sent', score: player?.score || 0 };
      return {
        screen: 'answer',
        number: this.current.number,
        total: this.questionCount,
        type: this.current.type,
        prompt: this.current.prompt,
        options: this.current.options,
        timeLeft: this.timeLeft,
        team: player?.team || null
      };
    }
    return { screen: 'wait', team: player?.team || null, score: player?.score || 0 };
  }

  // ── Таймер ────────────────────────────────────────────────────────────────
  _startTimer(seconds) {
    this._stopTimer();
    this.timeLeft = seconds;
    this.timer = setInterval(() => {
      this.timeLeft -= 1;
      if (this.timeLeft <= 0) {
        this._stopTimer();
        this.revealAnswer();
      } else {
        this._update('tick');
      }
    }, 1000);
  }

  _stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  _update(kind = 'state') {
    this.ctx.onUpdate?.(this, kind);
  }

  destroy() {
    this._stopTimer();
    this.players.clear();
    this.answers.clear();
  }
}
