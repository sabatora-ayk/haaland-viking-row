// src/game.js
// ゲームの統括層。TapEngineの初期化と、src/systems/配下の登録のみを行う
// 「薄い」ファイル。ゲームルールの詳細は各systemを参照すること。
// このファイルにゲームルールのロジックを直接書き足さないこと（肥大化防止）。

import { TapEngine } from '../engine/tap-engine.js';
import gameConfig from '../config/game-config.js';
import { createUnlockSystem } from './systems/unlock-system.js';
import { createScoreSystem } from './systems/score-system.js';
import { createCameraSystem } from './systems/camera-system.js';
import { createEndingSystem } from './systems/ending-system.js';
import { registerRenderLayers } from './scene.js';

export function startGame(canvas, uiRoot) {
  const engine = new TapEngine({ canvas, uiRoot, config: gameConfig });

  // HUD構築。ラベル文言・色は完全にgame-config.js駆動。
  engine.ui.buildHud({
    stats: [
      { key: 'distance', label: gameConfig.ui.text.distance },
      { key: 'combo', label: gameConfig.ui.text.combo }
    ],
    color: gameConfig.ui.color,
    showFps: gameConfig.ui.showFpsInDev
  });

  // 描画内容の登録（背景・船・プレイヤー・パーティクル）
  registerRenderLayers(engine, gameConfig);

  // ゲームルール(systems)の登録。各systemは互いを直接importせず、
  // engine.bus経由でのみ連携する。新しいルールを追加する場合は
  // src/systems/に新規ファイルを作り、ここへ1行追加するだけでよい。
  createUnlockSystem(engine.bus, gameConfig);
  createScoreSystem(engine.bus, gameConfig);
  createCameraSystem(engine.bus, gameConfig);
  createEndingSystem(engine.bus, gameConfig, engine, {
    onRestart: () => restart()
  });

  engine.start();
  engine.bus.emit('audio:play', { key: 'main', loop: true });

  // [MVP実装メモ] リスタートはengineを作り直す単純な実装にしている。
  // 各systemに個別のreset()を持たせるより、MVP段階ではシンプルさを優先した。
  function restart() {
    engine.stop();
    uiRoot.querySelectorAll('.tap-engine-hud, .tap-engine-end-screen').forEach((el) => el.remove());
    startGame(canvas, uiRoot);
  }

  return engine;
}
