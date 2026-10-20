# Библиотеки, которые лежат на самом сайте

Раньше грузились с cdn.jsdelivr.net. В школьных сетях CDN бывает медленным или
закрытым — тогда ученик не мог войти в урок («Загрузка…» висела). Теперь файлы
отдаются с того же сайта и есть в офлайн-кэше (`sw.js`).

| Файл | Откуда | SRI (sha384) |
|---|---|---|
| `peerjs-1.5.5.min.js` | npm `peerjs@1.5.5`, `dist/peerjs.min.js` (MIT, `LICENSE-peerjs`) | `x0YgkOr/3UOZP2CRDxGW9e0Q+2Qjyr3uJrm4xU32Y7ZCNAo7Cc7bjhrZMi/dwczu` |
| `qrcode-generator-1.4.4.js` | npm `qrcode-generator@1.4.4`, `qrcode.js` (MIT, лицензия в заголовке файла) | `8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k` |

Файлы байт в байт совпадают с прежними версиями на CDN (те же SRI-хеши в `core/realtime.js`).
Обновление: заменить файл, пересчитать хеш (`openssl dgst -sha384 -binary файл | base64`),
поправить имя и хеш в `core/realtime.js` и список в `sw.js`.
