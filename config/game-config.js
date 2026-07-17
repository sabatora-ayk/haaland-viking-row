// config/game-config.js
// 「Haaland Viking Row」のゲーム固有データを一元管理するファイル。
// TapEngine本体(engine/配下)はこのファイルの内容を一切知らない。
// 別タイトルを作る際はこのファイルとassets/, src/systemsの中身を
// 差し替えるだけで成立する設計になっている。
//
// [MVP実装メモ]
// 設計書v2ではplayer/shipにスプライト画像パスを持たせる想定だったが、
// 実素材（イラスト・音源）が用意できないMVP段階のため、見た目は
// canvasのベクター描画(色・サイズのみconfig駆動)で代替している。
// 実素材が用意でき次第、visual.player/visual.shipにsprite関連の
// フィールドを追加し、src/scene.jsの描画関数を差し替えるだけで
// 移行できる（データ駆動の構造自体は変更不要）。

export default {
  meta: {
    title: 'Haaland Viking Row',
    version: '0.1.0-mvp'
  },

  // 見た目（色・サイズ）。実素材導入時はここにsprite系フィールドを追加する
  visual: {
    background: {
      skyTop: '#0b1a2b',
      skyBottom: '#16324f',
      sea: '#12293f',
      mountains: '#0a1c2e',
      auroraStartStage: 5,           // このstageId以上でオーロラを表示
      auroraColors: ['#7effc0', '#7ecbff', '#c07eff']
    },
    ship: {
      color: '#5a3b1e',
      width: 140,
      height: 40
    },
    player: {
      bodyColor: '#1e5bff',   // ユニフォーム風の色
      skinColor: '#f3c98b',
      hairColor: '#f5d36a',
      size: 36
    }
  },

  // カメラ揺れのプリセット。effectsセクションからkey名で参照される
  camera: {
    shake: {
      default: { intensity: 2, duration: 150 },
      strong: { intensity: 6, duration: 300 },
      extreme: { intensity: 14, duration: 700 }
    }
  },

  // パーティクルのプリセット。effectsセクションからkey名で参照される
  particles: {
    splash: { color: '#8ecbff', count: 18, life: 500 },
    fire: { color: '#ff6a2b', count: 26, life: 700 },
    thunder: { color: '#f5f56a', count: 14, life: 350 },
    aurora: { color: '#7effc0', count: 30, life: 1100 },
    ballonDor: { color: '#ffd54a', count: 70, life: 1800 }
  },

  // unlock.stagesのstageIdごとに、どのカメラ揺れ・パーティクルを使うかを定義。
  // 演出の追加・変更はこのオブジェクトとcamera.shake/particlesの調整のみで完結する。
  effects: {
    1: { cameraShake: 'default', particleKey: 'splash' },
    2: { cameraShake: 'default', particleKey: 'splash' },
    3: { cameraShake: 'strong', particleKey: 'fire' },
    4: { cameraShake: 'strong', particleKey: 'thunder' },
    5: { cameraShake: 'default', particleKey: 'aurora' },
    6: { cameraShake: 'extreme', particleKey: 'ballonDor' }
  },

  // タップ速度(tap/sec)に応じた演出解放の閾値
  unlock: {
    stages: [
      { stageId: 1, threshold: 2.0, label: 'Splash' },
      { stageId: 2, threshold: 3.5, label: 'Fast Oars' },
      { stageId: 3, threshold: 5.0, label: 'Fire' },
      { stageId: 4, threshold: 6.5, label: 'Thunder' },
      { stageId: 5, threshold: 8.0, label: 'Aurora' },
      { stageId: 6, threshold: 10.0, label: "Ballon d'Or" }
    ]
  },

  // スコア計算バランス
  score: {
    distancePerTap: 1.2,
    comboResetMs: 800,
    comboMultiplierStep: 0.1,
    // [MVP実装メモ] 元仕様に明示的な終了条件が無かったため、
    // 遊べる完成版として最小限のセッション時間を追加した。
    sessionDurationMs: 30000
  },

  // 音声ファイルパス。著作権フリー音源を各自 assets/audio/ に配置する運用とし、
  // 未配置でもAudioManager側でエラーを握りつぶしゲームは止まらない。
  audio: {
    bgm: {
      main: 'assets/audio/bgm-main.mp3'
    },
    se: {
      unlock: 'assets/audio/se-unlock.mp3',
      ballonDor: 'assets/audio/se-ballon-dor.mp3'
    },
    volume: { bgm: 0.5, se: 0.8 }
  },

  ui: {
    color: { primary: '#ffd54a', background: '#0b1a2b', text: '#ffffff' },
    text: {
      distance: 'Distance',
      combo: 'Combo',
      bestScore: 'Best Score',
      replay: 'Replay',
      share: 'Share',
      tapToStart: 'Tap to Row!'
    },
    showFpsInDev: true
  },

  save: {
    storageKeyPrefix: 'haaland-viking-row'
  }
};
