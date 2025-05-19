// 摄像头调用
// const video = document.getElementById('webcam');

// navigator.mediaDevices.getUserMedia({ video: true, audio: false })
//   .then(stream => {
//     video.srcObject = stream;
//   })
//   .catch(err => {
//     console.error("no camera", err)
//   })

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
const URL = "./my-pose-model/";
let model, video, canvas, ctx, labelContainer;

async function init() {
  // 加载模型
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";
  model = await tmPose.load(modelURL, metadataURL);

  // 准备 video 元素
  // video = document.getElementById("webcam");
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  labelContainer = document.getElementById("label-container");

  // 打开摄像头
  await setupCamera();
  video.play();

  // 获取类别标签
  const maxPredictions = model.getTotalClasses();
  for (let i = 0; i < maxPredictions; i++) {
    // labelContainer.appendChild(document.createElement("div"));
    const barContainer = document.createElement("div");
    barContainer.className = "bar-container";

    const label = document.createElement("span");
    label.className = "label";
    label.innerText = "Label";

    const bar = document.createElement("div");
    bar.className = "bar";

    const fill = document.createElement("div");
    fill.className = "fill";
    bar.appendChild(fill);

    barContainer.appendChild(label);
    barContainer.appendChild(bar);
    labelContainer.appendChild(barContainer);
  }

  // 开始识别循环
  requestAnimationFrame(loop);
}

async function setupCamera() {
  video = document.createElement("video"); // ✅ 创建 video 元素
  video.setAttribute("playsinline", "");   // 避免在 iOS 上进入全屏
  video.setAttribute("muted", "true");     // 避免警告
  video.width = 400;
  video.height = 400;

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: 800, height: 1400 },
    audio: false
  });

  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

async function loop() {
  await predict();
  requestAnimationFrame(loop);
}

async function predict() {
  const { pose, posenetOutput } = await model.estimatePose(video);
  const prediction = await model.predict(posenetOutput);

  // 显示最高概率的分类
  for (let i = 0; i < prediction.length; i++) {
    const classPrediction = `${prediction[i].className}: ${prediction[i].probability.toFixed(2)}`;
    // labelContainer.childNodes[i].innerHTML = classPrediction;
    const barContainer = labelContainer.childNodes[i];
    const label = barContainer.querySelector(".label");
    const fill = barContainer.querySelector(".fill");

    label.innerText = `${prediction[i].className}: ${prediction[i].probability.toFixed(2)}`;
    fill.style.width = `${prediction[i].probability * 100}%`;


    // ✅ 水平翻转画面
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 显示视频画面（不画点）
  // ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
}
