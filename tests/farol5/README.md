# Farol 5 tests

- `node --test tests/farol5/acoustic.test.mjs`
- Start Astro on port 4322 and create `output/playwright/`.
- `npx --yes --package @playwright/cli playwright-cli -s=farol5 open http://127.0.0.1:4322/farol5/index.html`
- `npx --yes --package @playwright/cli playwright-cli -s=farol5 run-code --filename tests/farol5/codec.browser.js`
- `npx --yes --package @playwright/cli playwright-cli -s=farol5 run-code --filename tests/farol5/transfer.browser.js`

Browser scripts use the real bundled ggwave encoder/decoder, synthetic camera frames and synthetic PCM delivery to the microphone handler. They do not test room acoustics or physical devices. The end-to-end test checks pause/resume, RGB packet scanning, final confirmation, exact stored bytes, reload restoration and horizontal overflow at desktop/mobile widths. Screenshots go to output/playwright.
