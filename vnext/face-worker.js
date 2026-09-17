import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs";

const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";

let faceLandmarker = null;
let ready = false;

async function initialize() {
  try {
    self.postMessage({ type: "status", status: "loading", message: "MediaPipeを読み込んでいます…" });

    const vision = await FilesetResolver.forVisionTasks(WASM_URL);

    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "CPU"
      },
      runningMode: "VIDEO",
      numFaces: 1,
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: false
    });

    ready = true;
    self.postMessage({ type: "ready" });
  } catch (error) {
    self.postMessage({
      type: "error",
      stage: "init",
      message: error?.message || String(error)
    });
  }
}

function toScoreMap(result) {
  const categories = result?.faceBlendshapes?.[0]?.categories || [];
  const scores = {};
  for (const category of categories) {
    if (!category?.categoryName) continue;
    scores[category.categoryName] = Number(category.score || 0);
  }
  return scores;
}

self.onmessage = (event) => {
  const data = event.data || {};

  if (data.type === "frame") {
    const bitmap = data.bitmap;

    if (!ready || !faceLandmarker) {
      try { bitmap?.close?.(); } catch (_) {}
      self.postMessage({ type: "not-ready" });
      return;
    }

    try {
      const started = performance.now();
      const result = faceLandmarker.detectForVideo(bitmap, data.timestampMs);
      const inferenceMs = performance.now() - started;
      const scores = toScoreMap(result);

      self.postMessage({
        type: "result",
        faceDetected: Object.keys(scores).length > 0,
        scores,
        inferenceMs
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        stage: "detect",
        message: error?.message || String(error)
      });
    } finally {
      try { bitmap?.close?.(); } catch (_) {}
    }
  }
};

initialize();
