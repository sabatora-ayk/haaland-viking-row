// src/scene.js
// ゲーム画面の実際の描画内容(背景・船・プレイヤー・パーティクル・画面フラッシュ)を定義する。
// TapEngineが提供する汎用API(registerLayer / effect.getCameraOffset / particle.render)
// と、汎用イベント(input:tap / render:frame / effect:trigger / unlock:stage)のみを使用し、
// Haaland/Vikingの見た目などゲーム固有の内容は全てこちらに置く。engine/は一切変更しない。
//
// [ビジュアル実装メモ] 実イラスト素材が無いため、canvas上で色ブロックを敷き詰める
// 疑似ピクセルアート(drawPixelSprite)でキャラクターを表現している。
// 将来スプライト画像を導入する場合はこのファイルの描画処理を差し替えるだけでよい。

// --- 疑似ピクセルアート用の小さなヘルパー -----------------------------------
// matrixは文字の配列(各行が同じ長さ)。1文字1マスを表し、
// legendでその文字をfillStyleの色にマッピングする。'.' は透明(未描画)。
function drawPixelSprite(ctx, matrix, legend, originX, originY, pixelSize) {
  for (let row = 0; row < matrix.length; row++) {
    const line = matrix[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === '.') continue;
      const color = legend[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        originX + col * pixelSize,
        originY + row * pixelSize,
        pixelSize,
        pixelSize
      );
    }
  }
}

// Haaland風キャラクターのピクセルマトリクス(12列×16行)。
// 実在人物の写真的再現ではなく、長い金髪・大柄なシルエット・
// 赤基調のユニフォームという特徴のみでファンメイド表現する。
const PLAYER_MATRIX = [
  '..HHHHHHHH..',
  '.HHHHHHHHHH.',
  '.HHSSSSSSHH.',
  '.HSSSSSSSSH.',
  '..SSSSSSSS..',
  '..SSSSSSSS..',
  '..JJJJJJJJ..',
  '.JJJJJJJJJJ.',
  'JJJJJJJJJJJJ',
  'JJJJJJJJJJJJ',
  'JJJjjjjJJJJJ',
  '..WWWWWWWW..',
  '..WWWWWWWW..',
  '..SS....SS..',
  '..SS....SS..',
  '..BB....BB..'
];

// 一定間隔で生成する固定スター配列(毎フレーム乱数生成すると点滅してしまうため
// シーン開始時に一度だけ生成し、以降は同じ座標を使い回す)
function createStarField(count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      xRatio: Math.random(),
      yRatio: Math.random() * 0.5,
      size: 1 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2
    });
  }
  return stars;
}

