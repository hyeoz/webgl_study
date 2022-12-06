"use strict";
// 셰이더 생성함수 작성
function loadShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}
// 프로그램으로 셰이더 연결
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
  var image = new Image();
  image.crossOrigin = "";
  image.src = "http://localhost:8080/webgl/resources/leaves.jpg";
  image.onload = function () {
    render(image);
  };
}

function render(image) {
  // canvas, gl 가져오기
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl");
  if (!gl) return;

  // 셰이더 불러오고 선언
  var vertexShaderSource = `
    attribute vec2 a_position;
    // 텍스쳐
    attribute vec2 a_texCoord;

    uniform vec2 u_resolution;
    // 베링
    varying vec2 v_texCoord;

    void main() {
        // 위치를 픽셀에서 0.0 과 1.0 사이로 변환
        vec2 zeroToOne = a_position / u_resolution;
        // 0~1에서 0~2로 변환
        vec2 zeroToTwo = zeroToOne * 2.0;
        // 0~2에서 -1~+1로 변환(클립공간)
        vec2 clipSpace = zeroToTwo - 1.0;

        // WebGL은 양수 Y를 위쪽으로, 음수 Y를 아래쪽으로 간주하는 반면 클립 공간에서 좌측 하단 모서리는 -1, -1이 됨. 이것을 바꾸기위해 Y좌표를 뒤집어줌
        // gl_Position = vec4(clipSpace, 0, 1);
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

        v_texCoord = a_texCoord;
    }
  `;
  var fragmentShaderSource = `
    precision mediump float;

    // 색상 유니폼
    // uniform vec4 u_color;
    // 텍스쳐
    uniform sampler2D u_image;
    // 실제로 다른 픽셀을 보는 이미지 처리
    uniform vec2 u_textureSize;

    // 정점 셰이더에서 전달된 텍스쳐 좌표
    varying vec2 v_texCoord;
    
    void main() {
      // 텍스쳐 좌표의 1픽셀 계산
      vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

      // 완쪽, 중앙, 오른쪽 픽셀 평균화 (보간)
        gl_FragColor = (
          texture2D(u_image, v_texCoord) + 
          texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) + 
          texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0))
        ) / 3.0;
    }
  `;

  var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  // 프로그램 선언
  var program = loadProgram(gl, vertexShader, fragmentShader);

  // 속성위치 찾기
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

  // 속성은 버퍼에서 데이터를 가져오기 떄문에 버퍼 생성하기
  var positionBuffer = gl.createBuffer(); // 위치 버퍼

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  setRectangle(gl, 0, 0, image.width, image.height); // 이미지와 같은 크기의 사각형 셋팅

  var texCoordBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

  gl.bufferData(
    gl.ARRAY_BUFFER, // 바인딩한 버퍼
    new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]), // 강력한 타입을 가지는 32비트 부동 소수점 배열 생성
    gl.STATIC_DRAW // 위치데이터가 바뀌지않는 정적 데이터라는 것을 의미
  );

  // 텍스쳐 생성
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // 이미지 크기에 상관없이 렌더링 할 수 있도록 매개변수 설정
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // 텍스쳐에 이미지 업로드
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // 캔버스 크기를 조절한다면 클립공간(-1~+1)에서 픽셀로 변환하는 법과 그러한 변환이 캔버스의 어떤 부분에서 이루어져야 하는지 알려줘야 함
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // 캔버스 투명하게
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 실행할 프로그램 알려줌
  gl.useProgram(program);

  // 위에서 설정한 버퍼에서 데이터를 가져와 셰이더의 속성에 제공하는 방법을 알려줘야 함
  // 속성 활성화
  gl.enableVertexAttribArray(positionLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var size = 2; // 반복마다 2개의 컴포넌트
  var type = gl.FLOAT; // 데이터는 32비트 부동 소수점
  var normalize = false; // 정규화 여부. 정규화는 데이터가 일정 범위 내에 있도록 데이터를 가공하는 것
  var stride = 0; // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
  var offset = 0; // 버퍼의 처음부터 시작

  gl.vertexAttribPointer(
    positionLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  gl.enableVertexAttribArray(texCoordLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer

  gl.vertexAttribPointer(
    texCoordLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // 프로그램 설정 후 유니폼 값 설정 가능
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(textureSizeLocation, image.width, image.height);

  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);
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

main();
