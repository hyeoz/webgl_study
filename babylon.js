const canvas = document.getElementById("renderCanvas"); // 캔버스 엘리먼트 찾음
const engine = new BABYLON.Engine(canvas, true); // BABYLON 3D engine 생성

var getYSpin = function (animationSpeed) {
  const frameRate = 1.0 / animationSpeed;
  var ySpin = new BABYLON.Animation(
    "ySpin",
    "rotation",
    1,
    BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  var keyFrames = [];
  keyFrames.push({
    frame: 0,
    value: BABYLON.Vector3.Zero(),
  });
  keyFrames.push({
    frame: frameRate,
    value: new BABYLON.Vector3(-Math.PI, Math.PI, Math.PI),
  });
  keyFrames.push({
    frame: 2 * frameRate,
    value: new BABYLON.Vector3(Math.PI, Math.PI, -Math.PI),
  });
  ySpin.setKeys(keyFrames);
  return ySpin;
};

const createScene = function () {
  const scene = new BABYLON.Scene(engine); // 장면 생성. 엔진을 인수로 넘겨줌

  // 카메라 생성. arc rotate camera 는 항상 대상 위치를 회전 중심으로 하여 해당 대상을 중심으로 회전할 수 있는 카메라.
  // name, alpha, beta, radius, target position, scene 을 매개변수로 받음
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2.5,
    15,
    new BABYLON.Vector3(0, 0, 0)
  );
  camera.attachControl(canvas, true);

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(1, 1, 1),
    scene
  ); // 조명 생성. 반구형 조명으로 name, direction, scene 울 매개변수로 받음

  const box = BABYLON.MeshBuilder.CreateBox("box", {}, scene); // 상자 생성. 중심이 원점에 위치하도록 생성되며 name, option, scene 세가지의 매개변수를 받음
  const animationSpeed = 1;
  var ySpin = getYSpin(animationSpeed);
  box.animations.push(ySpin);
  scene.beginDirectAnimation(box, [ySpin], 0, 10, true);
  return scene;
};

const scene = createScene(); // createScene 함수 실행

// 렌더링
engine.runRenderLoop(function () {
  scene.render();
});

// 브라우저나 캔버스의 리사이즈 이벤트를 적용함
window.addEventListener("resize", function () {
  engine.resize();
});
