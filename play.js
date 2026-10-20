/**
 * Bilim Arena — телефон ученика как контроллер.
 *
 * Телефон не содержит игровой логики: он показывает экран, который прислала
 * доска, и отправляет ответ обратно. Благодаря этому один контроллер
 * обслуживает все игры платформы.
 */

import { bootstrap, el, $, toast, sfx } from './core/ui.js';
import { icon } from './core/icons.js';
import { t } from './core/i18n.js';
import { joinRoom, normalizeRoomCode } from './core/realtime.js';
import { RACE_CODE_LENGTH, isRaceCode, raceUrl } from './core/race.js';
import { getProfile, quickJoinProfile } from './core/profile.js';
import { store } from './core/store.js';
import { recordAnswer } from './core/progress.js';
import { renderQuestion } from './core/quiz-ui.js';
import { mergeAssignments, packSubmissions } from './core/sync.js';

const conn = { room: null, joining: false, spec: null, topic: null };

// ─── Отрисовка экрана, присланного доской ─────────────────────────────────────

/** Бланк обвинения тот же (подозреваемые, улики, сколько нужно) */
const accuseSig = (spec) => JSON.stringify([spec.required, spec.suspects?.map((x) => x.id), spec.clues?.map((x) => x.id)]);

function render(spec) {
  // Доска рассылает обновление всем, когда кто-то отправил обвинение. Если бланк
  // у этого ученика тот же и ещё не отправлен — не пересобираем: иначе сбросился бы
  // уже сделанный выбор подозреваемого и улик.
  if (spec?.screen === 'accuse' && !spec.sent && conn.accuseSig === accuseSig(spec) && $('#optionsBox').childElementCount) {
    conn.spec = spec;
    return;
  }
  conn.accuseSig = spec?.screen === 'accuse' && !spec.sent ? accuseSig(spec) : null;
  conn.spec = spec;
  const status = $('#statusBox');
  const options = $('#optionsBox');
  const inputBox = $('#inputBox');

  options.replaceChildren();
  options.classList.add('hidden');
  inputBox.classList.add('hidden');

  if (spec.score !== undefined) $('#scoreLabel').textContent = `${spec.score} ${t('points')}`;
  if (spec.team) {
    $('#teamLabel').textContent = spec.team === 'A' ? t('board_team_a') : t('board_team_b');
    $('#teamLabel').className = `small team-badge team-${spec.team.toLowerCase()}`;
  }

  switch (spec.screen) {
    case 'answer': {
      status.replaceChildren(...[
        spec.clue ? el('div', { class: 'chip on' }, `${spec.clue.title}`) : null,
        el('div', { class: 'small muted' }, `${spec.number} / ${spec.total}`),
        el('h2', {}, spec.prompt),
        spec.hasImage ? el('div', { class: 'chip' }, t('img_on_board')) : null
      ].filter(Boolean));
      $('#footHint').textContent = t('game_time') + ': ' + (spec.timeLeft ?? '');

      // Все типы заданий рисует общий модуль — телефон не знает логики проверки
      options.classList.remove('hidden');
      renderQuestion(options, spec, { onAnswer: (value) => sendAnswer(value) });
      break;
    }

    case 'accuse': {
      // Бланк обвинения: подозреваемый + минимум N улик.
      // Перерисовываем только состояние кнопок, чтобы не терять прокрутку.
      if (spec.sent) {
        status.replaceChildren(
          el('div', { class: 'big-icon' }, icon('hourglass', { size: 44 })),
          el('h2', {}, t('join_answer_sent'))
        );
        $('#footHint').textContent = t('inv_accuse');
        break;
      }

      const chosen = { suspect: null, clues: new Set() };

      status.replaceChildren(
        el('div', { class: 'big-icon' }, icon('lens', { size: 44 })),
        el('h2', {}, t('inv_accuse')),
        el('p', { class: 'small muted' }, t('inv_accuse_hint', { n: spec.required }))
      );

      const sendBtn = el('button', {
        class: 'btn primary big block', type: 'button', style: 'margin-top:12px', disabled: true,
        onclick: () => {
          if (!chosen.suspect || chosen.clues.size < spec.required) return;
          conn.room?.send({ type: 'accuse', suspect: chosen.suspect, clues: [...chosen.clues] });
          sfx.tap();
          render({ screen: 'sent', score: spec.score });
        }
      }, `${t('confirm_choice')}`);

      const refresh = () => {
        sendBtn.disabled = !chosen.suspect || chosen.clues.size < spec.required;
        sendBtn.textContent = chosen.clues.size < spec.required
          ? `${chosen.clues.size}/${spec.required} · ${t('inv_evidence')}`
          : `${t('confirm_choice')}`;
      };

      const suspectBtns = spec.suspects.map((s) => el('button', {
        class: 'option', type: 'button', 'aria-pressed': 'false',
        onclick: (e) => {
          chosen.suspect = s.id;
          suspectBtns.forEach((b) => { b.classList.remove('chosen'); b.setAttribute('aria-pressed', 'false'); });
          e.currentTarget.classList.add('chosen');
          e.currentTarget.setAttribute('aria-pressed', 'true');
          refresh();
        }
      },
        el('span', { class: 'key', 'aria-hidden': 'true' }, s.letter),
        el('span', {}, `${s.emoji} ${s.name}`)
      ));

      const clueBtns = spec.clues.map((c) => {
        const mark = el('span', { class: 'key check-mark', 'aria-hidden': 'true' });
        return el('button', {
          class: 'option', type: 'button', 'aria-pressed': 'false',
          onclick: (e) => {
            const on = chosen.clues.has(c.id);
            if (on) chosen.clues.delete(c.id); else chosen.clues.add(c.id);
            e.currentTarget.classList.toggle('chosen', !on);
            e.currentTarget.setAttribute('aria-pressed', String(!on));
            mark.replaceChildren(...(on ? [] : [icon('check', { size: 18 })]));
            refresh();
          }
        }, mark, el('span', {}, `${c.title}`));
      });

      options.classList.remove('hidden');
      options.replaceChildren(
        el('div', { class: 'label' }, t('inv_suspects')),
        ...suspectBtns,
        el('div', { class: 'label', style: 'margin-top:10px' }, t('inv_evidence')),
        ...clueBtns,
        sendBtn
      );
      refresh();
      $('#footHint').textContent = t('inv_accuse');
      break;
    }

    case 'sent':
      status.replaceChildren(
        el('div', { class: 'big-icon' }, icon('hourglass', { size: 44 })),
        el('h2', {}, t('join_answer_sent')),
        el('p', { class: 'muted' }, t('join_look_at_board'))
      );
      $('#footHint').textContent = t('board_waiting');
      break;

    case 'reveal': {
      const ok = spec.correct === true;
      const miss = spec.correct === false;
      status.replaceChildren(...[
        el('div', { class: `big-icon ${ok ? 'ok' : miss ? 'bad' : ''}` }, icon(ok ? 'check' : miss ? 'close' : 'eye', { size: 44 })),
        el('h2', {}, ok ? t('game_correct') : miss ? t('game_wrong') : ''),
        miss && spec.correctText ? el('p', {}, `${t('game_correct_answer')}: `, el('b', {}, spec.correctText)) : null,
        spec.explain ? el('p', { class: 'small muted' }, `${spec.explain}`) : null
      ].filter(Boolean));
      if (ok) sfx.ok(); else if (miss) sfx.bad();
      $('#footHint').textContent = t('join_look_at_board');
      break;
    }

    case 'end':
      status.replaceChildren(
        el('div', { class: 'big-icon' }, icon('flag', { size: 44 })),
        el('h2', {}, t('results_title')),
        el('div', { class: 'answer-big' }, `${spec.correct}/${spec.total}`),
        el('p', { class: 'muted' }, `${spec.score} ${t('points')}`)
      );
      $('#footHint').textContent = t('results_title');
      break;

    default:
      status.replaceChildren(
        el('div', { class: 'big-icon' }, icon('hourglass', { size: 44 })),
        el('h2', {}, t('join_waiting')),
        el('p', { class: 'muted' }, t('join_look_at_board'))
      );
      $('#footHint').textContent = t('join_connected');
  }
}

