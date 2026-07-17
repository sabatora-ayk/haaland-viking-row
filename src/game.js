// src/game.js
// ゲームの統括層。TapEngineの初期化と、src/systems/配下・src/scene.js・
// src/ui.jsの登録のみを行う「薄い」ファイル。
// ゲームルールの詳細は各systemを、ビジュアルはscene.js/ui.jsを参照すること。
// このファイルにゲームルールや描画のロジックを直接書き足さないこと(肥大化防止)。

import { TapEngine } from '../engine/tap-engine.js';
import gameConfig from '../config/game-config.js';
import { createUnlockSystem } from './systems/unlock-system.js';
import { createScoreSystem } from './systems/score-system.js';
import { createCameraSystem } from './systems/camera-system.js';
import { createTapFeedbackSystem } from './systems/tap-feedback-system.js';
import { createEndingSystem } from './systems/ending-system.js';
import { registerRenderLayers } from './scene.js';
import { buildGameUI } from './ui.js';

export function startGame(canvas, uiRoot) {
  const engine = new TapEngine({ canvas, uiRoot, config: gameConfig });

  // Haaland Viking Row専用UI(タイトル・スコアボード・TAP TO ROW・演出バナー)を構築。
  // engine/ui-manager.jsの汎用HUD(buildHud)は使わず、ゲーム固有ビジュアルに全面差し替え。
  buildGameUI(engine, gameConfig, uiRoot);

  // 描画内容の登録(背景・船・プレイヤー・パーティクル・画面フラッシュ)
  registerRenderLayers(engine, gameConfig);

  // ゲームルール(systems)の登録。各systemは互いを直接importせず、
  // engine.bus経由でのみ連携する。新しいルールを追加する場合は
  // src/systems/に新規ファイルを作り、ここへ1行追加するだけでよい。
  createUnlockSystem(engine.bus, gameConfig);
  createScoreSystem(engine.bus, gameConfig);
  createCameraSystem(engine.bus, gameConfig);
  createTapFeedbackSystem(engine.bus, gameConfig);
  createEndingSystem(engine.bus, gameConfig, engine, {
    onRestart: () => restart()
  });

  engine.start();

  // BGMはブラウザの自動再生制限を回避するため、最初のタップ(ユーザー操作)まで待つ。
  // 'input:tap'は元のpointerdownイベントの呼び出しスタック内で同期的に発火するため、
  // ユーザージェスチャー内でのplay()呼び出しとして扱われる。
  engine.bus.once('input:tap', () => {
    engine.bus.emit('audio:play', { key: 'main', loop: true });
  });

  // [MVP実装メモ] リスタートはengineを作り直す単純な実装にしている。
  // 各systemに個別のreset()を持たせるより、MVP段階ではシンプルさを優先した。
  function restart() {
    engine.stop();
    uiRoot.querySelectorAll('.hvr-ui, .tap-engine-end-screen').forEach((el) => el.remove());
    startGame(canvas, uiRoot);
  }

  return engine;
}
