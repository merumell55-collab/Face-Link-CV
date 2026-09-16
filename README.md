# Face Link GitHub Edition

GitHub Pagesで公開してスマホから使う想定の、静的Webアプリです。

## 機能
- 人物写真アップロード
- 前面カメラ起動
- 顔AIなし（OpenCV.js Optical Flow）
- 写真側11点・カメラ側11点の手動登録
- 長押し中の虫眼鏡表示
- ズーム / ドラッグ移動
- 表情の強さ調整
- 追従の滑らかさ調整
- 今の表情をニュートラル基準に設定
- 結果画像保存
- HTTPS / カメラ / OpenCV の診断表示

## GitHub Pages への公開
GitHubの **Settings → Pages** から、Sourceを `Deploy from a branch`、Branchを `main` / `/root` に設定してください。

## ポイント登録の順番
1. 左目・上まぶた中央
2. 左目・下まぶた中央
3. 右目・上まぶた中央
4. 右目・下まぶた中央
5. 口・左端
6. 口・右端
7. 上唇中央
8. 下唇中央
9. 左眉中央
10. 右眉中央
11. 鼻先

## 注意
- カメラが使えるのは HTTPS または localhost のみです
- 追跡が外れたら「追跡停止」→ カメラ側の点をやり直してください
