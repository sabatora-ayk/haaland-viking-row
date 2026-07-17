// src/ui.js
// ゲーム固有の一時的UI（開始プロンプト等）。
// 常設HUD/エンド画面はengine/ui-manager.jsが汎用的に担当するため、
// ここではそれ以外の「ゲーム固有かつ一時的なUI」のみを扱う。
// （タップ開始の演出はブラウザのオーディオ自動再生制限の回避も兼ねる）

export function showStartPrompt(uiRoot, text, onFirstTap) {
  const prompt = document.createElement('div');
  prompt.className = 'tap-engine-start-prompt';
  prompt.textContent = text;
  uiRoot.appendChild(prompt);

  const remove = () => {
    prompt.remove();
    if (onFirstTap) onFirstTap();
  };
  prompt.addEventListener('pointerdown', remove, { once: true });
}
