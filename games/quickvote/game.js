/**
 * Тез сурамжылоо / Быстрый опрос.
 *
 * Учебная цель: мгновенно увидеть, понял ли класс тему.
 * Доска показывает вопрос и распределение ответов, телефоны — варианты.
 * Правильный ответ раскрывается после того, как ответили все.
 */

import { BaseGame } from '../../core/engine.js';
import { el } from '../../core/ui.js';
import { icon } from '../../core/icons.js';
import { t } from '../../core/i18n.js';

export default class QuickVoteGame extends BaseGame {
  static meta = {
    id: 'quickvote',
    icon: 'quiz',
    title: { ky: 'Тез сурамжылоо', ru: 'Быстрый опрос', en: 'Quick poll' },
    goal: {
      ky: 'Класстын теманы канчалык түшүнгөнүн текшерүү',
      ru: 'Проверить, насколько класс понял тему',
      en: 'Check how well the class understood the topic'
    },
    how: {
      ky: 'Доскадагы суроону окуп, телефондон жоопту басыңыз. Баары жооп бергенде туура жооп ачылат.',
      ru: 'Прочитайте вопрос на доске и нажмите ответ на телефоне. Когда ответят все, откроется правильный ответ.',
      en: 'Read the question on the board and tap your answer on the phone. The correct answer is revealed when everyone has answered.'
    },
    teamBased: false,
    needsPhones: true,
    minPlayers: 1
  };

  /** Сколько человек выбрало каждый вариант — это и есть главный экран */
  distribution() {
    const counts = new Array(this.current?.options?.length || 0).fill(0);
    this.answers.forEach((a) => {
      const i = Number(a.value);
      if (Number.isInteger(i) && i >= 0 && i < counts.length) counts[i] += 1;
    });
    return counts;
  }

  /** В опросе скорость не главное — важен сам ответ */
  scoreAnswer({ correct }) {
    return correct ? 100 : 0;
  }

  /** Дополнительный блок на доске: столбики ответов */
  renderBoardExtra(container) {
    container.innerHTML = '';
    if (!this.current?.options) return;

    const counts = this.distribution();
    const total = Math.max(1, this.answers.size);
    const reveal = this.state === 'reveal';

    const box = el('div', { class: 'stack' });
    this.current.options.forEach((text, i) => {
      const n = counts[i];
      const pct = Math.round((n / total) * 100);
      const isCorrect = reveal && i === this.current.correctIndex;

      box.append(el('div', { class: 'vote-row' },
        el('div', { class: 'vote-label' },
          el('span', { class: 'key' }, String.fromCharCode(65 + i)),
          el('span', {}, text),
          isCorrect ? icon('check', { size: 22, cls: 'vote-ok', label: t('game_correct') }) : null
        ),
        el('div', { class: `bar thick ${isCorrect ? 'ok' : ''}` },
          el('i', { style: `width:${reveal ? pct : 0}%` })
        ),
        el('div', { class: 'vote-count' }, reveal ? `${n}` : '•'.repeat(Math.min(n, 12)))
      ));
    });
    container.append(box);
  }

  /** Строка состояния под вопросом */
  statusText() {
    return t('game_waiting_answers', { answered: this.answers.size, total: this.players.size });
  }
}
