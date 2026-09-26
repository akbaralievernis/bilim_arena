/**
 * Мугалимдин катасы / Ошибка учителя.
 *
 * Учебная цель: развивать критическое мышление. На доске — решение задачи
 * или программа «учителя», в одной строке спрятана ошибка. Ученики
 * с телефонов указывают номер строки. После ответа строка зачёркивается
 * красной ручкой, а объяснение показывает, как надо было.
 *
 * Задания берутся из банков тем (флаг errorHunt) и из конструктора учителя
 * (тип «Найди ошибку») — внутри игры вопросов нет.
 */

import { BaseGame } from '../../core/engine.js';
import { el } from '../../core/ui.js';
import { icon } from '../../core/icons.js';
import { t } from '../../core/i18n.js';

export default class ErrorHuntGame extends BaseGame {
  static meta = {
    id: 'errorhunt',
    icon: 'pen',
    title: { ky: 'Мугалимдин катасы', ru: 'Ошибка учителя', en: "Teacher's mistake" },
    goal: {
      ky: 'Чечимди текшерип, ката кеткен сапты табуу',
      ru: 'Проверить решение и найти строку с ошибкой',
      en: 'Check the solution and find the line with the mistake'
    },
    how: {
      ky: 'Доскада мугалимдин чечими. Бир сапта ката бар — телефондон ошол саптын номерин басыңыз. Тез жана туура тапкан көбүрөөк упай алат.',
      ru: 'На доске решение учителя. В одной строке ошибка — нажмите её номер на телефоне. Кто нашёл быстрее и верно, получает больше очков.',
      en: "The teacher's solution is on the board. One line is wrong — tap its number on your phone. Fast correct answers earn more points."
    },
    teamBased: false,
    needsPhones: true,
    minPlayers: 1
  };

  /** Какие задания подходят этой игре */
  static questionFilter = (q) => !!q.errorHunt;

  /** Сколько учеников указали на каждую строку */
  lineVotes() {
    const votes = new Array(this.current?.options?.length || 0).fill(0);
    this.answers.forEach((a) => {
      const i = Number(a.value);
      if (Number.isInteger(i) && votes[i] !== undefined) votes[i] += 1;
    });
    return votes;
  }

  /** Строки решения на доске — как в тетради, с номерами */
  renderOptions(container, reveal) {
    const votes = reveal ? this.lineVotes() : null;
    container.replaceChildren(el('div', { class: 'options solution-lines' },
      (this.current?.options || []).map((text, i) => {
        const isError = reveal && i === this.current.correctIndex;
        return el('div', { class: `option ${isError ? 'wrong-line' : ''}` },
          el('span', { class: 'key', 'aria-hidden': 'true' }, String(i + 1)),
          el('span', { class: 'line-text' }, text),
          isError ? icon('pen', { size: 20, cls: 'err-mark' }) : null,
          votes ? el('span', { class: 'line-votes' }, t('eh_votes', { n: votes[i] })) : null
        );
      })
    ));
  }

  /** Ответ показывается как номер строки — так его проще сверить */
  correctText() {
    const c = this.current;
    if (!c?.options) return '';
    return `${t('eh_line_n', { n: c.correctIndex + 1 })}: ${c.options[c.correctIndex]}`;
  }

  statusText() {
    return t('game_waiting_answers', { answered: this.answers.size, total: this.players.size });
  }
}
