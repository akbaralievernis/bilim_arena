/**
 * Bilim Arena — отрисовка заданий всех типов.
 *
 * Один модуль на всю платформу: практика, домашние задания и телефон
 * ученика рисуют задания одинаково. Логика проверки живёт в движке —
 * здесь только интерфейс и сбор ответа.
 *
 * Всё рассчитано на палец: кнопки крупные, hover не обязателен.
 */

import { el } from './ui.js';
import { t } from './i18n.js';

/**
 * @param {HTMLElement} host      — куда рисовать
 * @param {object} q              — game.current (подготовленный вопрос)
 * @param {object} opts
 * @param {function} opts.onAnswer — вызывается с готовым ответом
 * @param {boolean} opts.reveal    — показать правильный ответ
 * @param {*} opts.given           — что ответил ученик
 * @param {boolean} opts.correct   — верен ли его ответ
 */
export function renderQuestion(host, q, { onAnswer, reveal = false, given = null, correct = null } = {}) {
  host.replaceChildren();
  if (!q) return;

  switch (q.type) {
    case 'multiple': return renderMultiple(host, q, { onAnswer, reveal, given });
    case 'input': return renderInput(host, q, { onAnswer, reveal, given, correct });
    case 'match': return renderMatch(host, q, { onAnswer, reveal, given });
    case 'sort': return renderSort(host, q, { onAnswer, reveal, given });
    default: return renderChoice(host, q, { onAnswer, reveal, given });
  }
}

const letter = (i) => String.fromCharCode(65 + i);

// ─── Один правильный ответ (и «поиск ошибки») ─────────────────────────────────

function renderChoice(host, q, { onAnswer, reveal, given }) {
  const box = el('div', { class: 'options' });
  (q.options || []).forEach((text, i) => {
    const isCorrect = reveal && i === q.correctIndex;
    const isWrong = reveal && given !== null && Number(given) === i && i !== q.correctIndex;
    box.append(el('button', {
      class: `option ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`,
      type: 'button',
      disabled: reveal || given !== null,
      onclick: () => onAnswer?.(i)
    },
      el('span', { class: 'key', 'aria-hidden': 'true' }, letter(i)),
      el('span', {}, text)
    ));
  });
  host.append(box);
}

// ─── Несколько правильных ответов ─────────────────────────────────────────────

function renderMultiple(host, q, { onAnswer, reveal, given }) {
  const chosen = new Set(Array.isArray(given) ? given.map(Number) : []);
  const box = el('div', { class: 'options' });

  const redraw = () => {
    box.replaceChildren(...(q.options || []).map((text, i) => {
      const isCorrect = reveal && q.correctSet?.has(i);
      const isWrong = reveal && chosen.has(i) && !q.correctSet?.has(i);
      return el('button', {
        class: `option ${chosen.has(i) ? 'chosen' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`,
        type: 'button',
        disabled: reveal,
        'aria-pressed': String(chosen.has(i)),
        onclick: () => {
          chosen.has(i) ? chosen.delete(i) : chosen.add(i);
          redraw();
        }
      },
        el('span', { class: 'key', 'aria-hidden': 'true' }, chosen.has(i) ? '☑' : '☐'),
        el('span', {}, text)
      );
    }));
  };
  redraw();

  host.append(box);
  if (!reveal) {
    host.append(el('button', {
      class: 'btn primary big block', type: 'button', style: 'margin-top:12px',
      onclick: () => onAnswer?.([...chosen])
    }, `✓ ${t('confirm_choice')}`));
  }
}

// ─── Ввод числа или текста ────────────────────────────────────────────────────

