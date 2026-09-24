/**
 * Тарых картасы / Карта истории.
 *
 * Учебная цель: понять последовательность событий, а не зубрить даты
 * по одной. На доске — перепутанные события, ученики на телефонах
 * расставляют их по времени. После ответа доска строит линию времени
 * и показывает, какое событие класс чаще всего ставил не на своё место.
 *
 * Засчитывается (для XP и аналитики) только полностью верный порядок,
 * но очки в игре начисляются и за частично верный — чтобы было видно рост.
 */

import { BaseGame } from '../../core/engine.js';
import { el } from '../../core/ui.js';
import { t } from '../../core/i18n.js';

export default class TimelineGame extends BaseGame {
  static meta = {
    id: 'timeline',
    icon: '⏳',
    title: { ky: 'Тарых картасы', ru: 'Карта истории', en: 'History map' },
    goal: {
      ky: 'Окуяларды убакыт боюнча туура иреттөө',
      ru: 'Расставить события в правильном порядке во времени',
      en: 'Put the events in the right order in time'
    },
    how: {
      ky: 'Телефондо окуяларды ↑ ↓ баскычтары менен жылдырып, эң эртесинен баштап иреттеңиз. Ар бир туура орун упай берет.',
      ru: 'На телефоне двигайте события кнопками ↑ ↓, начиная с самого раннего. Каждое событие на своём месте приносит очки.',
      en: 'Move the events with ↑ ↓ on your phone, earliest first. Every event in the right place earns points.'
    },
    teamBased: false,
    needsPhones: true,
    minPlayers: 1,
    /** Игра про историю — в других предметах сортировка идёт в обычном уроке */
    subjects: ['kg-history', 'world-history']
  };

  static questionFilter = (q) => q.type === 'sort';

  /** Сколько событий стоит на своём месте */
  placedRight(value) {
    const items = this.current?.items || [];
    const given = Array.isArray(value) ? value : [];
    return given.filter((pos, i) => items[pos]?.index === i).length;
  }

  /** Частичный порядок тоже приносит очки, полный — ещё и бонус за скорость */
  scoreAnswer({ correct, ms, player, value }) {
    if (correct) return super.scoreAnswer({ correct, ms, player });
    const total = this.current?.items?.length || 1;
    return Math.round((this.placedRight(value) / total) * 60);
  }

  /** Для каждого события — какая доля класса поставила его на своё место */
  placementStats() {
    const items = this.current?.items || [];
    const hits = new Array(items.length).fill(0); // по правильному индексу
    this.answers.forEach((a) => {
      const given = Array.isArray(a.value) ? a.value : [];
      given.forEach((pos, i) => { if (items[pos]?.index === i) hits[i] += 1; });
    });
    return hits;
  }

  renderOptions(container, reveal) {
    const items = this.current?.items || [];

    if (!reveal) {
      // Пока класс думает — перепутанные карточки событий
      container.replaceChildren(
        el('div', { class: 'sort-box' }, items.map((x) => el('div', { class: 'option' }, x.text))),
        el('div', { class: 'muted center full', style: 'margin-top:10px' }, `↕️ 📱 ${t('tl_order_hint')}`)
      );
      return;
    }

    // После ответа — линия времени в правильном порядке
    const answered = Math.max(1, this.answers.size);
    const hits = this.placementStats();
    const ordered = items.slice().sort((a, b) => a.index - b.index);
    let hardest = -1;
    if (this.answers.size) {
      hardest = hits.indexOf(Math.min(...hits));
      if (hits[hardest] === this.answers.size) hardest = -1; // все расставили верно
    }

    container.replaceChildren(
      el('div', { class: 'timeline' }, ordered.map((x, i) => el('div', {
        class: `timeline-item ${hits[i] === this.answers.size && this.answers.size ? 'ok' : ''}`,
        'data-n': String(i + 1)
      },
        el('div', {}, x.text),
        this.answers.size
          ? el('div', { class: 'timeline-hint' }, t('tl_placed', { pct: Math.round((hits[i] / answered) * 100) }))
          : null
      ))),
      hardest >= 0
        ? el('p', { class: 'center full', style: 'margin-top:10px' }, `⚠️ ${t('tl_hardest')}: `, el('b', {}, ordered[hardest].text))
        : null
    );
  }

  statusText() {
    return t('game_waiting_answers', { answered: this.answers.size, total: this.players.size });
  }
}
