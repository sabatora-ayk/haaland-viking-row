# images アセットについて

MVP版では実イラスト素材を使わず、canvas上のベクター描画
（src/scene.js）でキャラクター・船を表現しています。

将来スプライト画像を導入する場合:
1. ここに画像ファイルを配置
2. config/game-config.js の visual.player / visual.ship に
   sprite関連フィールド（画像パス・フレーム情報等）を追加
3. src/scene.js の描画関数を画像描画に差し替え

engine/animation.js は汎用のtween/振動アニメーターとして
既に実装済みのため、スプライトのフレーム進行にもそのまま流用できます。
