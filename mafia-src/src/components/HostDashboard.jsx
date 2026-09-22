import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { SkipForward, Mic, Eye, Users, Shield, Heart, Zap, Crosshair, Sparkles } from 'lucide-react';
import PlayerCard from './PlayerCard';
import { useTranslation, roleName as tRole, getLanguage } from '../utils/i18n';

/** Текст, который ведущий читает вслух. Ключи берутся из фазы игры. */
const SCRIPTS = {
  ky: {
    night_start: { narrative: 'Түн кирди. Шаар уйкуга кетти.', instruction: 'Айтыңыз: «Шаар уктайт...»' },
    putana: { narrative: 'Гипнозчу ойгонду. Ал бул түнү кимди уктатат?', instruction: 'Айтыңыз: «Гипнозчу ойгонсун».' },
    don: { narrative: 'Мафиянын Дону ойгонду. Ал Комиссарды издейт.', instruction: 'Айтыңыз: «Дон ойгонсун».' },
    mafia: { narrative: 'Мафия аңчылыкка чыкты. Алар кимди тандайт?', instruction: 'Айтыңыз: «Мафия ойгонсун».' },
    doctor: { narrative: 'Дарыгер ойгонду. Ал кимди сактап калат?', instruction: 'Айтыңыз: «Дарыгер ойгонсун».' },
    bodyguard: { narrative: 'Сакчы кароолго чыкты. Ал кимди коргойт?', instruction: 'Айтыңыз: «Сакчы ойгонсун».' },
    detective: { narrative: 'Комиссар ойгонду. Ал кимди текшерет?', instruction: 'Айтыңыз: «Комиссар ойгонсун».' },
    maniac: { narrative: 'Маньяк көлөкөдөн чыкты. Кийинки курмандык ким?', instruction: 'Айтыңыз: «Маньяк ойгонсун».' },
    day_discussion: { narrative: 'Таң атты. Шаар ойгонду. Ким ойгонбой калганын көрөлү...', instruction: 'Түндүн жыйынтыгын айтып, талкууну баштаңыз.' },
    voting: { narrative: 'Адилеттиктин убагы келди. Шаар чечим чыгарсын.', instruction: 'Добуш берүүнү баштаңыз.' },
    end: { narrative: 'Оюн бүттү. Жеңүүчүлөр белгилүү болду.', instruction: 'Жыйынтыкты жарыялап, жеңүүчүлөрдү куттуктаңыз!' }
  },
  ru: {
    night_start: { narrative: 'Наступает ночь. Весь город засыпает.', instruction: 'Озвучьте: «Город засыпает...»' },
    putana: { narrative: 'Просыпается Гипнотизёр. Кого он усыпит этой ночью?', instruction: 'Озвучьте: «Гипнотизёр просыпается...»' },
    don: { narrative: 'Просыпается Дон мафии. Он ищет комиссара.', instruction: 'Озвучьте: «Дон просыпается...»' },
    mafia: { narrative: 'Мафия выходит на охоту. Кого они уберут?', instruction: 'Озвучьте: «Мафия просыпается...»' },
    doctor: { narrative: 'Просыпается Доктор. Кого он будет лечить?', instruction: 'Озвучьте: «Доктор просыпается...»' },
    bodyguard: { narrative: 'Телохранитель выходит на патруль. Кого он защитит?', instruction: 'Озвучьте: «Телохранитель просыпается...»' },
    detective: { narrative: 'Просыпается Комиссар. Кого он проверит?', instruction: 'Озвучьте: «Комиссар просыпается...»' },
    maniac: { narrative: 'Маньяк выходит из тени. Кто станет жертвой?', instruction: 'Озвучьте: «Маньяк просыпается...»' },
    day_discussion: { narrative: 'Наступило утро. Посмотрим, кто не проснулся...', instruction: 'Озвучьте результаты ночи и начните обсуждение.' },
    voting: { narrative: 'Пришло время правосудия. Городу пора сделать выбор.', instruction: 'Начните голосование.' },
    end: { narrative: 'Игра окончена. Победители определены.', instruction: 'Озвучьте итоги и поздравьте победителей!' }
  }
};