// ─── Отправка ответа ──────────────────────────────────────────────────────────

function sendAnswer(value) {
  if (!conn.room) return;
  sfx.tap();
  conn.room.send({ type: 'answer', value });
  // Мгновенная реакция, не дожидаясь ответа доски
  render({ screen: 'sent', score: conn.spec?.score });
  if (navigator.vibrate && navigator.userActivation?.hasBeenActive) navigator.vibrate(20);
}

// ─── Синхронизация домашних заданий через урок ────────────────────────────────

async function syncWithTeacher(payload) {
  const added = await mergeAssignments(payload);
  if (added) toast(t('sync_new_tasks', { n: added }), { icon: '📝' });
  const profile = await getProfile();
  const submissions = await packSubmissions(profile.id);
  if (submissions.length) conn.room?.send({ type: 'sync-submissions', submissions });
}

// ─── Подключение ──────────────────────────────────────────────────────────────

async function connect(code, name) {
  // Повторный вход (двойное нажатие, автоподключение по ссылке) игнорируем:
  // два подключения одного игрока выбивали бы друг друга
  if (conn.room || conn.joining) return;
  conn.joining = true;
  const btn = $('#joinBtn');
  btn.disabled = true;
  btn.textContent = t('loading');
  $('#joinError').textContent = '';

  try {
    const saved = await store.get('play_player_id');
    const savedSecret = await store.get('play_player_secret');
    conn.room = await joinRoom({
      code, name,
      server: new URLSearchParams(location.search).get('s'),
      playerId: saved,
      secret: savedSecret,
      onMessage: (msg) => {
        if (msg.type === 'screen') render(msg.spec);
        if (msg.type === 'name' && typeof msg.name === 'string') {
          // Такое имя уже есть в классе — доска дала номер, чтобы ответы не смешались
          conn.assignedName = msg.name.slice(0, 24);
          $('#playerName').textContent = conn.assignedName;
          toast(t('join_renamed', { name: conn.assignedName, requested: String(msg.requested || '').slice(0, 24) }), { icon: '👥', ms: 8000 });
        }
        if (msg.type === 'sync-assignments') syncWithTeacher(msg);
        if (msg.type === 'result' && msg.topic && msg.skill) {
          // Доска сообщила результат ответа — сохраняем его в прогрессе ученика
          recordAnswer({
            topic: msg.topic, skill: msg.skill, correct: !!msg.correct,
            questionId: msg.questionId, gameId: msg.gameId
          });
        }
      },
      onStatus: (s) => {
        // Пока ищем доску — кнопка говорит, что происходит, а не просто «Загрузка…»
        if (s === 'searching' || s === 'retrying') { btn.textContent = t(s === 'retrying' ? 'join_retrying' : 'join_searching'); return; }
        $('#connDot').classList.toggle('off', s !== 'online');
        if (s === 'offline') toast(t('join_lost'), { icon: '🔌' });
      }
    });

    await store.set('play_player_id', conn.room.playerId);
    await store.set('play_player_secret', conn.room.secret);
    await store.set('play_last_room', code);
    await quickJoinProfile(name);

    $('#connDot').classList.remove('off');
    $('#playerName').textContent = conn.assignedName || name;
    $('#joinScreen').classList.add('hidden');
    $('#gameScreen').classList.remove('hidden');
    render({ screen: 'wait' });
    toast(t('join_connected'), { icon: '✅' });
  } catch (e) {
    const key = {
      'room-not-found': 'err_room_not_found',
      'room-not-found-or-network': 'err_room_unsure',
      'connect-timeout': 'err_connect_slow'
    }[e?.message] || 'err_no_connection';
    console.warn('[join]', e?.message || e);
    $('#joinError').textContent = t(key, { code });
  } finally {
    conn.joining = false;
    btn.disabled = false;
    btn.textContent = t('join_button');
  }
}

