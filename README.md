# 사주 만세력

생년월일시로 사주팔자를 세우고 오행·십성·일간 성향·신살·용신(개운법)·대운·세운·오늘의 운세·궁합을 풀이하는 정적 웹사이트입니다.
맨 위 버튼으로 세 가지 디자인 시안(A 묵향 · B 성운 · C 산뜻)을 바꿔 볼 수 있습니다.

## 여는 법

- **가장 쉬운 방법:** `사주보기.html`을 더블클릭하세요. 서버 없이 브라우저에서 바로 열립니다.
- **개발용 로컬 서버:** `powershell -ExecutionPolicy Bypass -File serve.ps1` 실행 후 http://localhost:8080

## 파일 구성

| 파일 | 내용 |
|---|---|
| `index.html`, `style.css`, `app.js` | 사이트 원본 (화면 · 세 가지 시안 · 로직) |
| `content.js` | 일간·오행·십성·신살·용어사전 등 풀이 문구 |
| `vendor/ssaju.mjs` | 사주 계산 엔진 [golbin/ssaju](https://github.com/golbin/ssaju) v0.2.0 빌드 (MIT) |
| `build.ps1` | 원본을 하나로 합쳐 `사주보기.html` 생성 |
| `serve.ps1` | 간단한 로컬 정적 서버 |

원본을 고친 뒤에는 `powershell -ExecutionPolicy Bypass -File build.ps1`로 `사주보기.html`을 다시 만드세요.

## 참고

1900–2099년 출생을 지원하며 입춘·절기 기준으로 계산합니다. 풀이는 전통 명리 해석을 바탕으로 한 참고용 콘텐츠입니다.
