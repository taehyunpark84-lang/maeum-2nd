# 선택한 팀원 기능 반영 결과

2026-11-27. 확정한 12개 선택을 검토 브랜치에 반영한 뒤 사용자 확인을 거쳐 **로컬 main에 병합했습니다**(병합 커밋 `934dfe7`). 병합된 main에서 백엔드 81개·모바일 58개 및 타입 검사/린트가 통과했습니다. GitHub 푸시·운영 배포는 수행하지 않았습니다.

실제 AI 키·DB·설치 패키지·대용량 모델은 Git에 포함되지 않습니다. 실행 환경은 기존 **`C:\dev\maeum-review`**를 계속 사용하며, 아래 명령의 경로도 그 폴더입니다. main 폴더로 실행 환경을 복사하거나 서버를 자동 재시작하지 않았습니다.

## 구현 범위

- 최신 마음회의(사회자 + 감정 4인), 발언/입력 순서, 리마인더, 이전 3인 기록 지원 유지.
- 팀원 작품 공유 미리보기·익명/닉네임·피드·반응 3종·댓글 추가. 그림과 승인한 제목/설명만 공개하고 대화·시·해석·감정 점수는 공개 응답에서 제외.
- 소유자의 공유 취소·게시글 삭제와 확인창 추가. 게시글·반응·댓글을 제거하되 갤러리 원본/생성 기록 보존. 철회한 공유 이미지 URL은 404. 공유 응답은 `private, no-store`, 피드 이미지는 캐시 비사용. 이미 저장·캡처한 사본은 회수할 수 없음.
- 상담 꽃 카드 3개·작품 선택 시트는 팀원 구성 채택. 실제 연결은 준비 중으로 안내하며 실제 신청·담당자 계정·방/메시지 API·상담 테이블은 만들지 않음.
- 공통·나루·도담 프롬프트는 팀원 문구 채택(줄 끝 공백 정리만 수행). 가상 AI/안전 경계와 마음회의 프롬프트 유지.
- KoELECTRA 감정 분류 서버/모델 연결. 승인한 이야기의 분류 점수가 기준(기본 0.7) 이상이고 GPT 독립 판단과 일치할 때 그림 연출에 참고. 오류·불확실성·불일치 때 생략, 기획 취소/실패 시 대기 작업 정리. 정수 표시로 반올림하기 전 확률로 기준을 비교. 점수는 정확도 평가 결과가 아님.
- 최신 내부 표기 제거(`clean_art_story`), 개발 앱 ID/저장 키 분리, 공간·갤러리·오디오·화면 수정 유지.
- 온라인 하단 메뉴: 공간 · 마음 · 작품 피드 · 상담 · 갤러리. 서버 없는 기존 시연 화면 메뉴는 유지.

## 재실행

아래 명령을 **각각 별도 PowerShell 창**에서 실행합니다. 이미 실행 중인 서비스는 중복 실행하지 않습니다.

```powershell
cd C:\dev\maeum-review
.\scripts\run-local-development.ps1 api
```

```powershell
cd C:\dev\maeum-review
.\scripts\run-local-development.ps1 worker
```

```powershell
cd C:\dev\maeum-review
.\scripts\run-local-development.ps1 mobile
```

```powershell
cd C:\dev\maeum-review
.\scripts\run-local-development.ps1 emotion
```

- PC API: `http://127.0.0.1:8000/health`. 휴대폰용: `http://172.30.1.18:8000`.
- 같은 Wi-Fi의 휴대폰 Expo Go: `exp://172.30.1.18:8081`. 변경 후 앱을 새로고침합니다.
- 감정 서버: PC 내부 전용 `http://127.0.0.1:8001/health`. 휴대폰에서 직접 접근하지 않습니다.
- 각 실행 창의 `Ctrl+C`로 종료합니다. 자동 실행 정보는 Git 제외 `tmp/team-review/processes.json`에 있습니다. `api`/`worker`/`mobile` PID는 실행기, `emotion` PID는 서버 프로세스입니다. 경로와 역할을 확인하고 해당 프로세스만 종료합니다.
- 2026-11-27 사용자 요청으로 검토 backend 설정을 **AI_MODE=openai**로 전환했습니다. API/worker 재시작 후 실제 AI를 사용하며 API 비용이 발생합니다. 이전 시연 작품·대화는 자동으로 실제 결과로 바뀌지 않습니다.
- 감정 서버는 제공 모델을 CPU에서 실행합니다. 기존 개발 환경의 키를 Git 제외 검토 backend/.env에 연결했고 원본 환경은 보존했습니다. 현재 모델은 gpt-6.1-terra / gpt-image-2.6-flare입니다. 실제 텍스트 1회·그림 1회 생성/PNG 디코딩을 합성 입력으로 확인했습니다. 결과는 tmp/team-review/real-ai-verification.json에 있으며 앱 DB에 검증 기록을 넣지 않았습니다. API/worker를 직접 실행하던 창에서 각각 Ctrl+C 후 같은 명령으로 재시작하고 앱에서 로그아웃/재로그인합니다. /health의 ai_mode=openai를 확인하세요.

