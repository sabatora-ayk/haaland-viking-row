// src/systems/ending-system.js
// ゲーム終了条件（制限時間経過 or 最終ステージ到達後の演出猶予）を判定し、
// エンド画面表示・ベストスコア保存を行う。
//
// [MVP実装メモ] 元仕様に明示的な終了条件が定義されていなかったため、
// 「遊べる完成版」を優先し、セッション時間(config.score.sessionDurationMs)と
// 最終ステージ到達後の演出猶予(finalStageGraceMs)のどちらか早い方で
// ゲームを終了する、という最小限のルールを実装として補った。

export function createEndingSystem(bus, config, engine, { onRestart }) {
  const finalStageId = [...config.unlock.stages].sort((a, b) => b.stageId - a.stageId)[0].stageId;
  const sessionDurationMs = config.score.sessionDurationMs || 30000;
  const finalStageGraceMs = 3000;

  let latestState = { distance: 0, combo: 0 };
  let ended = false;
  let sessionTimer = null;
  let graceTimer = null;

  bus.on('score:update', (state) => {
    latestState = state;
  });

  bus.on('unlock:stage', ({ stageId }) => {
    if (stageId === finalStageId && !graceTimer) {
      bus.emit('audio:play', { key: 'ballonDor' });
      graceTimer = setTimeout(endGame, finalStageGraceMs);
    }
  });

  function start() {
    sessionTimer = setTimeout(endGame, sessionDurationMs);
  }

  function endGame() {
    if (ended) return;
    ended = true;
    clearTimeout(sessionTimer);
    clearTimeout(graceTimer);

    const best = Math.max(engine.save.get('bestScore', 0), latestState.distance);
    engine.save.set('bestScore', best);

    const text = config.ui.text;
    bus.emit('ui:show-end-screen', {
      title: text.bestScore,
      stats: [
        { label: text.distance, value: Math.floor(latestState.distance) },
        { label: text.bestScore, value: Math.floor(best) }
      ],
      buttons: [
        {
          label: text.replay,
          onClick: () => {
            bus.emit('ui:hide-end-screen');
            onRestart();
          }
        },
        { label: text.share, onClick: () => shareResult(latestState.distance) }
      ]
    });

    bus.emit('game:over', { distance: latestState.distance, combo: latestState.combo });
  }

  function shareResult(distance) {
    const text = `${config.meta.title} - Distance: ${Math.floor(distance)}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  start();

  return { endGame };
}
