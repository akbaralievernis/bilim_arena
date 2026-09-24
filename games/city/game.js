/**
 * Шаар экономикасы / Экономика города.
 *
 * Учебная цель: бюджет, ограниченные ресурсы и цена выбора.
 * Класс — городской совет. Верные ответы пополняют казну (чем больше
 * доля верных, тем больше дохода). После каждых двух заданий совет
 * голосует, что построить. Денег на всё не хватает — доска показывает
 * «цену выбора»: что можно было построить вместо этого.
 *
 * Здания — данные ниже (BUILDINGS), задания — из банка темы.
 */

import { BaseGame } from '../../core/engine.js';
import { el } from '../../core/ui.js';
import { t, pick } from '../../core/i18n.js';

const L = (ky, ru, en) => ({ ky, ru, en });

/** Здания: стоимость и влияние на город */
export const BUILDINGS = [
  { id: 'school', icon: '🏫', cost: 120, title: L('Мектеп', 'Школа', 'School'), effect: { happiness: 10, education: 1 } },
  { id: 'hospital', icon: '🏥', cost: 150, title: L('Оорукана', 'Больница', 'Hospital'), effect: { happiness: 15 } },
  { id: 'park', icon: '🌳', cost: 80, title: L('Парк', 'Парк', 'Park'), effect: { happiness: 8, ecology: 12 } },
  { id: 'factory', icon: '🏭', cost: 100, title: L('Завод', 'Завод', 'Factory'), effect: { income: 30, ecology: -15 } }
];

/** Сколько заданий между голосованиями совета */
const EVERY = 2;
/** Доход за задание при 100% верных ответов */
const BASE_INCOME = 100;

export default class CityGame extends BaseGame {
  static meta = {
    id: 'city',
    icon: '🏙️',
    title: { ky: 'Шаар экономикасы', ru: 'Экономика города', en: 'City economy' },
    goal: {
      ky: 'Бюджетти пландап, шаарды бүт класс болуп куруу',
      ru: 'Планировать бюджет и всем классом построить город',
      en: 'Plan a budget and build a city together'
    },
    how: {
      ky: 'Туура жооптор казынага киреше алып келет. Ар бир эки тапшырмадан кийин класс эмне курууну добуш менен чечет. Акча баарына жетпейт — туура тандагыла!',
      ru: 'Верные ответы пополняют казну. После каждых двух заданий класс голосует, что построить. Денег на всё не хватит — выбирайте с умом!',
      en: 'Correct answers fill the treasury. After every two tasks the class votes on what to build. There is not enough money for everything — choose wisely!'
    },
    teamBased: false,
    needsPhones: true,
    minPlayers: 1,
    subjects: ['economics', 'finance', 'math'],
    questions: 8
  };

  constructor(ctx) {
    // Задания вперемешку с голосованиями совета: 2 задания → голосование
    const list = [];
    ctx.questions.forEach((q, i) => {
      list.push(q);
      if ((i + 1) % EVERY === 0) list.push(CityGame.voteQuestion(list.length));
    });
    super({ ...ctx, questions: list });
    this.coins = 0;
    this.city = { happiness: 50, ecology: 50, education: 0, income: 0, built: [] };
    this.event = null; // что произошло после последнего раунда
  }

  static voteQuestion(n) {
    return {
      id: `city-vote-${n}`, type: 'choice', vote: true, skill: null,
      prompt: L('Шаардык кеңеш: эмне курабыз?', 'Городской совет: что строим?', 'City council: what do we build?'),
      options: BUILDINGS.map((b) => L(
        `${b.icon} ${b.title.ky} — ${b.cost} 🪙`,
        `${b.icon} ${b.title.ru} — ${b.cost} 🪙`,
        `${b.icon} ${b.title.en} — ${b.cost} 🪙`
      ))
    };
  }

  revealAnswer() {
    if (this.state === 'reveal' || this.state === 'finished') return;
    if (this.current?.vote) this.decide();
    else if (this.current) this.earn();
    super.revealAnswer();
  }

