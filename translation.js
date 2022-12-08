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

    uniform vec2 u_resolution;
    uniform vec2 u_translation;

    void main() {
        vec2 position = a_position + u_translation;

        vec2 zeroToOne = position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
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
  var translationLocation = gl.getUniformLocation(program, "u_translation");

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl); // 버퍼 바인딩 후 버퍼에 지오메트리 데이터 넣기

  var translation = [0, 0]; // x, y축 위치
  var color = [Math.random(), Math.random(), Math.random(), 1]; // 렌더링 될 때마다 랜덤 컬러

  drawScene(); // 사각형 렌더링

  // 슬라이더 UI
  webglLessonsUI.setupSlider("#x", {
    slider: updatePosition(0),
    max: gl.canvas.width,
  });
  webglLessonsUI.setupSlider("#y", {
    slider: updatePosition(1),
    max: gl.canvas.height,
  });

  // 슬라이더 움직일 때마다 사각형 다시 렌더링
  function updatePosition(index) {
    return function (event, ui) {
      translation[index] = ui.value;
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

    gl.uniform2fv(translationLocation, translation);

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 30; // M 그릴 때 필요한 삼각형 10개
    gl.drawArrays(primitiveType, offset, count);
  }
}

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
