/*
  使用 Teachable Machine Pose 模型在浏览器中进行姿势分类示例
  -------------------------------------------------------------
  1. 加载模型
  2. 打开摄像头
  3. 不断估计姿态并分类
  4. 在 <canvas> 上水平翻转绘制视频帧
  5. 当 "think" 概率 ≥ 0.9 时叠加播放 animVideo
*/

// ---------------------- 全局常量与变量 ----------------------
const URL = "./my-pose-model/";
let model, video, canvas, ctx, labelContainer;
const animVideo = document.getElementById("animVideo");   // 叠加动画
// 用于缓存连续识别的帧数
let detectionCounter = 0;
const requiredStableFrames = 3;

// --------------------------- 入口 ---------------------------
async function init() {
  /* 1. 加载模型文件 */
  model = await tmPose.load(URL + "model.json", URL + "metadata.json");

  /* 2. 获取/准备 DOM 元素 */
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  labelContainer = document.getElementById("label-container");

  /* 3. 打开摄像头 */
  await setupCamera();
  video.play();

  /* 4. 根据类别数生成条形图 UI */
  const maxPredictions = model.getTotalClasses();
  for (let i = 0; i < maxPredictions; i++) {
    const barContainer = document.createElement("div");
    barContainer.className = "bar-container";

    const label = document.createElement("span");
    label.className = "label";

    const bar = document.createElement("div");
    bar.className = "bar";

    const fill = document.createElement("div");
    fill.className = "fill";

    bar.appendChild(fill);
    barContainer.appendChild(label);
    barContainer.appendChild(bar);
    labelContainer.appendChild(barContainer);
  }

  /* 5. 绑定一次性的 ended 事件：播放完成后隐藏视频 */
  animVideo.addEventListener("ended", () => {
    animVideo.style.display = "none";
  });

  /* 6. 启动帧循环 */
  requestAnimationFrame(loop);
}

// --------------------- 摄像头初始化 ---------------------
async function setupCamera() {
  video = document.createElement("video");
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "true");
  // video.width = 400;
  // video.height = 400;

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 800, height: 1400 },
    // video: { width: 1280, height: 720 },

    audio: false
  });
  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => resolve(video);
  });
}

// --------------------------- 帧循环 ---------------------------
async function loop() {
  await predict();
  requestAnimationFrame(loop);
}

// --------------------------- 推理 + 渲染 ---------------------------
async function predict() {
  /* A. 姿态估计 */
  const { pose, posenetOutput } = await model.estimatePose(video);

  /* B. 分类预测 */
  const prediction = await model.predict(posenetOutput);

  /* C. 更新条形图 UI */
  for (let i = 0; i < prediction.length; i++) {
    const barContainer = labelContainer.childNodes[i];
    const label = barContainer.querySelector(".label");
    const fill = barContainer.querySelector(".fill");

    label.innerText = `${prediction[i].className}: ${prediction[i].probability.toFixed(2)}`;
    fill.style.width = `${prediction[i].probability * 100}%`;
  }

  /* D. 触发动画（关键行）*/
  triggerVideoIfNeeded(prediction);

  /* E. 水平翻转后绘制视频帧 */
  ctx.save();
  ctx.scale(-1, 1);
  ctx.translate(-canvas.width, 0);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

// --------------------------- 定义动作序列 ---------------------------
const poseSequence = ['wave hand', 'sit', 'think'];
let currentStep = 0;
let sequenceCompelete = false;
let finalPoint = 0;


// --------------------------- 触发函数 ---------------------------
function triggerVideoIfNeeded(predArray) {
  if (sequenceCompelete || animVideo && !animVideo.paused) return;

  const currentPoseName = poseSequence[currentStep];
  const predictionPose = predArray.find(p => p.className === currentPoseName);

  if (predictionPose && predictionPose.probability >= 0.95) {
    detectionCounter++;
    if (detectionCounter >= requiredStableFrames) {
      console.log("✅ 通过检测", currentPoseName, "Step:", currentStep);
      playAnim(getAnimForPose(currentPoseName));
      currentStep++;
      detectionCounter = 0;

      if (currentStep >= poseSequence.length) {
        sequenceCompelete = true;
        console.log("🎉 所有动作完成！");
      }
    }
  } else {
    // 如果不符合要求就重置连续帧数
    detectionCounter = 0;
  }
}

function getAnimForPose(posename) {
  switch (posename) {
    case "wave hand": return "./asset/Animation_3.webm";
    case "sit": return "./asset/Animation_2.webm";
    case "think": return "./asset/Animation_1.webm";
    default: return "";
  }
}

/* 封装播放逻辑，避免重复代码 */
function playAnim(src) {
  animVideo.src = src;          // 切换文件
  animVideo.style.display = "block";
  animVideo.currentTime = 0;
  animVideo.load();             // 关键：确保浏览器重新加载
  animVideo.play();
}

// --------------------------- 叠加 UI（可选） ---------------------------
const uicanvas = document.getElementById("uicanvas");
const ctxui = uicanvas.getContext("2d");
const uiImage = new Image();
uiImage.src = "./asset/deneme2.png";

uiImage.onload = () => {
  ctxui.clearRect(0, 0, uicanvas.width, uicanvas.height);
  ctxui.drawImage(uiImage, 0, 0, 400, 700);
};

// --------------------------- 启动 ---------------------------
document.addEventListener("DOMContentLoaded", init);