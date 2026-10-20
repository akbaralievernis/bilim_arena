# Библиотеки, которые лежат на самом сайте

Раньше грузились с cdn.jsdelivr.net. В школьных сетях CDN бывает медленным или
закрытым — тогда ученик не мог войти в урок («Загрузка…» висела). Теперь файлы
отдаются с того же сайта и есть в офлайн-кэше (`sw.js`).

| Файл | Откуда | SRI (sha384) |
|---|---|---|
| `peerjs-1.5.5.min.js` | npm `peerjs@1.5.5`, `dist/peerjs.min.js` (MIT, `LICENSE-peerjs`) | `x0YgkOr/3UOZP2CRDxGW9e0Q+2Qjyr3uJrm4xU32Y7ZCNAo7Cc7bjhrZMi/dwczu` |
| `qrcode-generator-1.4.4.js` | npm `qrcode-generator@1.4.4`, `qrcode.js` (MIT, лицензия в заголовке файла) | `8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k` |
| `supabase-js-2.117.3.js` | npm `@supabase/supabase-js@2.117.3`, `dist/umd/supabase.js` (MIT, `LICENSE-supabase-js`) | `BWcjm9OdFth9TbhCxZPdm+gAOUMAzQy9nmTs12ioXdCcbVnJaPMn+fMUoQCLt60R` |
| `canvas-confetti-1.6.0.js` | npm `canvas-confetti@1.6.0`, `dist/confetti.browser.js` (ISC, `LICENSE-canvas-confetti`) | `qmDHVszK26iWDlfhGzXz71t2qRopa/FvIuOkCTJJT4QRkIZf9h+OiJZzco9XtgPX` |

PeerJS и QR байт в байт совпадают с прежними версиями на CDN (те же SRI-хеши в `core/realtime.js`).
Supabase раньше грузился как `+esm` с CDN — теперь тот же выпуск 2.117.3 из npm (хеш в `core/cloud.js`),
конфетти — неминифицированная версия того же выпуска (хеш в `games/citadel/index.html`).
С CDN остаются только библиотеки камеры MediaPipe (вместе с моделями это десятки МБ); при недоступности
игра показывает понятное сообщение.

Шрифты (Inter, Montserrat, JetBrains Mono) — в `assets/fonts/` (SIL OFL 1.1), раньше — Google Fonts.
Обновление: заменить файл, пересчитать хеш (`openssl dgst -sha384 -binary файл | base64`),
поправить имя и хеш там, где файл подключается, и список в `sw.js`.