export function registerRenderLayers(engine, config) {
  const { visual } = config;
  const stars = createStarField(60);

  let unlockedStage = 0;
  let lastVelocity = 0; // input:tapイベントから取得する現在のタップ速度(減衰させて使う)
  let flashAlpha = 0;
  let flashColor = 'rgba(255,255,255,0)';

  engine.bus.on('unlock:stage', ({ stageId }) => {
    unlockedStage = stageId;
  });

  engine.bus.on('input:tap', ({ velocity }) => {
    lastVelocity = velocity;
  });

  // camera-system.jsが'effect:trigger'に追加したflashフィールドを読み、
  // 画面フラッシュのアニメーション状態を更新する(engine側はこのフィールドを読まない)
  engine.bus.on('effect:trigger', (payload) => {
    if (payload && payload.flash) {
      flashAlpha = 1;
      flashColor = payload.flash.color;
      flashDurationMs = payload.flash.durationMs || 200;
      flashElapsed = 0;
    }
  });
  let flashDurationMs = 200;
  let flashElapsed = 0;

  const maxThreshold = Math.max(...config.unlock.stages.map((s) => s.threshold));

  // レイヤー0: 背景(空・山・海・ステージ別演出)
  engine.registerLayer('background', (ctx, dt, w, h) => {
    // タップが無い間は速度を減衰させ、「今の勢い」を疑似的に表現する
    lastVelocity = Math.max(0, lastVelocity - (dt / 1000) * 3);
    const speedRatio = Math.min(lastVelocity / maxThreshold, 1);

    const theme = visual.backgroundStages[unlockedStage] || visual.backgroundStages[0];

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, theme.skyTop);
    grad.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 星(オーロラ/Ballon d'Orステージで表示)
    if (theme.mood === 'aurora' || theme.mood === 'golden') {
      stars.forEach((star) => {
        const twinkle = 0.5 + 0.5 * Math.sin(performance.now() / 500 + star.phase);
        ctx.globalAlpha = twinkle * 0.8;
        ctx.fillStyle = visual.starColor;
        ctx.beginPath();
        ctx.arc(star.xRatio * w, star.yRatio * h, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // 山のシルエット(雪化粧付き)
    ctx.fillStyle = visual.mountains;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.55);
    ctx.lineTo(w * 0.2, h * 0.4);
    ctx.lineTo(w * 0.4, h * 0.55);
    ctx.lineTo(w * 0.65, h * 0.35);
    ctx.lineTo(w * 0.85, h * 0.55);
    ctx.lineTo(w, h * 0.5);
    ctx.lineTo(w, h * 0.6);
    ctx.lineTo(0, h * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = visual.mountainSnow;
    [[w * 0.2, h * 0.4], [w * 0.65, h * 0.35]].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 14, py + 16);
      ctx.lineTo(px + 14, py + 16);
      ctx.closePath();
      ctx.fill();
    });

    // 炎ステージ: 船周辺に赤い光暈(グロー)
    if (theme.mood === 'fire') {
      const glow = ctx.createRadialGradient(w * 0.3, h * 0.75, 10, w * 0.3, h * 0.75, 160);
      glow.addColorStop(0, 'rgba(255,110,40,0.35)');
      glow.addColorStop(1, 'rgba(255,110,40,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    // オーロラ(ステージ5以降で表示)
    if (unlockedStage >= 5) {
      ctx.lineWidth = 8;
      visual.auroraColors.forEach((color, i) => {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        const yOffset = h * 0.15 + i * 18;
        ctx.moveTo(0, yOffset);
        for (let x = 0; x <= w; x += 20) {
          ctx.lineTo(x, yOffset + Math.sin(x / 60 + i + performance.now() / 800) * 10);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    // 速度ライン(ステージ2以降、タップ速度に応じて濃くなる)
    if (unlockedStage >= 2 && speedRatio > 0.05) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      const lineCount = Math.floor(6 * speedRatio) + 2;
      for (let i = 0; i < lineCount; i++) {
        const ly = h * 0.15 + ((performance.now() / 6 + i * 47) % (h * 0.5));
        ctx.globalAlpha = 0.3 * speedRatio;
        ctx.beginPath();
        ctx.moveTo(w, ly);
        ctx.lineTo(w - 60 - speedRatio * 60, ly + 10);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // 海
    ctx.fillStyle = theme.sea;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    // 黄金ステージ: 海面に金色のハイライト
    if (theme.mood === 'golden') {
      ctx.fillStyle = 'rgba(255,213,74,0.12)';
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
    }
  }, 0);

  // レイヤー1: 船とプレイヤー(カメラ揺れを適用)
  engine.registerLayer('ship-and-player', (ctx, dt, w, h) => {
    const offset = engine.effect.getCameraOffset();
    ctx.translate(offset.x, offset.y);

    const speedRatio = Math.min(lastVelocity / maxThreshold, 1);
    const shipX = w * 0.3;
    const shipY = h * 0.75;
    const shipW = visual.ship.width;
    const shipH = visual.ship.height;

    // 航跡(水しぶきの帯)。速度が高いほど長く濃くなる
    ctx.strokeStyle = visual.ship.wakeColor;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = (0.4 - i * 0.1) * (0.3 + speedRatio * 0.7);
      ctx.beginPath();
      ctx.moveTo(shipX - shipW / 2, shipY + shipH - 4 + i * 5);
      ctx.quadraticCurveTo(
        shipX - shipW / 2 - 40 - speedRatio * 60,
        shipY + shipH + 6 + i * 5,
        shipX - shipW / 2 - 90 - speedRatio * 120,
        shipY + shipH - 2 + i * 5
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 船体(木製ロングシップ。底面を少し湾曲させる)
    ctx.fillStyle = visual.ship.hullDarkColor;
    ctx.beginPath();
    ctx.moveTo(shipX - shipW / 2, shipY + shipH * 0.4);
    ctx.quadraticCurveTo(shipX, shipY + shipH * 1.3, shipX + shipW / 2, shipY + shipH * 0.4);
    ctx.lineTo(shipX + shipW / 2, shipY);
    ctx.lineTo(shipX - shipW / 2, shipY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = visual.ship.hullColor;
    ctx.fillRect(shipX - shipW / 2, shipY - shipH * 0.35, shipW, shipH * 0.5);

    // 甲板の板目(横線)
    ctx.strokeStyle = visual.ship.hullDarkColor;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(shipX - shipW / 2, shipY - shipH * 0.35 + i * (shipH * 0.5) / 4);
      ctx.lineTo(shipX + shipW / 2, shipY - shipH * 0.35 + i * (shipH * 0.5) / 4);
      ctx.stroke();
    }

    // 盾(バイキング船側面の飾り。赤・白・金を交互に)
    const shieldCount = 6;
    for (let i = 0; i < shieldCount; i++) {
      const sx = shipX - shipW / 2 + shipW * ((i + 0.5) / shieldCount);
      ctx.fillStyle = visual.ship.shieldColors[i % visual.ship.shieldColors.length];
      ctx.beginPath();
      ctx.arc(sx, shipY - shipH * 0.42, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // 船首のドラゴンヘッド
    const bowX = shipX + shipW / 2;
    const bowY = shipY - shipH * 0.1;
    ctx.fillStyle = visual.ship.dragonColor;
    ctx.beginPath();
    ctx.moveTo(bowX, bowY);
    ctx.quadraticCurveTo(bowX + 34, bowY - 30, bowX + 14, bowY - 46);
    ctx.quadraticCurveTo(bowX + 4, bowY - 30, bowX, bowY - shipH * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = visual.ship.dragonEyeColor;
    ctx.beginPath();
    ctx.arc(bowX + 18, bowY - 30, 3, 0, Math.PI * 2);
    ctx.fill();

    // オール: タップ速度に応じて回転速度と振れ幅が増す(漕いでいる感を表現)
    const oarSpeed = 4 + speedRatio * 18;
    const oarAngle = Math.sin(performance.now() / (1000 / oarSpeed)) * (0.5 + speedRatio * 0.5);
    const oarPivotX = shipX;
    const oarPivotY = shipY - shipH * 0.1;
    ctx.strokeStyle = visual.ship.oarColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(oarPivotX, oarPivotY);
    ctx.lineTo(oarPivotX + Math.cos(oarAngle) * 56, oarPivotY - Math.sin(oarAngle) * 56 - 10);
    ctx.stroke();

    // プレイヤー(疑似ピクセルアート。高速時はわずかに拡大して迫力を出す)
    const pixelSize = visual.player.pixelSize * (1 + speedRatio * 0.15);
    const playerW = PLAYER_MATRIX[0].length * pixelSize;
    const playerH = PLAYER_MATRIX.length * pixelSize;
    const legend = {
      H: visual.player.hairColor,
      S: visual.player.skinColor,
      J: visual.player.jerseyColor,
      j: visual.player.jerseyShadow,
      W: visual.player.shortsColor,
      B: visual.player.bootsColor
    };
    drawPixelSprite(ctx, PLAYER_MATRIX, legend, oarPivotX - playerW / 2, oarPivotY - playerH + 6, pixelSize);
  }, 1);

  // レイヤー2: パーティクル
  engine.registerLayer('particles', (ctx) => {
    engine.particle.render(ctx);
  }, 2);

  // レイヤー3: 画面フラッシュ(炎/雷/Ballon d'Or演出でcamera-system.jsが発火)
  engine.registerLayer('flash', (ctx, dt, w, h) => {
    if (flashAlpha <= 0) return;
    flashElapsed += dt;
    const p = Math.min(flashElapsed / flashDurationMs, 1);
    flashAlpha = 1 - p;
    if (p >= 1) flashAlpha = 0;

    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = flashColor;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }, 3);
}
