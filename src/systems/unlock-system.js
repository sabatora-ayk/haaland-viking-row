// src/systems/unlock-system.js
// タップ速度(config.unlock.stages)を監視し、新しいステージが解放されたら
// 'unlock:stage' を発火するだけのシステム。
// このファイルはゲームルールそのものであり、TapEngine本体(engine/配下)
// からは完全に独立している。他のsystemも直接importしない（bus経由のみ）。

export function createUnlockSystem(bus, config) {
  const stages = [...config.unlock.stages].sort((a, b) => a.threshold - b.threshold);
  let unlockedStageId = 0;

  bus.on('input:tap', ({ velocity }) => {
    // 現在のタップ速度で到達可能な最大ステージを探す（解放は一方向・戻らない）
    let reachable = unlockedStageId;
    for (const stage of stages) {
      if (velocity >= stage.threshold) reachable = stage.stageId;
    }
    if (reachable > unlockedStageId) {
      unlockedStageId = reachable;
      const stage = stages.find((s) => s.stageId === reachable);
      bus.emit('unlock:stage', { stageId: stage.stageId, label: stage.label });
    }
  });

  return {
    getUnlockedStageId: () => unlockedStageId
  };
}