## 감정 환경 재설치

별도 Python 3.14.7 venv에 torch 2.15.0+cpu / transformers 5.22.1 / safetensors 0.8.0 및 전이 의존성을 설치하고 `scripts/emotion_server/requirements.lock.txt`에 고정했습니다.

```powershell
cd C:\dev\maeum-review
.\backend\.venv\Scripts\python.exe -m venv scripts/emotion_server/.venv
.\scripts\emotion_server\.venv\Scripts\python.exe -m pip install -r scripts/emotion_server/requirements.lock.txt
```

설정/토크나이저 및 `model-manifest.json`은 Git에 포함합니다. 대용량 `model.safetensors`는 Git 제외이며 이 PC에는 팀원 제공본을 복사했습니다. 새 PC에서는 같은 파일을 `scripts/emotion_server/koelectra_emotion6_multi_best/`에 준비해야 합니다. `training_args.bin`은 사용/복사하지 않았습니다. 로컬 파일·safetensors로만 모델을 로드하고 원격 코드를 실행하지 않습니다.

설치 문서: [PyTorch](https://pytorch.org/get-started/locally/), [Transformers](https://huggingface.co/docs/transformers/installation), [Expo SDK 58 Image](https://docs.expo.dev/versions/v58.0.0/sdk/image/).

## DB와 검증

- 사전 백업: `tmp/team-review/before-i118-community.db` (Git 제외).
- revision `i118_community_feed`는 `h117_mind_council` 다음의 단일 head. 게시글·반응·댓글 테이블 3개만 추가. 상담 테이블/팀원 개인 DB 복사 없음.
- 기존 16개 업무 테이블의 모든 행 해시·개수 보존, 스키마 검사·SQLite 무결성·외래 키 정상. 기록: `tmp/team-review/after-i118-verification.json`.
- 백엔드 **81개** 통과(22.56초): 기존 회의/그림, 공유 소유권/비공개 경계/반응/댓글/철회/원본 보존, 감정 조건/반올림 경계/실패 취소. 테스트 환경/DB는 개발용과 분리.
- 모바일 typecheck/lint, 테스트 **58개** 통과. 공유 전송 필드 제한 검사 포함.
- Android Hermes export 성공: **1,532 모듈 / 78 자산**, `tmp/team-review/android-export`. APK 설치 검증은 아님.
- 별도 임시 DB + 실제 HTTP API(8010) + 독립 작업자로 가입/로그인/대화/요약/PNG/공유/타인 조회/반응/댓글/철회/비공개 원본 보존 통과. 최신 마음회의 11개 발언 후 사용자 대기 및 상담 API 부재 확인. 검증 프로세스 종료. 개발 DB에 검증 계정/작품 추가 없음. 결과: `tmp/team-review/http-smoke/result.json`.
- 실제 감정 모델로 합성 문장 2개 HTTP 추론 및 백엔드 어댑터 연결, 라벨/확률/정수 합 100 확인. 결과: `tmp/team-review/emotion-verification.json`. 분류 정확도/치료 효과 평가가 아님.
- 사용자가 휴대폰 Expo Go에서 새 5개 메뉴와 상담 꽃 이미지 3개를 확인. 휴대폰 공유/철회 전체 조작·키보드/큰 글씨/접근성·iOS는 추가 확인 필요.
- 기존 Expo 잠금 버전과 현재 권장 패치 14개 차이는 남아 있으며 자동 업그레이드하지 않음.

실제 상담, 피드 신고/차단, 페이지 단위 목록 로딩, 운영 MySQL 동시 부하, 실제 AI 전체 생성은 미구현/미검증입니다. 위험 단어 횟수에 따른 강제 종료는 추가하지 않았으며 실제 서비스 안전 대응은 별도 검토 항목입니다. 구현 단계 이후 로컬 main 병합을 완료했으며 운영 배포·GitHub 푸시는 수행하지 않았습니다.
