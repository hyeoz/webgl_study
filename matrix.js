"use strict";

function loadShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function loadProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
}

function main() {
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl");
  if (!gl) return;

  var vertexShaderSource = `
      attribute vec2 a_position;
  
      uniform mat3 u_matrix; // 3X3 행렬

      void main() {
        // 위치에 행렬 곱하기
        gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
      }
    `;
  var fragmentShaderSource = `
      precision mediump float;
  
      uniform vec4 u_color;
  
      void main() {
          gl_FragColor = u_color;
      }
    `;

  var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  var program = loadProgram(gl, vertexShader, fragmentShader);

  var positionLocation = gl.getAttribLocation(program, "a_position");

  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var colorLocation = gl.getUniformLocation(program, "u_color");
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl); // 버퍼 바인딩 후 버퍼에 지오메트리 데이터 넣기

  var translation = [100, 150]; // x, y축 위치
  //   var rotation = [0, 1]; // 반지름이 1인 단위원 기준으로 회전하는 위치의 x,y 좌표
  var angleInRadians = 0;
  var scale = [1, 1];
  var color = [Math.random(), Math.random(), Math.random(), 1]; // 렌더링 될 때마다 랜덤 컬러

  drawScene(); // 사각형 렌더링

  // 슬라이더 UI
  webglLessonsUI.setupSlider("#x", {
    slide: updatePosition(0),
    max: gl.canvas.width,
  });
  webglLessonsUI.setupSlider("#y", {
    slide: updatePosition(1),
    max: gl.canvas.height,
  });
  //   $("#rotation").gmanUnitCircle({
  //     width: 200,
  //     height: 200,
  //     value: 0,
  //     slide: function (e, u) {
  //       rotation[0] = u.x;
  //       rotation[1] = u.y;
  //       drawScene();
  //     },
  //   });

  // sin / cos 로 각도 조절 가능
  webglLessonsUI.setupSlider("#angle", { slide: updateAngle, max: 360 });
  webglLessonsUI.setupSlider("#scaleX", {
    value: scale[0],
    slide: updateScale(0),
    min: -5,
    max: 5,
    step: 0.01,
    precision: 2,
  });
  webglLessonsUI.setupSlider("#scaleY", {
    value: scale[1],
    slide: updateScale(1),
    min: -5,
    max: 5,
    step: 0.01,
    precision: 2,
  });

  // 슬라이더 움직일 때마다 사각형 다시 렌더링
  function updatePosition(index) {
    return function (event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }
  function updateAngle(event, ui) {
    var angleInDegrees = 360 - ui.value;
    angleInRadians = (angleInDegrees * Math.PI) / 180;
    drawScene();
  }
  function updateScale(index) {
    return function (event, ui) {
      scale[index] = ui.value;
      drawScene();
    };
  }

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var size = 2;
    var type = gl.FLOAT;
    var normalize = false;
    var stride = 0;
    var offset = 0;
    gl.vertexAttribPointer(
      positionLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    gl.uniform4fv(colorLocation, color);

    // 행렬 계산
    var projectionMatrix = m3.projection(
      gl.canvas.clientWidth,
      gl.canvas.clientHeight
    );
    var translationMatrix = m3.translation(translation[0], translation[1]);
    var rotationMatrix = m3.rotation(angleInRadians);
    var scaleMatrix = m3.scaling(scale[0], scale[1]);

    var matrix = m3.multiply(projectionMatrix, translationMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);

    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 30; // M 그릴 때 필요한 삼각형 10개
    gl.drawArrays(primitiveType, offset, count);
  }
}

var m3 = {
  // 셰이더 정리, projection
  projection: function (width, height) {
    return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
  },
  // initialize
  identify: function () {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  },
  // 평행이동
  translation: function (tx, ty) {
    return [1, 0, 0, 0, 1, 0, tx, ty, 1];
  },
  // 회전
  rotation: function (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [c, -s, 0, s, c, 0, 0, 0, 1];
  },
  // 스케일
  scaling: function (sx, sy) {
    return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
  },
  // 행렬곱
  multiply: function (a, b) {
    // 배열로 행렬 구조 만들기
    /* 
        a00 a10 a20
        a01 a11 a21
        a02 a12 a22
    */
    var a00 = a[0 * 3 + 0]; // a[0]
    var a01 = a[0 * 3 + 1]; // a[1]
    var a02 = a[0 * 3 + 2]; // a[2]
    var a10 = a[1 * 3 + 0]; // a[3]
    var a11 = a[1 * 3 + 1]; // a[4]
    var a12 = a[1 * 3 + 2]; // a[5]
    var a20 = a[2 * 3 + 0]; // a[6]
    var a21 = a[2 * 3 + 1]; // a[7]
    var a22 = a[2 * 3 + 2]; // a[8]

    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];

    return [
      a00 * b00 + a10 * b01 + a20 * b02,
      a01 * b00 + a11 * b01 + a21 * b02,
      a02 * b00 + a12 * b01 + a22 * b02,

      a00 * b10 + a10 * b11 + a20 * b12,
      a01 * b10 + a11 * b11 + a21 * b12,
      a02 * b10 + a12 * b11 + a22 * b12,

      a00 * b20 + a10 * b21 + a20 * b22,
      a01 * b20 + a11 * b21 + a21 * b22,
      a02 * b20 + a12 * b21 + a22 * b22,
    ];
  },
};

// 삼각형을 사용하여 글자를 생성하는 함수
// M 작성하도록 행렬 작성
function setGeometry(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0, 0, 30, 0, 0, 150,

      0, 150, 30, 0, 30, 150,

      30, 0, 90, 0, 30, 30,

      30, 30, 90, 0, 90, 30,

      90, 0, 120, 0, 90, 150,

      90, 150, 120, 0, 120, 150,

      120, 0, 180, 0, 120, 30,

      120, 30, 180, 0, 180, 30,

      180, 0, 210, 0, 180, 150,

      180, 150, 210, 0, 210, 150,
    ]),
    gl.STATIC_DRAW
  );
}

window.onload = main;
// main();
