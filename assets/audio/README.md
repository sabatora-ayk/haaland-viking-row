# audio アセットについて

著作権のある音源は組み込んでいません。以下のパスに、
著作権フリー(もしくは自作)の音源を配置してください。
配置しなくてもゲームは動作します(AudioManagerがエラーを握りつぶします)。

- bgm-main.mp3      : メインBGM(config.audio.bgm.main)
- se-unlock.mp3      : 演出解放時のSE(config.audio.se.unlock)
- se-ballon-dor.mp3  : フィナーレ演出のSE(config.audio.se.ballonDor)
- se-row.mp3         : タップ(漕ぎ)のSE(config.audio.se.row)。連打時に音が
                        割れないよう、src/systems/tap-feedback-system.jsで
                        130ms間隔にthrottleして再生される
- se-thunder.mp3     : 雷鳴のSE(config.audio.se.thunder)。ステージ4以降、
                        src/systems/weather-system.jsがランダムな間隔で再生する

差し替え・追加はすべて config/game-config.js の audio セクションのみで完結します。
