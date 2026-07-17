// src/scene.js
// ゲーム画面の実際の描画内容(背景・船・プレイヤー・パーティクル・画面フラッシュ)を定義する。
// TapEngineが提供する汎用API(registerLayer / effect.getCameraOffset / particle.render)
// と、汎用イベント(input:tap / render:frame / effect:trigger / unlock:stage)のみを使用し、
// Haaland/Vikingの見た目などゲーム固有の内容は全てこちらに置く。engine/は一切変更しない。
//
// [ビジュアル実装メモ] 実イラスト素材が無いため、canvasのPath/ベジェ曲線による
// 2Dカートゥーン描画(drawHaalandCharacter)でキャラクターを表現している。
// 将来スプライト画像を導入する場合はこのファイルの描画処理を差し替えるだけでよい。

// --- 2Dカートゥーンキャラクター描画 -----------------------------------------
// [キャラクター改修メモ] 実在人物の写実的再現ではなく、長い金髪・大きく角張った顔・
// 太い眉・眠そうな目・大きな口・怪物的に大きい肩という「特徴の組み合わせ」だけで
// ファンメイド感を出す2Dカートゥーン表現。魔人ブウ的なミーム性は「丸みのある巨大
// シルエット」「頬のピンクハイライト」「ステージ別オーラの色」という抽象化した要素
// のみで取り入れており、衣装・アンテナ・顔そのもののコピーは一切行っていない。
//
// 全ての形状はローカル座標系(原点=肩の中心、上方向がマイナスY)で記述し、
// 呼び出し側でtranslate/scaleして画面上の位置・大きさを決める。
function drawHaalandCharacter(ctx, x, y, scale, opts) {
  const p = opts.palette;
  const { armAngle, hairSway, bobOffset, mood, eyeFlash, auraColor, victoryPose } = opts;

  ctx.save();
  ctx.translate(x, y + bobOffset);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // オーラ(炎・雷・オーロラ・黄金ステージのみ表示。通常時は無し)
  if (auraColor) {
    const aura = ctx.createRadialGradient(0, -14, 4, 0, -14, 50);
    aura.addColorStop(0, auraColor);
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -14, 50, 0, Math.PI * 2);
    ctx.fill();
  }

  // 後ろ髪(肩にかかる長い金髪。左右非対称に揺らす)
  ctx.fillStyle = p.hairShadow;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * 20, -28);
    ctx.quadraticCurveTo(side * (34 + hairSway), 2, side * (26 + hairSway), 28);
    ctx.quadraticCurveTo(side * 16, 20, side * 18, -10);
    ctx.closePath();
    ctx.fill();
  });

  // Ballon d'Orステージ: 反対側の腕を高々と掲げる勝利ポーズ
  if (victoryPose) {
    ctx.strokeStyle = p.skinColor;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(-24, -4);
    ctx.lineTo(-38, -40);
    ctx.stroke();
    ctx.fillStyle = p.skinColor;
    ctx.beginPath();
    ctx.arc(-38, -42, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // 肩・上半身(赤ジャージ。怪物的に大きいシルエット)
  ctx.fillStyle = p.jerseyColor;
  ctx.beginPath();
  ctx.moveTo(-38, 46);
  ctx.quadraticCurveTo(-48, 4, -26, -10);
  ctx.quadraticCurveTo(0, -19, 26, -10);
  ctx.quadraticCurveTo(48, 4, 38, 46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.outlineColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // ジャージのシャドウ(下部の陰影)
  ctx.fillStyle = p.jerseyShadow;
  ctx.beginPath();
  ctx.moveTo(-38, 46);
  ctx.quadraticCurveTo(0, 36, 38, 46);
  ctx.lineTo(34, 32);
  ctx.quadraticCurveTo(0, 22, -34, 32);
  ctx.closePath();
  ctx.fill();

  // 白い差し色ストライプ + 背番号(特定クラブの公式デザインではない汎用配色)
  ctx.strokeStyle = p.jerseyAccent;
  ctx.lineWidth = 3;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * 27, -6);
    ctx.lineTo(side * 31, 42);
    ctx.stroke();
  });
  ctx.fillStyle = p.numberColor;
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('9', 0, 18);

  // オールを持つ腕(既存のオール描画と同じarmAngleで同期させ、漕ぐ動作をつなげる)
  ctx.strokeStyle = p.skinColor;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(26, -4);
  ctx.lineTo(26 + Math.cos(armAngle) * 26, -4 - Math.sin(armAngle) * 26);
  ctx.stroke();

  // 首
  ctx.fillStyle = p.skinColor;
  ctx.fillRect(-9, -18, 18, 16);

  // 頭部(大きく、やや角張った輪郭にすることで怪物的な存在感を出す)
  ctx.fillStyle = p.skinColor;
  ctx.beginPath();
  ctx.moveTo(-26, -22);
  ctx.quadraticCurveTo(-32, -50, 0, -55);
  ctx.quadraticCurveTo(32, -50, 26, -22);
  ctx.quadraticCurveTo(28, 2, 13, 9);
  ctx.quadraticCurveTo(0, 13, -13, 9);
  ctx.quadraticCurveTo(-28, 2, -26, -22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.outlineColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 頬のピンクハイライト(コミカルな怪物感を出す抽象化された演出)
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = p.cheekColor;
  [-18, 18].forEach((cx) => {
    ctx.beginPath();
    ctx.ellipse(cx, -6, 5.5, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // 前髪(横に大きく流れる金髪。ステージ・タップに応じて揺れる)
  ctx.fillStyle = p.hairColor;
  ctx.beginPath();
  ctx.moveTo(-30, -24);
  ctx.quadraticCurveTo(-36, -54, -4, -58);
  ctx.quadraticCurveTo(30, -58, 32, -28);
  ctx.quadraticCurveTo(22 + hairSway, -44, 6, -32);
  ctx.quadraticCurveTo(-4, -48, -15 + hairSway, -32);
  ctx.quadraticCurveTo(-22, -19, -30, -24);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = p.outlineColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 横に長く流れる毛束(サイドに払われた金髪。大きく目立たせる)
  ctx.fillStyle = p.hairColor;
  ctx.beginPath();
  ctx.moveTo(30, -28);
  ctx.quadraticCurveTo(46 + hairSway * 1.4, -14, 37 + hairSway * 1.4, 8);
  ctx.quadraticCurveTo(28, -6, 26, -22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 太い眉(特徴的な要素として強調)
  ctx.fillStyle = p.browColor;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * 21, -26);
    ctx.lineTo(side * 4, -28);
    ctx.lineTo(side * 4, -22);
    ctx.lineTo(side * 20, -20);
    ctx.closePath();
    ctx.fill();
  });

  // 目(眠そう・無表情気味。演出ステージでは強くフラッシュする)
  const eyeH = eyeFlash ? 5.5 : 2.6;
  ctx.fillStyle = eyeFlash ? '#ffffff' : p.eyeColor;
  [-13, 13].forEach((ex) => {
    ctx.beginPath();
    ctx.ellipse(ex, -14, 5.2, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  if (eyeFlash) {
    ctx.fillStyle = auraColor || '#ffd54a';
    [-13, 13].forEach((ex) => {
      ctx.beginPath();
      ctx.arc(ex, -14, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 口(通常時は無表情な一文字、炎/雷/黄金ステージでは力強く開いた口)
  const intense = mood === 'fire' || mood === 'thunder' || mood === 'golden';
  ctx.strokeStyle = p.mouthColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (intense) {
    ctx.moveTo(-10, 2);
    ctx.quadraticCurveTo(0, 11, 10, 2);
    ctx.quadraticCurveTo(0, 4, -10, 2);
    ctx.fillStyle = p.mouthColor;
    ctx.fill();
  } else {
    ctx.moveTo(-9, 2);
    ctx.quadraticCurveTo(0, mood === 'aurora' ? 5 : 3, 9, 2);
    ctx.stroke();
  }

  ctx.restore();
}

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
  let currentTheme = visual.backgroundStages[0]; // background/ship-and-player両レイヤーで共有

  const maxThreshold = Math.max(...config.unlock.stages.map((s) => s.threshold));

  // レイヤー0: 背景(空・山・海・ステージ別演出)
  engine.registerLayer('background', (ctx, dt, w, h) => {
    // タップが無い間は速度を減衰させ、「今の勢い」を疑似的に表現する
    lastVelocity = Math.max(0, lastVelocity - (dt / 1000) * 3);
    const speedRatio = Math.min(lastVelocity / maxThreshold, 1);

    const theme = visual.backgroundStages[unlockedStage] || visual.backgroundStages[0];
    currentTheme = theme;

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

    // オール(木製シャフト): タップ速度に応じて回転速度と振れ幅が増す(漕いでいる感を表現)
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

    // Haaland風2Dカートゥーンキャラクター(顔と上半身を大きく強調)。
    // ステージ解放が進むほどオーラ・表情・スケールが変化し、怪物的な存在感を増す。
    const stageScale = visual.player.stageScale[unlockedStage] ?? 1;
    const playerScale = visual.player.baseScale * stageScale * (1 + speedRatio * 0.06);
    const hairSway = Math.sin(performance.now() / 300) * (2 + speedRatio * 6);
    const bobOffset = Math.sin(performance.now() / 450) * (2 + speedRatio * 3);
    const auraColor = visual.player.auraColors[unlockedStage] || null;
    const mood = currentTheme.mood;
    // キャラクターのローカル座標(26, -4)がオールの持ち手(oarPivot)と一致するよう原点を逆算する
    const charOriginX = oarPivotX - 26 * playerScale;
    const charOriginY = oarPivotY + 4 * playerScale;

    drawHaalandCharacter(ctx, charOriginX, charOriginY, playerScale, {
      armAngle: oarAngle,
      hairSway,
      bobOffset,
      mood,
      eyeFlash: mood === 'thunder',
      auraColor,
      victoryPose: unlockedStage >= 6,
      palette: visual.player
    });
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
