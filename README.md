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

## キャラクター2Dカートゥーン改修（v0.3.0）

疑似ピクセルアート(13×16ドット)を廃止し、canvasのPath/ベジェ曲線による
2Dカートゥーンベクター描画に全面置き換え。顔と上半身のシルエットを画面上の
支配的要素にし、Haaland本人の写実的再現ではなく「特徴の記号化」で
ファンメイド感を表現した。

### 変更したファイル（今回のみ）

| ファイル | 変更内容 |
|---|---|
| `config/game-config.js` | `visual.player`セクションを全面差し替え。旧`pixelSize`/`shortsColor`/`bootsColor`を廃止し、`browColor`/`eyeColor`/`mouthColor`/`cheekColor`/`outlineColor`等のカートゥーン用パレット、ステージ別スケール(`stageScale`)、ステージ別オーラ色(`auraColors`)を追加 |
| `src/scene.js` | `drawPixelSprite`/`PLAYER_MATRIX`を削除し、`drawHaalandCharacter`(ベクター描画関数)に全面置き換え。オールの腕の角度(`armAngle`)を既存の`oarAngle`計算とそのまま同期させ、既存のロジックには一切手を加えていない |

`engine/`・`src/systems/`・`src/game.js`・`src/ui.js`・`src/main.js`・`style.css`・
`index.html`は今回のターンでは無変更(タイムスタンプで確認済み)。

### Haaland感の出し方

長い金髪(前髪+横に流れる毛束+後ろ髪の3パーツ)・大きく角張った輪郭の頭部・
太い眉・眠そうな半開きの目・赤ジャージ+白ストライプ+背番号「9」・
怪物的に大きい肩幅、という特徴の組み合わせのみで表現し、写実的な顔の再現は行っていない。

### 魔人ブウ的ミーム性の抽象化

直接コピーした要素は無し。代わりに以下の抽象化した要素のみを採用した。

- 丸みのある巨大なシルエット(肩・頭部を誇張)
- 頬のピンクのハイライト(コミカルな怪物感の演出)
- ステージ進行に伴う後光(オーラ)の色変化(炎=赤橙 / 雷=白 / オーロラ=紫 / 黄金=金)
- 無表情気味なのに巨大で圧倒的な存在感、というギャップ表現
- Ballon d'Orステージでの勝利ポーズ(反対の腕を高く掲げる)

衣装・頭部アンテナ・顔そのもののコピー、ドラゴンボールのロゴ等は一切使用していない。

### 既存ゲーム性の維持

キャラクターの腕は既存の`oarAngle`計算式(タップ速度依存)をそのまま`armAngle`として
受け取るだけで、オール・タップ判定・ROW POWER・スコア・ステージ解放・BGM/SEの
仕組みには一切変更を加えていない。

## ビジュアル/UI大改修（v0.2.0）

タイトルを **HAALAND VIKING ROW** としてブランディングを強化し、以下を実装した。

### 変更したファイルと変更内容

| ファイル | 変更内容 |
|---|---|
| `config/game-config.js` | `visual`セクションを大幅拡張。ステージ別背景テーマ(`backgroundStages`)、船(ドラゴンヘッド・盾・航跡色)、プレイヤー(髪・肌・ユニフォーム各色)、UI文言(ロゴ・TAP TO ROW・BALLON D'OR)を追加。`effects`各ステージに`flash`(画面フラッシュ)を追加。`particles.tapSplash`を追加 |
| `src/scene.js` | 全面改修。疑似ピクセルアート(`drawPixelSprite`)によるHaaland風キャラクター描画、ドラゴンヘッド+盾+航跡付きロングシップ、ステージ別背景(フィヨルド→速度線→炎グロー→オーロラ+星→黄金)、タップ速度連動のオール速度・速度ライン、画面フラッシュレイヤーを追加 |
| `src/ui.js` | 全面改修。タイトルロゴ、DISTANCE/COMBO/ROW POWERバーのスコアボード、常設TAP TO ROWバナー、タップ時フラッシュ+スケール演出、BALLON D'Orフィナーレバナーを追加。`engine/ui-manager.js`の汎用HUD(buildHud)は使用せず完全に独自UIへ置き換え |
| `src/game.js` | `buildGameUI`呼び出しへの差し替え、`tap-feedback-system`の登録追加、BGM再生を最初のタップまで遅延する方式に変更 |
| `src/main.js` | 開始プロンプトのゲート処理を廃止し、即座に`startGame`を呼ぶ形に簡素化(TAP TO ROWバナーが常設UI化したため) |
| `src/systems/camera-system.js` | `effect:trigger`イベントのペイロードに`flash`フィールドを追加(engine側は未知のフィールドとして無視するため後方互換) |
| `src/systems/tap-feedback-system.js` | **新規**。毎タップごとの水しぶきフィードバックを担当 |
| `style.css` | 全面改修。タイトルロゴ・スコアボード・TAP TO ROW・タップフラッシュ・BALLON D'OR演出のスタイル追加、エンド画面をノルウェー配色に再配色、`pointer-events`をボタンのみに限定するよう整理 |
| `index.html` | `<title>`とmeta descriptionを更新 |

`engine/`配下は一切変更していない(diffで完全一致を確認済み)。

### 設計原則の遵守確認

- `engine/`にHaaland/Viking/ship/oar等のゲーム固有語が存在しないことを確認済み
- `engine/`が`config/game-config.js`をimportしていないことを確認済み
- `src/systems/`が`engine/`内部モジュールを直接importしていないことを確認済み
- 新しい画面フラッシュ演出は、`effect:trigger`イベントに`flash`フィールドを追加し、`src/scene.js`が追加の購読者として読むことで実現。`engine/effect.js`・`engine/particle.js`は未知のフィールドを無視するため後方互換が保たれる
- ROW POWERバー・タップフラッシュは、既存の汎用イベント(`input:tap` / `render:frame`)を`src/ui.js`が新たに購読することで実現。engineへの変更は不要だった

### 実装上の判断

- キャラクター・船は実素材が無いため、引き続きcanvas描画(疑似ピクセルアート)で表現。実在人物の写真的再現はせず、長い金髪・大柄なシルエット・赤基調ユニフォームという特徴のみでファンメイド表現とした
- BGM自動再生制限を回避するため、TAP TO ROWバナーによる明示的な開始ゲートを廃止し、最初のタップで遅延再生する方式に変更(モバイルSafari/Chrome双方の自動再生ポリシーに対応)

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