const HostDashboard = ({ gameState, socket }) => {
  const { t, lang } = useTranslation();
  const { phase, subPhase, players, alivePlayers, roles, round } = gameState;
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => localStorage.getItem('mafia_host_voice') !== 'off');

  const scripts = SCRIPTS[lang] || SCRIPTS.ky;

  const currentData = useMemo(() => {
    if (phase === 'night') return scripts[subPhase] || scripts.night_start;
    if (phase === 'day') return scripts.day_discussion;
    if (phase === 'vote') return scripts.voting;
    if (phase === 'end') return scripts.end;
    return { narrative: '...', instruction: '' };
  }, [phase, subPhase, scripts]);

  /** Озвучка текста ведущего. Кыргызского голоса в браузерах почти нет —
   *  тогда берём русский, он читает кириллицу достаточно понятно. */
  const speak = useCallback((text) => {
    if (!isVoiceEnabled || !window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();
    const wanted = getLanguage() === 'de' ? 'de' : getLanguage() === 'ru' ? 'ru' : 'ky';
    const pick = voices.find((v) => v.lang?.toLowerCase().startsWith(wanted))
      || voices.find((v) => v.lang?.toLowerCase().startsWith('ru'))
      || voices.find((v) => v.lang?.toLowerCase().startsWith('tr'));

    const u = new SpeechSynthesisUtterance(text);
    if (pick) { u.voice = pick; u.lang = pick.lang; }
    u.rate = 0.9;
    u.pitch = 0.85;
    window.speechSynthesis.speak(u);
  }, [isVoiceEnabled]);

  useEffect(() => {
    if (currentData?.narrative && currentData.narrative !== '...') speak(currentData.narrative);
  }, [currentData, speak]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const handleAdvance = () => {
    if (phase === 'night') socket.emit('host_advance_night');
    else if (phase === 'day') socket.emit('host_start_voting');
    else if (phase === 'vote') socket.emit('host_end_day');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'mafia': return <Zap size={15} color="var(--accent-red)" />;
      case 'don': return <Shield size={15} color="var(--accent-red)" />;
      case 'doctor': return <Heart size={15} color="var(--accent-blue)" />;
      case 'detective': return <Eye size={15} color="var(--accent-blue)" />;
      case 'putana': return <Sparkles size={15} color="var(--accent-purple)" />;
      case 'maniac': return <Crosshair size={15} color="var(--accent-red)" />;
      default: return null;
    }
  };

  const advanceLabel = phase === 'night' ? t('host_next_role') : phase === 'day' ? t('host_start_vote') : t('host_end_day');

  return (
    <div className="host-dashboard">
      <div className="glass-panel host-panel">
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-purple)' }}>{t('host_panel')}</h2>
          <p className="text-secondary">{t('round')} {round}</p>
        </div>

        <div className="script-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Mic size={18} color="var(--accent-purple)" />
            <label style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isVoiceEnabled}
                onChange={(e) => {
                  setIsVoiceEnabled(e.target.checked);
                  localStorage.setItem('mafia_host_voice', e.target.checked ? 'on' : 'off');
                  if (!e.target.checked) window.speechSynthesis?.cancel();
                }}
              />
              {t('host_autovoice')}
            </label>
          </div>
          <p style={{ fontStyle: 'italic', fontSize: '1.05rem', lineHeight: 1.4, marginBottom: '8px' }}>{currentData.narrative}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>🔔 {currentData.instruction}</p>
        </div>

        <button className="btn-primary host-advance" onClick={handleAdvance}>
          <SkipForward size={20} /> {advanceLabel}
        </button>

        <div>
          <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
            <Users size={17} /> {t('host_players_status')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {players.filter((p) => !p.isHost).map((p) => {
              const isAlive = alivePlayers.includes(p.id);
              return (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', opacity: isAlive ? 1 : 0.5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{p.name} {getRoleIcon(roles[p.id])}</span>
                  <span style={{ color: isAlive ? 'var(--accent-blue)' : 'var(--accent-red)' }}>
                    {isAlive ? t('host_alive') : t('host_dead')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="host-view-area">
        <div className="host-view-head">
          <h3 style={{ fontSize: '1.2rem' }}>
            {phase === 'night' ? `🌙 ${t('phase_night')}` : phase === 'vote' ? `⚖️ ${t('phase_vote')}` : `☀️ ${t('phase_day')}`}
            {subPhase && ` — ${tRole(subPhase)}`}
          </h3>
          <div className="host-pill">👥 {alivePlayers.length} {t('host_in_game')}</div>
        </div>

        <div className="grid-players">
          {players.filter((p) => !p.isHost).map((p, index) => {
            const shownRole = roles[p.id];
            return (
              <PlayerCard
                key={p.id}
                player={p}
                index={index}
                isDead={!alivePlayers.includes(p.id)}
                isSelected={false}
                onSelect={() => {}}
                canSelect={false}
                roleName={shownRole ? tRole(shownRole) : null}
                roleKey={shownRole}
                isHostView
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
