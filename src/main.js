// src/main.js
// アプリケーションのエントリポイント。DOM取得と最初のタップ待ちのみを行う。

import { startGame } from './game.js';
import { showStartPrompt } from './ui.js';
import gameConfig from '../config/game-config.js';

const canvas = document.getElementById('game-canvas');
const uiRoot = document.getElementById('ui-root');

showStartPrompt(uiRoot, gameConfig.ui.text.tapToStart, () => {
  startGame(canvas, uiRoot);
});
