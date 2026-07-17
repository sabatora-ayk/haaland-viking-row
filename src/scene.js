// src/scene.js
// ゲーム画面の実際の描画内容（背景・船・プレイヤー・パーティクル）を定義する。
// TapEngineが提供する汎用API（registerLayer / effect.getCameraOffset / particle.render）
// のみを使用し、Vikingの見た目などゲーム固有の内容はこちらに置く。
//
// [MVP実装メモ] 実素材（イラスト）が無いため、canvasのプリミティブ図形で
// 簡易的にキャラクター・船を表現している。config.visualの値を差し替えれば
// 色やサイズは変わるが、将来的にスプライト画像へ移行する場合は
// このファイルの描画処理を差し替えるだけでよく、engine側の変更は不要。

export function registerRenderLayers(engine, config) {
  const { visual } = config;
  let unlockedStage = 0;

  engine.bus.on('unlock:stage', ({ stageId }) => {
    unlockedStage = stageId;
  });

  // レイヤー0: 背景（空・山・海・オーロラ）
  engine.registerLayer('background', (ctx, dt, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, visual.background.skyTop);
    grad.addColorStop(1, visual.background.skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 山のシルエット
    ctx.fillStyle = visual.background.mountains;
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

    // オーロラ（一定ステージ解放後のみ表示）
    if (unlockedStage >= visual.background.auroraStartStage) {
      ctx.lineWidth = 8;
      visual.background.auroraColors.forEach((color, i) => {
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.25;
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

    // 海
    ctx.fillStyle = visual.background.sea;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
  }, 0);

  // レイヤー1: 船とプレイヤー（カメラ揺れを適用）
  engine.registerLayer('ship-and-player', (ctx, dt, w, h) => {
    const offset = engine.effect.getCameraOffset();
    ctx.translate(offset.x, offset.y);

    const shipX = w * 0.3;
    const shipY = h * 0.75;

    // 船体
    ctx.fillStyle = visual.ship.color;
    ctx.fillRect(shipX - visual.ship.width / 2, shipY, visual.ship.width, visual.ship.height);

    // オール（時間ベースの簡易アニメーション。将来的にタップ速度連動へ拡張可能）
    const oarAngle = Math.sin(performance.now() / 150) * 0.6;
    ctx.strokeStyle = visual.ship.color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(shipX, shipY);
    ctx.lineTo(shipX + Math.cos(oarAngle) * 50, shipY - Math.sin(oarAngle) * 50);
    ctx.stroke();

    // プレイヤー（円+四角の簡易ファンアート風キャラクター。実在選手を直接模写しない）
    const px = shipX;
    const py = shipY - 30;
    ctx.fillStyle = visual.player.bodyColor;
    ctx.fillRect(px - 14, py - 10, 28, 34);
    ctx.fillStyle = visual.player.skinColor;
    ctx.beginPath();
    ctx.arc(px, py - 20, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = visual.player.hairColor;
    ctx.beginPath();
    ctx.arc(px, py - 26, 12, Math.PI, 0);
    ctx.fill();
  }, 1);

  // レイヤー2: パーティクル
  engine.registerLayer('particles', (ctx) => {
    engine.particle.render(ctx);
  }, 2);
}