  /** Доход за задание: доля верных ответов класса + доход заводов */
  earn() {
    const ok = [...this.answers.values()].filter((a) => a.correct).length;
    const share = ok / Math.max(1, this.players.size);
    const earned = Math.round(share * BASE_INCOME) + this.city.income;
    this.coins += earned;
    this.event = { type: 'earn', earned, pct: Math.round(share * 100) };
  }

  /** Решение совета: побеждает вариант с большим числом голосов */
  decide() {
    const counts = this.voteCounts();
    const ranked = BUILDINGS.map((b, i) => ({ b, votes: counts[i] || 0 }))
      .filter((x) => x.votes > 0)
      .sort((a, b) => b.votes - a.votes || a.b.cost - b.b.cost);

    if (!ranked.length) { this.event = { type: 'skip' }; return; }
    const { b } = ranked[0];
    const alternative = ranked[1]?.b || null;

    if (this.coins < b.cost) {
      this.event = { type: 'poor', b, need: b.cost - this.coins };
      return;
    }
    this.coins -= b.cost;
    const e = b.effect;
    this.city.happiness = Math.max(0, Math.min(100, this.city.happiness + (e.happiness || 0)));
    this.city.ecology = Math.max(0, Math.min(100, this.city.ecology + (e.ecology || 0)));
    this.city.education += e.education || 0;
    this.city.income += e.income || 0;
    this.city.built.push(b.id);
    this.event = { type: 'built', b, alternative };
  }

  /** Итоговая оценка города: счастье и экология важнее числа зданий */
  get cityScore() {
    return this.city.happiness + this.city.ecology + this.city.built.length * 10;
  }

  buildResults(reason) {
    return {
      ...super.buildResults(reason),
      city: { ...this.city, built: this.city.built.slice(), coins: this.coins, score: this.cityScore }
    };
  }

  /** Голосование совета: варианты с ценой, после — число голосов */
  renderOptions(container, reveal) {
    if (!this.current?.vote) return false;
    const counts = reveal ? this.voteCounts() : null;
    container.replaceChildren(el('div', { class: 'options full' },
      this.current.options.map((text, i) => el('div', {
        class: `option ${reveal && this.event?.b?.id === BUILDINGS[i].id ? (this.event.type === 'built' ? 'correct' : 'wrong') : ''}`
      },
        el('span', { class: 'key', 'aria-hidden': 'true' }, String.fromCharCode(65 + i)),
        el('span', {}, text),
        counts ? el('span', { class: 'line-votes' }, t('eh_votes', { n: counts[i] })) : null
      ))
    ));
    return true;
  }

  renderBoardExtra(container) {
    const lang = this.ctx.lang;
    const reveal = this.state === 'reveal';
    const title = (b) => `${b.icon} ${pick(b.title, lang)}`;

    let note = this.current?.vote ? t('city_vote_hint') : t('city_earn_hint', { n: BASE_INCOME });
    if (reveal && this.event) {
      const e = this.event;
      if (e.type === 'earn') note = t('city_earned', { n: e.earned, pct: e.pct });
      else if (e.type === 'built') {
        note = t('city_built', { name: title(e.b) });
        if (e.alternative) note += ` ${t('city_opportunity', { name: title(e.alternative) })}`;
      } else if (e.type === 'poor') note = t('city_poor', { name: title(e.b), n: e.need });
      else note = t('city_no_votes');
    }

    const skyline = this.city.built.length
      ? this.city.built.map((id) => BUILDINGS.find((b) => b.id === id)?.icon).join(' ')
      : '🏜️';

    container.replaceChildren(el('div', { class: 'city-box' },
      el('div', { class: 'city-skyline', 'aria-label': t('city_buildings') }, skyline),
      el('div', { class: 'city-stats' },
        el('span', {}, `🪙 ${this.coins}`),
        el('span', { title: t('city_happiness') }, `😊 ${this.city.happiness}`),
        el('span', { title: t('city_ecology') }, `🌿 ${this.city.ecology}`),
        this.city.income ? el('span', {}, `🏭 +${this.city.income}`) : null
      ),
      el('p', { class: 'city-note' }, note)
    ));
  }

  statusText() {
    return t('game_waiting_answers', { answered: this.answers.size, total: this.players.size });
  }
}
