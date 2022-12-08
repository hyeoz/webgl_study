"use strict";
// -----------------
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
  // canvas, gl 가져오기
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl");
  if (!gl) return console.log("THERE IS NO WEBGL");

  // 셰이더 불러오고 선언
  //   var vertexShaderSource = `
  //         attribute vec4 a_position;

  //         void main() {
  //             gl_Position = a_position;
  //         }
  //       `;
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
          // gl_Position = vec4(clipSpace, 0, 1);
      }
    `;
  var fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    
    void main() {
        gl_FragColor = vec4(1,0,0.5,1);
        // 색상 유니폼 입력을 가져올 수 있음
        // gl_FragColor = u_color;
    }
  `;

  var vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  // 프로그램 선언
  var program = loadProgram(gl, vertexShader, fragmentShader);

  // 속성위치 찾기
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  // 정점 셰이더 유니폼 사용하는 경우 유니폼 위치 찾기
  var resolutionUniformLocation = gl.getUniformLocation(
    program,
    "u_resolution"
  );
  // 프래그먼트 셰이더 유니폼 사용하는 경우 유니폼 위치 찾기
  var colorUniformLocation = gl.getUniformLocation(program, "u_color");

  // 속성은 버퍼에서 데이터를 가져오기 떄문에 버퍼 생성하기
  var positionBuffer = gl.createBuffer();
  // 버퍼 바인딩 -> positionBuffer 라는 바인딩포인트를 ARRAY_BUFFER 에 바인딩함
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 2D 정점 3개
  //   var positions = [0, 0, 0, 0.5, 0.7, 0];
  // 각각 3개의 점으로 이루어진 삼각형 두개로 만드는 사각형
  var positions = [10, 20, 80, 20, 10, 30, 10, 30, 80, 20, 80, 30];
  gl.bufferData(
    gl.ARRAY_BUFFER, // 바인딩한 버퍼
    new Float32Array(positions), // 강력한 타입을 가지는 32비트 부동 소수점 배열 생성
    gl.STATIC_DRAW // 위치데이터가 바뀌지않는 정적 데이터라는 것을 의미
  );

  // ---- 여기까지 초기화코드. 페이지를 로드할 때 한 번 실행됩니다

  // ---- 렌더링
  // 캔버스 크기 조절. CSS 를 통해 유연하게 조절할 수 있도록 도우미 함수를 사용합니다
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  // 캔버스 크기를 조절한다면 클립공간(-1~+1)에서 픽셀로 변환하는 법과 그러한 변환이 캔버스의 어떤 부분에서 이루어져야 하는지 알려줘야 함
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // 캔버스 투명하게
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // 실행할 프로그램 알려줌
  gl.useProgram(program);

  // 프로그램 설정 후 유니폼 값 설정 가능
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  // 위에서 설정한 버퍼에서 데이터를 가져와 셰이더의 속성에 제공하는 방법을 알려줘야 함
  // 속성 활성화
  gl.enableVertexAttribArray(positionAttributeLocation);

  // 어떤 데이터를 꺼낼 지 지정
  // 위치 버퍼 할당 -> Q. 초기화 단계에서 바인딩 했는데 한 번 더 해야하는지?
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // positionBuffer(ARRAY_BUFFER)의 데이터를 꺼내오는 방법을 속성에 지시
  var size = 2; // 반복마다 2개의 컴포넌트
  var type = gl.FLOAT; // 데이터는 32비트 부동 소수점
  var normalize = false; // 정규화 여부. 정규화는 데이터가 일정 범위 내에 있도록 데이터를 가공하는 것
  var stride = 0; // 0 = 다음 위치를 가져오기 위해 반복마다 size * sizeof(type) 만큼 앞으로 이동
  var offset = 0; // 버퍼의 처음부터 시작
  // vertexAttribPointer 는 현재 바인딩된 ARRAY_BUFFER 를 현재 정점 버퍼 객체의 일반 정점 속성에 바인딩하는 것을 의미
  // -> ARRAY_BUFFER 바인드 포인트에 다른 것을 바인딩 할 수 있음. 하지만 다른 것을 바인딩해도 속성은 계속 positionBUffer 를 사용함
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // 랜덤 사각형 50개 생성
  //   for (var ii = 0; ii < 50; ++ii) {
  //     setRectangle(
  //       gl,
  //       randomInt(300),
  //       randomInt(300),
  //       randomInt(300),
  //       randomInt(300)
  //     );
  //     gl.uniform4f(
  //       colorUniformLocation,
  //       Math.random(),
  //       Math.random(),
  //       Math.random(),
  //       1
  //     );

  //     var primitiveType = gl.TRIANGLES;
  //     var offset = 0;
  //     var count = 6;
  //     gl.drawArrays(primitiveType, offset, count);
  //   }

  /* 현재 속성위치를 a_position 애서 찾고있는데, GLSL의 관점에서 a_position 은 vec4 로 (x,y,z,w) 4개의 부동소수점 값이다. 기본값은 (0,0,0,1)이다
    렌더링시 size = 2 로 지정했기 때문에 이 속성은 버퍼의 처음 2개의 값 x,y 값을 가져옴. z,w 값은 기본값인 0,1 이 됨
    -> 위치를 픽셀로 제공하고 클립공간으로 변환할 수 있도록 vec2로 수정 */

  // GLSL 프로그램을 실행하도록 WebGL 에 요청
  var primitiveType = gl.TRIANGLES; // 정점 셰이더가 실행될때마다 gl.Position 에 설정한 3개의 값을 기반으로 삼각형을 그림
  var offset = 0;
  //   var count = 3; // 정점 셰이더를 3번 실행함
  var count = 6; // 삼각형 두개 그리기 위해 정점 셰이더 6번 호출
  gl.drawArrays(primitiveType, offset, count);
}

// 0부터 range -1 까지의 랜덤 정수를 return 하는 함수
//   function randomInt(range) {
//     return Math.floor(Math.random() * range);
//   }
// 사각형 정의하는 랜덤값을 버퍼로 담기
//   function setRectangle(gl, x, y, width, height) {
//     var x1 = x;
//     var x2 = x + width;
//     var y1 = y;
//     var y2 = y + height;
//     gl.bufferData(
//       gl.ARRAY_BUFFER,
//       new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
//       gl.STATIC_DRAW
//     );
//   }
window.onload = main;
