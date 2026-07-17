// config/game-config.js
// 「HAALAND VIKING ROW」のゲーム固有データを一元管理するファイル。
// TapEngine本体(engine/配下)はこのファイルの内容を一切知らない。
//
// [v2ビジュアル改修] キャラクター・船・背景の見た目データを大幅拡張。
// 実イラスト素材は依然として無いため、canvas上の疑似ピクセルアート
// (色ブロック描画)で表現する。色・サイズは全てここで一元管理する。

export default {
  meta: {
    title: 'HAALAND VIKING ROW',
    subtitle: 'A Fan-Made Viking Tap Saga',
    version: '0.2.0-visual'
  },

  // 見た目データ。実素材導入時はここにsprite関連フィールドを追加する
  visual: {
    // ステージ(0=解放前の通常状態, 1〜6=unlock.stagesのstageIdに対応)ごとの背景テーマ
    backgroundStages: {
      0: { skyTop: '#123a5e', skyBottom: '#1c5c86', sea: '#0d3b57', mood: 'calm' },
      1: { skyTop: '#123a5e', skyBottom: '#1c5c86', sea: '#0d3b57', mood: 'calm' },
      2: { skyTop: '#0f2f4d', skyBottom: '#1a4f75', sea: '#0b3450', mood: 'wind' },
      3: { skyTop: '#3a0f0f', skyBottom: '#7a2a12', sea: '#2a1210', mood: 'fire' },
      4: { skyTop: '#0a0a1a', skyBottom: '#1a1a30', sea: '#0a1420', mood: 'thunder' },
      5: { skyTop: '#050a1e', skyBottom: '#0a1730', sea: '#04101c', mood: 'aurora' },
      6: { skyTop: '#241200', skyBottom: '#5a3200', sea: '#0a1420', mood: 'golden' }
    },
    mountains: '#08182a',
    mountainSnow: '#eaf3ff',
    auroraColors: ['#7effc0', '#7ecbff', '#c07eff'],
    starColor: '#f4f8ff',

    ship: {
      hullColor: '#5a3b1e',
      hullDarkColor: '#3d2712',
      deckColor: '#7a5230',
      dragonColor: '#4f7a3d',
      dragonEyeColor: '#ffd54a',
      shieldColors: ['#c8102e', '#f4f8ff', '#ffd54a'],
      oarColor: '#4a2f16',
      wakeColor: 'rgba(244, 248, 255, 0.5)',
      width: 190,
      height: 50
    },

    player: {
      hairColor: '#f5d36a',
      skinColor: '#f3c98b',
      jerseyColor: '#c8102e',
      jerseyShadow: '#8a0b1f',
      shortsColor: '#f4f8ff',
      bootsColor: '#2b1c10',
      pixelSize: 4
    },

    ui: {
      logoLine1: 'HAALAND',
      logoLine2: 'VIKING ROW',
      tapPromptText: 'TAP TO ROW',
      ballonDorText: "BALLON D'OR"
    }
  },

  // カメラ揺れのプリセット。effectsセクションからkey名で参照される
  camera: {
    shake: {
      default: { intensity: 2, duration: 150 },
      strong: { intensity: 6, duration: 300 },
      extreme: { intensity: 16, duration: 800 }
    }
  },

  // パーティクルのプリセット。effectsセクション/タップフィードバックから参照される
  particles: {
    tapSplash: { color: '#8ecbff', count: 6, life: 350, size: 2 },
    splash: { color: '#8ecbff', count: 18, life: 500 },
    fire: { color: '#ff6a2b', count: 30, life: 700 },
    thunder: { color: '#f5f56a', count: 16, life: 350 },
    aurora: { color: '#7effc0', count: 30, life: 1100 },
    ballonDor: { color: '#ffd54a', count: 90, life: 2000 }
  },

  // unlock.stagesのstageIdごとに、カメラ揺れ・パーティクル・画面フラッシュを定義。
  // flashは任意(省略可)。演出の追加・変更はこのオブジェクトの調整のみで完結する。
  effects: {
    1: { cameraShake: 'default', particleKey: 'splash' },
    2: { cameraShake: 'default', particleKey: 'splash' },
    3: { cameraShake: 'strong', particleKey: 'fire', flash: { color: 'rgba(255,90,40,0.35)', durationMs: 220 } },
    4: { cameraShake: 'strong', particleKey: 'thunder', flash: { color: 'rgba(255,255,255,0.55)', durationMs: 120 } },
    5: { cameraShake: 'default', particleKey: 'aurora' },
    6: { cameraShake: 'extreme', particleKey: 'ballonDor', flash: { color: 'rgba(255,213,74,0.5)', durationMs: 400 } }
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
      distance: 'DISTANCE',
      combo: 'COMBO',
      bestScore: 'Best Score',
      replay: 'Replay',
      share: 'Share',
      rowPower: 'ROW POWER'
    },
    showFpsInDev: true
  },

  save: {
    storageKeyPrefix: 'haaland-viking-row'
  }
};
