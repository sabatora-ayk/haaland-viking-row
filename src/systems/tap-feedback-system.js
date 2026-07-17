// src/systems/tap-feedback-system.js
// 毎タップごとの即時ビジュアルフィードバック(小さな水しぶき)を担当する。
// stage解放時の派手な演出(camera-system.js)とは責務を分離し、
// 「タップ = 何かが起きている」という常時のレスポンスのみをここで扱う。
// TapEngine本体には依存せず、bus/configのみに依存する。

export function createTapFeedbackSystem(bus, config) {
  const particleParams = config.particles.tapSplash;

  bus.on('input:tap', () => {
    if (!particleParams) return;
    bus.emit('effect:trigger', {
      particleParams,
      origin: { xRatio: 0.3, yRatio: 0.75 }
    });
  });
}
