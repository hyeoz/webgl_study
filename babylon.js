const canvas = document.getElementById("renderCanvas"); // 캔버스 엘리먼트 찾음
const engine = new Engine(canvas, true); // BABYLON 3D engine 생성

const createScene = function () {
  const scene = new Scene(engine); // 장면 생성. 엔진을 인수로 넘겨줌

  // 카메라 생성. arc rotate camera 는 항상 대상 위치를 회전 중심으로 하여 해당 대상을 중심으로 회전할 수 있는 카메라.
  // name, alpha, beta, radius, target position, scene 을 매개변수로 받음
  const camera = new ArcRotateCamera(
    "camera",
    Tools.ToRadians(90),
    Tools.ToRadians(65),
    10,
    new Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);

  const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene); // 조명 생성. 반구형 조명으로 name, direction, scene 울 매개변수로 받음
  // light.intensity = 0.7;

  // built-in ground 생성
  let ground = CreateGround("ground", { width: 6, height: 6 }, scene);
  let groundMaterial = new StandardMaterial("Ground Material", scene);
  ground.material = groundMaterial;
  const groundTexture = new Texture(
    "https://assets.babylonjs.com/textures/grass.png",
    scene
  ); // babylonjs 에서 제공하는 texture
  groundMaterial.diffuseTexture = groundTexture;

  // object 생성
  const box = MeshBuilder.CreateBox("box", {}); // 상자 생성. 중심이 원점에 위치하도록 생성되며 name, option, scene 세가지의 매개변수를 받음
  box.position.y = 0.5;
  const roof = CreateCylinder("roof", {
    // 원기둥 생성
    diameter: 1.5, // 직경
    height: 1.5, // 높이
    tessellation: 3, // tessellation: 타일이라고 하는 도형들로 겹치지 않으면서 빈틈없게 공간을 채우는 것. 해당 메서드에서는 기둥의 밑면의 각을 의미함(원기둥인 경우 0, 삼각기둥인 경우 3)
  });

  const roofMaterial = new StandardMaterial("Roof Material");
  const roofTexture = new Texture(
    "https://assets.babylonjs.com/environments/roof.jpg"
  );
  roofMaterial.diffuseTexture = roofTexture;

  const boxMaterial = new StandardMaterial("Box Material");
  const boxTexture = new Texture(
    "https://www.babylonjs-playground.com/textures/floor.png"
  );
  boxMaterial.diffuseTexture = boxTexture;

  box.material = boxMaterial;
  roof.material = roofMaterial;
  roof.scaling.x = 0.75;
  roof.position.y = 1.25;
  roof.rotation.z = Tools.ToRadians(90);

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
