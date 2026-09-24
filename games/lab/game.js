/**
 * Лаборатория / Лаборатория.
 *
 * Учебная цель: научный метод. Класс сначала голосует за гипотезу,
 * потом шаг за шагом проводит опыт: каждое задание открывает наблюдение.
 * В конце доска показывает вывод и сравнивает его с гипотезами класса —
 * «ошибиться в прогнозе» здесь нормально, важно проверить.
 *
 * Опыты — данные в data/labs, внутри игры их нет.
 */

import { BaseGame } from '../../core/engine.js';
import { el } from '../../core/ui.js';
import { t, pick } from '../../core/i18n.js';

/** Доля верных ответов, при которой шаг опыта считается выполненным */
const PASS_SHARE = 0.5;

export default class LabGame extends BaseGame {
  static meta = {
    id: 'lab',
    icon: '🧪',
    title: { ky: 'Лаборатория', ru: 'Лаборатория', en: 'Science lab' },
    goal: {
      ky: 'Гипотеза коюп, аны тажрыйба менен текшерүү',
      ru: 'Выдвинуть гипотезу и проверить её опытом',
      en: 'Make a hypothesis and test it with an experiment'
    },
    how: {
      ky: 'Адегенде класс эмне болорун божомолдойт (добуш берет). Андан кийин ар бир тапшырма тажрыйбанын бир кадамын ачат. Аягында корутунду жана божомолдор салыштырылат.',
      ru: 'Сначала класс предсказывает результат (голосует). Затем каждое задание открывает шаг опыта. В конце — вывод и сравнение с прогнозами.',
      en: 'First the class predicts the result (votes). Each task then unlocks a step of the experiment. At the end the conclusion is compared with the predictions.'
    },
    teamBased: false,
    needsPhones: true,
    minPlayers: 1
  };

  /**
   * @param {object} ctx.lab — опыт из data/labs
   */
  constructor(ctx) {
    const lab = ctx.lab;
    const hypothesisVote = {
      id: `${lab.id}-hypothesis`, type: 'choice', vote: true, skill: null,
      prompt: lab.question, options: lab.hypotheses
    };
    super({ ...ctx, topic: lab.topic, questions: [hypothesisVote, ...lab.steps] });
    this.lab = lab;
    this.prediction = null;   // { counts, total, right } — итог голосования
    this.stepDone = [];       // выполнен ли каждый шаг
  }

  get stepIndex() { return this.index - 1; }

  revealAnswer() {
    if (this.state === 'reveal' || this.state === 'finished') return;
    if (this.current?.vote) {
      const counts = this.voteCounts();
      this.prediction = {
        counts,
        total: counts.reduce((s, n) => s + n, 0),
        right: counts[this.lab.answer] || 0 // голоса не перемешиваются — индекс совпадает
      };
    } else if (this.current) {
      const ok = [...this.answers.values()].filter((a) => a.correct).length;
      this.stepDone[this.stepIndex] = ok / Math.max(1, this.players.size) >= PASS_SHARE;
    }
    super.revealAnswer();
  }

  buildResults(reason) {
    const lang = this.ctx.lang;
    const p = this.prediction;
    return {
      ...super.buildResults(reason),
      lab: {
        id: this.lab.id,
        hypothesis: pick(this.lab.hypotheses[this.lab.answer], lang),
        conclusion: pick(this.lab.conclusion, lang),
        predictedPct: p?.total ? Math.round((p.right / p.total) * 100) : null,
        stepsDone: this.stepDone.filter(Boolean).length,
        stepsTotal: this.lab.steps.length
      }
    };
  }

  /** Гипотезы — без подсветки «верного»: ответ откроется только в конце */
  renderOptions(container, reveal) {
    if (!this.current?.vote) return false; // шаги опыта — обычная отрисовка доски
    const counts = reveal ? this.voteCounts() : null;
    container.replaceChildren(el('div', { class: 'options full' },
      this.current.options.map((text, i) => el('div', { class: 'option' },
        el('span', { class: 'key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)),
        el('span', {}, text),
        counts ? el('span', { class: 'line-votes' }, t('eh_votes', { n: counts[i] })) : null
      ))
    ));
    return true;
  }

  /** Колба заполняется выполненными шагами, наблюдения появляются по ходу опыта */
  renderBoardExtra(container) {
    const lang = this.ctx.lang;
    const steps = this.lab.steps;
    const done = this.stepDone.filter(Boolean).length;
    const fill = Math.round((done / steps.length) * 100);
    const reveal = this.state === 'reveal';

    const notes = steps.map((s, i) => {
      const opened = i < this.stepIndex || (i === this.stepIndex && reveal);
      if (!opened) return el('li', { class: 'muted' }, `${i + 1}. …`);
      return el('li', { class: this.stepDone[i] ? 'ok' : 'miss' },
        `${this.stepDone[i] ? '✅' : '⚠️'} ${pick(s.observation, lang)}`);
    });

    container.replaceChildren(el('div', { class: 'lab-box' },
      el('div', { class: 'lab-title' }, `${this.lab.icon} ${pick(this.lab.title, lang)}`),
      el('div', { class: 'lab-flask', role: 'img', 'aria-label': `${fill}%` },
        el('i', { style: `height:${fill}%` })
      ),
      this.current?.vote
        ? el('p', { class: 'lab-note' }, t('lab_predict'))
        : el('ol', { class: 'lab-notes' }, notes),
      this.prediction && !this.current?.vote
        ? el('div', { class: 'small muted' }, t('lab_votes_in', { n: this.prediction.total }))
        : null
    ));
  }

  statusText() {
    return t('game_waiting_answers', { answered: this.answers.size, total: this.players.size });
  }
}