// ─── Запуск ───────────────────────────────────────────────────────────────────

(async function init() {
  await bootstrap();
  $('#joinIcon')?.replaceChildren(icon('join', { size: 44 }));

  const params = new URLSearchParams(location.search);
  const codeFromUrl = normalizeRoomCode(params.get('room'));
  const profile = await getProfile();

  if (codeFromUrl) $('#codeInput').value = codeFromUrl;
  if (profile.name) $('#nameInput').value = profile.name;
  $('#playerName').textContent = profile.name || '—';

  const tryJoin = () => {
    const code = normalizeRoomCode($('#codeInput').value);
    const name = $('#nameInput').value.trim();
    if (!code) return ($('#joinError').textContent = t('err_enter_code'));
    // 6 символов — это не урок на доске, а Bilim Arena Race: ведём туда, имя спросит гонка
    if (code.length === RACE_CODE_LENGTH) {
      if (!isRaceCode(code)) return ($('#joinError').textContent = t('race_code_invalid'));
      location.href = raceUrl('/join', { code });
      return;
    }
    if (!name) return ($('#joinError').textContent = t('err_enter_name'));
    connect(code, name);
  };

  $('#joinBtn').addEventListener('click', tryJoin);
  // Кнопка оживает, только когда страница готова: на медленном телефоне
  // нажатие до загрузки скриптов иначе просто терялось бы
  $('#joinBtn').disabled = false;
  $('#nameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryJoin(); });
  $('#codeInput').addEventListener('input', (e) => {
    // Кириллица «К7МА» → латиница «K7MA»: раньше такие буквы молча удалялись
    e.target.value = normalizeRoomCode(e.target.value);
  });

  $('#sendAnswerBtn').addEventListener('click', () => {
    const v = $('#answerInput').value.trim();
    if (v) sendAnswer(v);
  });
  $('#answerInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#sendAnswerBtn').click();
  });

  // Если и код, и имя уже известны — подключаемся сразу
  if (codeFromUrl && profile.name && codeFromUrl.length !== RACE_CODE_LENGTH) connect(codeFromUrl, profile.name);

  window.addEventListener('pagehide', () => conn.room?.close());
})();
