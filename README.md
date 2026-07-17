# Haaland Viking Row (MVP)

TapEngineという再利用可能なタップゲームエンジンの上に構築された、
サッカー選手タップゲームシリーズ第1弾。北欧の海をバイキング船で漕ぎ進み、
タップ速度に応じて水しぶき→炎→雷→オーロラ→Ballon d'Or演出が解放される。

このリポジトリはMVP（遊べる完成版）です。将来機能（オンラインランキング・
実績・スキン・PWA・多言語対応など）は拡張ポイントのみ用意し、実装は未着手です。

## 遊び方

ES Modulesを使用しているため、`file://` で直接開くとCORSエラーになります。
簡易サーバーを起動してアクセスしてください。

```bash
# Node.jsがある場合
npx serve .

# もしくはPython
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000`（またはserveが表示するURL）を開き、画面をタップしてください。

GitHub Pagesにそのままデプロイ可能です（ビルド不要、ライブラリ依存なし）。

## フォルダ構成

```
haaland-viking-row/
├── index.html
├── style.css
├── assets/
│   ├── images/   # MVPでは未使用（README参照）
│   └── audio/    # 各自、著作権フリー音源を配置（README参照）
├── engine/       # TapEngine本体。ゲーム固有コードを一切含まない
│   ├── tap-engine.js
│   ├── event-bus.js
│   ├── animation.js
│   ├── effect.js
│   ├── particle.js
│   ├── audio.js
│   ├── input.js
│   ├── renderer.js
│   ├── save.js
│   ├── ui-manager.js
│   └── utils.js
├── config/
│   └── game-config.js   # ゲーム固有データの唯一の情報源
└── src/
    ├── main.js    # エントリポイント
    ├── game.js    # TapEngine初期化 + systems登録のみ（薄い統括層）
    ├── scene.js   # ゲーム固有の描画内容（背景・船・プレイヤー）
    ├── ui.js      # ゲーム固有の一時的UI（開始プロンプト）
    └── systems/
        ├── unlock-system.js   # タップ速度→演出解放判定
        ├── score-system.js    # Distance/Combo計算
        ├── camera-system.js   # stageId→カメラ揺れ/パーティクル/音声への変換
        └── ending-system.js   # 終了判定・リザルト表示・ベストスコア保存
```

## 設計原則（詳細は別紙の設計書v2を参照）

1. **TapEngineはゲームを知らない**: `engine/`配下にゲーム名やドメイン語（船・オール等）を書かない
2. **EventBus経由の疎結合**: 全モジュールは`engine/event-bus.js`を介してのみ通信する
3. **データ駆動**: 演出・解放条件・数値バランスは`config/game-config.js`のみで調整可能
4. **systems/分割**: ゲームルールは機能単位で`src/systems/`へ分割し、`game.js`の肥大化を防ぐ

## MVPにおける実装上の補足（設計書v2からの最小限の逸脱）

- **見た目**: 実イラスト・音源素材が無いため、キャラクター/船はcanvasのベクター
  描画（色・サイズのみconfig駆動）で代替。実素材導入時は`src/scene.js`の
  描画処理のみ差し替えれば良く、データ駆動の構造自体（config設計・engine非依存）
  は変更不要。
- **終了条件**: 元仕様に明示的な終了条件が無かったため、セッション時間
  （`config.score.sessionDurationMs`）と最終演出到達後の猶予時間のどちらか
  早い方でゲームを終える、という最小限のルールを`ending-system.js`に実装。
- **リスタート**: `src/game.js`はTapEngineを作り直す単純な実装。各systemに
  個別のreset()を持たせるより、MVP段階ではシンプルさを優先。

## 新しいサッカー選手ゲームを追加する場合

1. `config/game-config.js` を新タイトル用に差し替え
2. `assets/` を差し替え
3. `src/scene.js`, `src/systems/` のルールを必要に応じて調整
4. `engine/` は無変更で再利用

## 実装レビュー結果（重大2件を修正済み）

- **[修正済/重大] BGM多重再生・リーク**: `TapEngine.stop()`がAudioを止めておらず、
  Replayのたびにループ再生中のBGMが積み上がっていた。`AudioManager.stopAll()`を
  追加し`stop()`から呼ぶよう修正。
- **[修正済/重大] iOS Safariでの100vh表示崩れ**: `#game-root`の`100vw/100vh`指定が
  アドレスバーの表示/非表示で実際の可視領域とズレ、意図しないスクロールが発生する
  既知の問題があったため`100%`指定に変更。
- **[中/未修正] `ending-system.js`がEventBusを経由せず`engine.save`を直接呼び出し**:
  同期的なlocalStorage読み書きのみのため意図的な例外としているが、疎結合の原則からは逸脱。
- **[中/未修正] `config.effects`と`unlock.stages`/`particles`の対応関係が暗黙的**:
  シリーズ化時にキー追加を忘れても無警告で演出が発火しないだけになる。
- **[中/未修正] パーティクルがカメラ揺れのオフセットを受けない**: 視覚的な整合性のみの問題。
- **[中/未修正] `storageKeyPrefix`のGitHub Pages同一origin衝突リスク**: 複数タイトルを
  同一アカウントのGitHub Pagesに配置する際、prefix変更を忘れるとベストスコアが衝突しうる。
- **[軽微/未修正]** `resize`のみでのiOS方向転換対応、`.nojekyll`未配置、
  背景描画の毎フレーム再生成、iOS 13未満でのPointer Events非対応。

## npmパッケージ化への移行（将来）

`engine/`フォルダをそのまま別リポジトリへ切り出し、`package.json`を追加して
`tap-engine.js`を`main`/`exports`に指定するだけで npm package化できる構成
になっている（設計書v2 §8参照）。
