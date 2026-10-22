# Промо-ролик «Билим Арена»

| Файл | Что это |
|---|---|
| `bilim-arena-promo-1080p.mp4` | Ролик 1:26, Full HD 1920×1080, без звука (9 МБ) |
| `bilim-arena-promo-720p.mp4` | Тот же ролик в 720p (3,7 МБ) — для мессенджеров |
| `ozvuchka-bilim-arena.txt` | Текст для диктора по сценам с таймкодами (открывается в Блокноте) |
| `ozvuchka-bilim-arena.md` | То же с таблицей сцен, советами по наложению звука и проверкой фактов |
| `bilim-arena-promo.srt` | Субтитры с теми же таймкодами (для CapCut / YouTube) |

После публикации ролик можно смотреть прямо в браузере:
- https://akbaralievernis.github.io/bilim_arena/promo/bilim-arena-promo-1080p.mp4
- https://bilim-arena-theta.vercel.app/promo/bilim-arena-promo-1080p.mp4

Наложить голос одной командой (голос в `voice.mp3`):
`ffmpeg -i bilim-arena-promo-1080p.mp4 -i voice.mp3 -c:v copy -c:a aac -b:a 192k -shortest bilim-arena-promo-voice.mp4`