function renderInput(host, q, { onAnswer, reveal, given, correct }) {
  if (reveal) {
    host.append(el('div', { class: 'answer-review' },
      el('div', { class: 'small muted' }, t('results_correct')),
      el('div', { class: 'answer-big', style: correct ? 'color:var(--ok)' : '' }, q.answer?.[0] ?? ''),
      given !== null && given !== undefined
        ? el('div', { class: 'small muted' }, `${t('game_wrong')}: ${given}`)
        : null
    ));
    return;
  }

  const input = el('input', {
    class: 'input',
    id: 'quizInput',
    inputmode: q.numeric ? 'decimal' : 'text',
    autocomplete: 'off',
    style: 'text-align:center;font-size:1.4rem;font-weight:700'
  });
  const send = () => {
    const v = input.value.trim();
    if (v) onAnswer?.(v);
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

  host.append(
    input,
    el('button', { class: 'btn primary big block', type: 'button', style: 'margin-top:12px', onclick: send }, '✓')
  );
  setTimeout(() => input.focus(), 50);
}

// ─── Сопоставление ────────────────────────────────────────────────────────────

function renderMatch(host, q, { onAnswer, reveal, given }) {
  const left = q.pairs?.left || [];
  const right = q.pairs?.right || [];
  const chosen = Array.isArray(given) ? given.slice() : new Array(left.length).fill(null);
  let active = chosen.findIndex((x) => x === null);

  const box = el('div', { class: 'match-box' });

  const redraw = () => {
    box.replaceChildren(
      el('div', { class: 'match-col' }, left.map((text, i) => {
        const pairIndex = chosen[i];
        const isRight = reveal && right[pairIndex]?.index === i;
        return el('button', {
          class: `option match-left ${active === i ? 'chosen' : ''} ${reveal ? (isRight ? 'correct' : 'wrong') : ''}`,
          type: 'button', disabled: reveal,
          onclick: () => { active = i; redraw(); }
        },
          el('span', { class: 'key', 'aria-hidden': 'true' }, letter(i)),
          el('span', {}, text),
          pairIndex !== null && pairIndex !== undefined
            ? el('span', { class: 'match-tag' }, right[pairIndex]?.text ?? '')
            : null
        );
      })),
      el('div', { class: 'match-col' }, right.map((item, j) => {
        const used = chosen.includes(j);
        return el('button', {
          class: `option match-right ${used ? 'chosen' : ''}`,
          type: 'button', disabled: reveal,
          onclick: () => {
            if (active < 0 || active >= left.length) active = chosen.findIndex((x) => x === null);
            if (active < 0) return;
            // один правый элемент — только одной левой строке
            const prev = chosen.indexOf(j);
            if (prev >= 0) chosen[prev] = null;
            chosen[active] = j;
            const next = chosen.findIndex((x) => x === null);
            active = next;
            redraw();
          }
        }, item.text);
      }))
    );
  };
  redraw();
  host.append(box);

  if (reveal) {
    host.append(el('div', { class: 'small muted', style: 'margin-top:8px' },
      left.map((l, i) => `${l} → ${right.find((r) => r.index === i)?.text}`).join(' · ')));
    return;
  }

  host.append(el('button', {
    class: 'btn primary big block', type: 'button', style: 'margin-top:12px',
    onclick: () => {
      if (chosen.some((x) => x === null || x === undefined)) return;
      onAnswer?.(chosen);
    }
  }, `✓ ${t('confirm_choice')}`));
}

// ─── Сортировка и последовательность ──────────────────────────────────────────

function renderSort(host, q, { onAnswer, reveal, given }) {
  const items = q.items || [];
  // порядок — это индексы показанных элементов
  const order = Array.isArray(given) && given.length === items.length
    ? given.slice()
    : items.map((_, i) => i);

  const box = el('div', { class: 'sort-box' });

  const move = (from, to) => {
    if (to < 0 || to >= order.length) return;
    const [x] = order.splice(from, 1);
    order.splice(to, 0, x);
    redraw();
  };

  const redraw = () => {
    box.replaceChildren(...order.map((itemIndex, pos) => {
      const item = items[itemIndex];
      const isRight = reveal && item.index === pos;
      return el('div', { class: `option sort-row ${reveal ? (isRight ? 'correct' : 'wrong') : ''}` },
        el('span', { class: 'key', 'aria-hidden': 'true' }, String(pos + 1)),
        el('span', { style: 'flex:1' }, item.text),
        reveal ? null : el('span', { class: 'sort-buttons' },
          el('button', {
            class: 'btn ghost', type: 'button', 'aria-label': '↑',
            disabled: pos === 0, onclick: () => move(pos, pos - 1)
          }, '↑'),
          el('button', {
            class: 'btn ghost', type: 'button', 'aria-label': '↓',
            disabled: pos === order.length - 1, onclick: () => move(pos, pos + 1)
          }, '↓')
        )
      );
    }));
  };
  redraw();
  host.append(box);

  if (reveal) {
    host.append(el('div', { class: 'small muted', style: 'margin-top:8px' },
      items.slice().sort((a, b) => a.index - b.index).map((x) => x.text).join(' → ')));
    return;
  }

  host.append(el('button', {
    class: 'btn primary big block', type: 'button', style: 'margin-top:12px',
    onclick: () => onAnswer?.(order)
  }, `✓ ${t('confirm_choice')}`));
}
