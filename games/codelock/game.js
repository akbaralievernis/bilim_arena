/**
 * Коддуу кулпу / Кодовый замок.
 *
 * Учебная цель: класс работает как одна команда и доводит тему до конца.
 * У замка столько цифр, сколько заданий. Цифра открывается, если верно
 * ответила хотя бы половина класса. Если нет — задание возвращается
 * в конце (один раз): класс видит объяснение и пробует снова.
 * Выигрыш — не скорость, а то, что ошибки исправлены.
 *
 * Задания — любые из банка темы и конструктора учителя.
 */

import { BaseGame } from '../../core/engine.js';
import { el } from '../../core/ui.js';
import { icon } from '../../core/icons.js';
import { t } from '../../core/i18n.js';

/** Доля класса, которая должна ответить верно, чтобы открыть цифру */
const PASS_SHARE = 0.5;

export default class CodeLockGame extends BaseGame {
  static meta = {
    id: 'codelock',
    icon: 'lock',
    title: { ky: 'Коддуу кулпу', ru: 'Кодовый замок', en: 'Code lock' },
    goal: {
      ky: 'Бүт класс болуп тапшырмаларды чечип, кулпунун бардык сандарын ачуу',
      ru: 'Всем классом решить задания и открыть все цифры замка',
      en: 'Solve the tasks as a class and open every digit of the lock'
    },
    how: {
      ky: 'Класстын жок дегенде жарымы туура жооп берсе, кулпунун бир саны ачылат. Болбосо тапшырма аягында кайра келет — түшүндүрмөнү окуп, дагы аракет кылыңыз.',
      ru: 'Если верно ответит хотя бы половина класса, открывается одна цифра замка. Если нет — задание вернётся в конце: прочитайте объяснение и попробуйте ещё раз.',
      en: 'If at least half the class answers correctly, one digit opens. If not, the task comes back at the end — read the explanation and try again.'
    },
    teamBased: false,
    needsPhones: true,
    minPlayers: 1,
    /** Сколько цифр у замка (заданий) */
    questions: 6
  };

  constructor(ctx) {
    super(ctx);
    // Список заданий дополняется повторами — работаем с копией
    this.ctx.questions = ctx.questions.slice();
    this.size = this.ctx.questions.length;
    this.code = Array.from({ length: this.size }, () => Math.floor(Math.random() * 10));
    this.digits = new Array(this.size).fill(null); // null — закрыта
    this.slotOf = this.ctx.questions.map((_, i) => i); // номер задания → цифра замка
    this.retried = new Set();
    this.outcome = null; // { slot, opened, retry }
  }

  get openedCount() { return this.digits.filter((d) => d !== null).length; }
  get isOpen() { return this.openedCount === this.size; }

  async nextQuestion() {
    this.outcome = null;
    return super.nextQuestion();
  }

  /** Решаем судьбу цифры, когда ответы собраны */
  revealAnswer() {
    if (this.state === 'reveal' || this.state === 'finished') return;

    const slot = this.slotOf[this.index];
    const ok = [...this.answers.values()].filter((a) => a.correct).length;
    // Кто не ответил — тот не помог открыть замок
    const opened = ok / Math.max(1, this.players.size) >= PASS_SHARE;
    let retry = false;

    if (opened) {
      this.digits[slot] = this.code[slot];
    } else if (!this.retried.has(slot)) {
      this.retried.add(slot);
      this.ctx.questions.push(this.ctx.questions[this.index]);
      this.slotOf.push(slot);
      retry = true;
    }
    this.outcome = { slot, opened, retry, ok };
    super.revealAnswer();
  }

  buildResults(reason) {
    return {
      ...super.buildResults(reason),
      lock: { opened: this.openedCount, total: this.size, code: this.code.join('') }
    };
  }

  /** Замок на доске: открытые цифры, текущая цифра и итог вопроса */
  renderBoardExtra(container) {
    const current = this.slotOf[this.index];
    const reveal = this.state === 'reveal';

    const cells = this.digits.map((d, i) => el('div', {
      class: `lock-digit ${d !== null ? 'open' : ''} ${i === current && !reveal ? 'current' : ''}`,
      'aria-label': d !== null ? String(d) : t('cl_locked')
    }, d !== null ? String(d) : '•'));

    let note = t('cl_need', { pct: Math.round(PASS_SHARE * 100) });
    if (reveal && this.outcome) {
      note = this.outcome.opened
        ? t('cl_digit_open', { n: this.code[this.outcome.slot] })
        : (this.outcome.retry ? t('cl_retry') : t('cl_stuck'));
    }

    container.replaceChildren(el('div', { class: `lock-box ${this.isOpen ? 'unlocked' : ''}` },
      el('div', { class: 'lock-icon', 'aria-hidden': 'true' }, icon(this.isOpen ? 'unlock' : 'lock', { size: 48 })),
      el('div', { class: 'lock-digits' }, cells),
      el('p', { class: `lock-note ${reveal && this.outcome ? (this.outcome.opened ? 'ok' : 'bad') : ''}` }, note),
      el('div', { class: 'small muted' }, t('cl_progress', { n: this.openedCount, total: this.size }))
    ));
  }

  statusText() {
    return t('game_waiting_answers', { answered: this.answers.size, total: this.players.size });
  }
}
