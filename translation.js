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

    void main() {
        // 위치를 픽셀에서 0.0 과 1.0 사이로 변환
        vec2 zeroToOne = a_position / u_resolution;
        // 0~1에서 0~2로 변환
        vec2 zeroToTwo = zeroToOne * 2.0;
        // 0~2에서 -1~+1로 변환(클립공간)
        vec2 clipSpace = zeroToTwo - 1.0;
        // WebGL은 양수 Y를 위쪽으로, 음수 Y를 아래쪽으로 간주하는 반면 클립 공간에서 좌측 하단 모서리는 -1, -1이 됨. 이것을 바꾸기위해 Y좌표를 뒤집어줌
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

  var positionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var translation = [0, 0];
  var width = 100;
  var height = 30;
  var color = [Math.random(), Math.random(), Math.random(), 1];

  drawScene();

  // 슬라이더 UI
  webglLessonsUI.setupSlider("#x", {
    slider: updatePosition(0),
    max: gl.canvas.width,
  });
  webglLessonsUI.setupSlider("#y", {
    slider: updatePosition(1),
    max: gl.canvas.height,
  });

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

    setRectangle(gl, translation[0], translation[1], width, height);

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

    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
  }
}

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

window.onload = main;
