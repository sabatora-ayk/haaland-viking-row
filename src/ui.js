// src/ui.js
// Haaland Viking Row固有のビジュアルUI(タイトルロゴ・スコアボード・
// TAP TO ROWバナー・タップフィードバック・Ballon d'Orフィナーレ演出)を構築する。
// 常設HUD(汎用stat行)やエンド画面のDOM生成はengine/ui-manager.jsに任せず、
// ここで完全にゲーム専用のビジュアルへ差し替える。
// engine/への依存はengine.bus(EventBus)経由の汎用イベント購読のみで、
// engine内部モジュールへは一切直接アクセスしない。

export function buildGameUI(engine, config, uiRoot) {
  const { bus } = engine;
  const text = config.ui.text;
  const visualUi = config.visual.ui;

  // config.ui.colorをCSSカスタムプロパティへ反映(エンド画面等の配色にも使われる)
  if (config.ui.color) {
    uiRoot.style.setProperty('--tap-ui-primary', config.ui.color.primary);
    uiRoot.style.setProperty('--tap-ui-bg', config.ui.color.background);
    uiRoot.style.setProperty('--tap-ui-text', config.ui.color.text);
  }

  const root = document.createElement('div');
  root.className = 'hvr-ui';
  uiRoot.appendChild(root);

  buildTitleLogo(root, visualUi);
  const scoreboard = buildScoreboard(root, text);
  buildTapPrompt(root, visualUi.tapPromptText);
  const flashEl = buildTapFlash(root);
  const ballonDorEl = buildBallonDorBanner(root, visualUi.ballonDorText);

  // スコア表示の更新。engine/ui-manager.jsと同じ汎用イベント'ui:update-stat'を
  // 別の購読者として利用するだけで、engine側には一切手を加えていない。
  bus.on('ui:update-stat', ({ key, value }) => {
    if (key === 'distance') scoreboard.distanceEl.textContent = formatDistance(value);
    if (key === 'combo') scoreboard.comboEl.textContent = `\u00d7${Math.floor(value)}`;
  });

  // ROW POWERバー: 'input:tap'(汎用イベント)から現在のタップ速度を取り、
  // 'render:frame'(汎用イベント)ごとに減衰させて滑らかなゲージにする。
  const maxThreshold = Math.max(...config.unlock.stages.map((s) => s.threshold));
  let currentPower = 0;
  bus.on('input:tap', ({ velocity }) => {
    currentPower = Math.min(velocity / maxThreshold, 1);
  });
  bus.on('render:frame', ({ deltaMs }) => {
    currentPower = Math.max(0, currentPower - deltaMs / 4000);
    scoreboard.powerFillEl.style.width = `${Math.round(currentPower * 100)}%`;
  });

  // タップ時のUIフィードバック(フラッシュ + スコアボードのスケール演出)
  bus.on('input:tap', () => {
    retrigger(flashEl, 'hvr-tap-flash-active');
    retrigger(scoreboard.root, 'hvr-scoreboard-pulse');
  });

  // 最終ステージ到達でBALLON D'OR演出を表示
  const finalStageId = Math.max(...config.unlock.stages.map((s) => s.stageId));
  bus.on('unlock:stage', ({ stageId }) => {
    if (stageId === finalStageId) {
      ballonDorEl.classList.add('hvr-ballon-dor-active');
    }
  });

  // ゲーム終了時は常設UIを控えめにし、エンド画面を見やすくする
  bus.on('game:over', () => {
    root.classList.add('hvr-ui-dimmed');
  });
}

function buildTitleLogo(root, visualUi) {
  const logo = document.createElement('div');
  logo.className = 'hvr-logo';
  logo.innerHTML =
    `<span class="hvr-logo-line1">${visualUi.logoLine1}</span>` +
    `<span class="hvr-logo-line2">${visualUi.logoLine2}</span>`;
  root.appendChild(logo);
}

function buildScoreboard(root, text) {
  const board = document.createElement('div');
  board.className = 'hvr-scoreboard';
  board.innerHTML = `
    <div class="hvr-stat-block">
      <span class="hvr-stat-label">${text.distance}</span>
      <span class="hvr-stat-value" data-role="distance">0 m</span>
    </div>
    <div class="hvr-stat-block hvr-stat-block-combo">
      <span class="hvr-stat-label">${text.combo}</span>
      <span class="hvr-stat-value" data-role="combo">\u00d70</span>
    </div>
    <div class="hvr-power">
      <span class="hvr-power-label">${text.rowPower}</span>
      <div class="hvr-power-bar"><div class="hvr-power-fill" data-role="power-fill"></div></div>
    </div>
  `;
  root.appendChild(board);
  return {
    root: board,
    distanceEl: board.querySelector('[data-role="distance"]'),
    comboEl: board.querySelector('[data-role="combo"]'),
    powerFillEl: board.querySelector('[data-role="power-fill"]')
  };
}

function buildTapPrompt(root, promptText) {
  const prompt = document.createElement('div');
  prompt.className = 'hvr-tap-prompt';
  prompt.textContent = promptText;
  root.appendChild(prompt);
  return prompt;
}

function buildTapFlash(root) {
  const flash = document.createElement('div');
  flash.className = 'hvr-tap-flash';
  root.appendChild(flash);
  return flash;
}

function buildBallonDorBanner(root, bannerText) {
  const banner = document.createElement('div');
  banner.className = 'hvr-ballon-dor';
  banner.textContent = bannerText;
  root.appendChild(banner);
  return banner;
}

function formatDistance(value) {
  return `${Math.floor(value).toLocaleString('en-US')} m`;
}

// CSSアニメーションクラスを一度外して再付与し、再トリガーできるようにする
function retrigger(el, className) {
  el.classList.remove(className);
  void el.offsetWidth; // reflowを強制してアニメーションを再スタートさせる
  el.classList.add(className);
}
