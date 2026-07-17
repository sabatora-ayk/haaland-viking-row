// src/main.js
// アプリケーションのエントリポイント。DOM取得とゲーム開始のみを行う。
// TAP TO ROWバナーは常設UI(src/ui.js)として画面下部に表示され、
// BGM再生は最初のタップまでsrc/game.js側で遅延される(自動再生制限対策)。

import { startGame } from './game.js';

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-root');

startGame(canvas, uiRoot);
