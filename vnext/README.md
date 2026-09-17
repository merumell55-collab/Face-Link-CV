# Face Link vNext

まず「写真を動かす」前に、スマホカメラから表情を正しく取得できるかだけ確認するテスト版です。

## この段階で確認するもの
- 左右の瞬き: `eyeBlinkLeft` / `eyeBlinkRight`
- 口の開き: `jawOpen`
- 笑顔: `mouthSmileLeft` / `mouthSmileRight`
- 眉上げ: `browInnerUp` / `browOuterUpLeft` / `browOuterUpRight`

## 方針
- 自分の顔への手動ポイント指定は不要
- MediaPipe Face Landmarker を使用
- `outputFaceBlendshapes: true` で表情係数を取得
- 推論は Web Worker 側で実行し、メインUIの固まりを抑える
- この段階ではアップロード画像の変形は行わない

## 次の段階
このページで瞬き・口・眉の値がスマホで安定して動くことを確認したあと、まず「瞬き」だけをアップロード画像へ反映する。
