// src/systems/camera-system.js
// 'unlock:stage' を受けて、config.effects[stageId] の内容を実際の
// カメラ揺れ / パーティクル / 音声イベントへ変換して発火する。
//
// TapEngine側(engine/effect.js, engine/particle.js)は抽象データしか
// 受け取らないため、「stageId=3はfire」という“意味の解釈”は
// このファイルが一手に担う。これによりengine配下はゲーム非依存を保てる。

export function createCameraSystem(bus, config) {
  bus.on('unlock:stage', ({ stageId }) => {
    const effect = config.effects[stageId];
    if (!effect) return;

    const cameraShakeParams = config.camera.shake[effect.cameraShake];
    const particleParams = config.particles[effect.particleKey];

    bus.emit('effect:trigger', {
      cameraShakeParams,
      particleParams,
      origin: { xRatio: 0.3, yRatio: 0.75 }
    });

    bus.emit('audio:play', { key: 'unlock' });
  });
}
