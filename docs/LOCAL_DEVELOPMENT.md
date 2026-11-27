# 개발 worktree 로컬 실행

2026-11-27 기준. 이 문서는 `codex/development`의 로컬 실행 안내입니다. 기존 클라우드 앱·VM·DB·배포 설정을 변경하지 않습니다.

- 작업 경로: `C:\Users\smhrd1\.codex\worktrees\70e0\maeum-latest`
- API: `http://172.30.1.18:8000`, PC 확인: `http://127.0.0.1:8000/health`
- Expo Go: `exp://172.30.1.18:8081`, 표시 이름: **마음이 머무는 곳 개발**
- 개발 DB: `backend/storage/maeum-development.db`, 마이그레이션 `g116_discussions`
- 현재 `AI_MODE=openai`: 사용자 키 입력 후 로컬 API와 작업자를 재시작했습니다. localhost/LAN health의 openai 표시, 두 모델 접근, 실제 텍스트 응답과 이미지 생성·디코딩을 확인했습니다. 최초 mock 검증 기록과 구분합니다.

## 준비된 환경

독립 설치된 Python 3.14.7 (`C:\Users\smhrd1\AppData\Local\Python\pythoncore-3.14-64\python.exe`)로 `backend/.venv`를 새로 만들었습니다. Node 24.21.0 / npm 11.19.0을 사용하며 npm shim 문제를 피하도록 실행 스크립트에서 현재 터미널 PATH만 지정합니다. 기존 두 lockfile의 버전은 유지했습니다.

두 `.env`, `.venv`, `node_modules`, SQLite, 생성 그림, 로그·PID·QR은 Git 제외입니다. 원본 폴더에서 환경·키·DB·이미지·의존성을 복사하지 않았습니다. 개발 DB는 새로 생성했습니다.

`backend/.env`의 `DATA_DIR`은 이 worktree의 `backend/storage` 절대 경로, `DATABASE_URL`은 그 안의 `maeum-development.db`입니다. API와 작업자는 동일 설정을 읽습니다.

실제 AI 전환 설정은 `AI_MODE=openai`, `TEXT_MODEL=gpt-6.1-terra`, `IMAGE_MODEL=gpt-image-2.6-flare`입니다. 사용자가 이 worktree의 `backend/.env`에만 `OPENAI_API_KEY`를 직접 입력합니다. 키를 모바일·Git·채팅에 넣지 않습니다. 실제 AI 요청에는 API 비용이 발생합니다. 실행기는 openai 모드에서 키가 비어 있으면 시작을 중단합니다. 서버 없는 시연으로 돌아가는 모바일 mock과 서버의 AI mock은 별도 설정입니다.

키 저장 후 대기/진행 중 그림 작업이 없는지 확인하고 API와 작업자를 모두 재시작합니다. `/health`의 `ai_mode=openai`는 모드 적용 확인이며 모델 호출 성공을 보장하지 않습니다. 모델 접근·실제 응답은 별도로 확인합니다. 앱의 모드 표시는 로그인 응답을 사용하므로 로그아웃 후 재로그인합니다. 기존 시연 대화·작품은 자동으로 실제 AI 결과가 되지 않습니다.

`mobile/.env`:

```dotenv
EXPO_PUBLIC_APP_MODE=api
EXPO_PUBLIC_API_URL=http://172.30.1.18:8000
EXPO_PUBLIC_LOCAL_DEVELOPMENT=1
```

개발 플래그는 앱 이름·slug·scheme·네이티브 ID와 모바일 로그인 토큰/로컬 기록/생각방 시연 저장 키를 분리합니다. 개발 플래그가 없으면 기존 설정과 저장 키를 유지합니다. 기존 `app.json`, EAS 및 클라우드 배포 파일은 수정하지 않았습니다. 설치된 운영 APK는 주소가 자동 변경되지 않으며, 이번에는 Expo Go의 개발 프로젝트를 엽니다.

## 실행과 종료

PowerShell 창 세 개에서 각각 아래처럼 실행합니다. 먼저 루트 폴더로 이동하세요.

```powershell
cd C:\Users\smhrd1\.codex\worktrees\70e0\maeum-latest
.\scripts\run-local-development.ps1 api
```

```powershell
cd C:\Users\smhrd1\.codex\worktrees\70e0\maeum-latest
.\scripts\run-local-development.ps1 worker
```

```powershell
cd C:\Users\smhrd1\.codex\worktrees\70e0\maeum-latest
.\scripts\run-local-development.ps1 mobile
```

이 실행기는 개발 DB 경로와 AI 모드, openai 모드의 키 존재 여부를 검사합니다. 모바일은 API 주소가 이 PC의 현재 주소인지 검사하고 같은 주소를 Metro에 사용합니다. Wi-Fi 주소가 바뀌면 `mobile/.env`를 수정하고 Expo를 재시작합니다. 각 창에서 `Ctrl+C`로 종료합니다. 이미 실행 중이면 중복 시작하지 마세요.

이번 준비 중에는 숨김 프로세스로 실행했습니다. 개별 실행 PID는 `tmp/local-development/processes.json`, 로그는 같은 폴더의 `api`, `worker`, `mobile` stdout/stderr 파일입니다. 종료할 때 해당 PID의 경로·자식 프로세스를 확인한 후 이번 프로세스만 종료하세요. 다른 프로젝트의 Python/Node를 일괄 종료하지 않습니다.

## 휴대폰

1. PC와 같은 Wi-Fi에 연결합니다. 휴대폰 브라우저에서 [로컬 health](http://172.30.1.18:8000/health)의 `ok / mock`을 확인합니다.
2. Expo Go에서 `exp://172.30.1.18:8081`을 열거나 실행 창의 QR을 스캔합니다. 이번 QR PNG는 `tmp/local-development/expo-go-qr.png`입니다.
3. 개발용 계정을 새로 만듭니다. 클라우드 계정·작품은 이 DB로 이관되지 않습니다. 공간에서 대화 → 요약 확인 → 그림일기 생성 → 갤러리를 확인합니다.
4. PC API와 그림 작업자, Metro가 모두 실행 중이어야 합니다. 현재 Wi-Fi는 Public 프로필이며 방화벽 변경 없이 휴대폰 health 접근을 사용자가 확인했습니다.

Android Expo Go의 사진첩 저장 제한은 기존과 같습니다. 독립 APK 및 iOS 확인은 이번 검증에 포함하지 않습니다.

## 검증 결과와 남은 항목

- `pip check` 통과, Alembic upgrade/check 통과. 최초 업무 테이블 16개 0건, SQLite 무결성/외래 키 정상.
- 백엔드 격리 pytest 51개 통과. 개발 DB와 분리된 임시 SQLite에서 실제 HTTP API와 독립 작업자 프로세스로 가입·로그인·채팅·요약·작업 접수·일기 완료·PNG 수신 통과.
- 모바일 typecheck/lint 통과, 개발/기존 설정·저장 키 분리 검사 포함 테스트 49개 통과. 개발 앱 매니페스트의 이름·slug·네이티브 ID 및 LAN 번들 주소 확인. 휴대폰 요청에 Android 번들 생성 성공(1656 모듈).
- PC localhost/LAN health HTTP 200 및 Expo `/status` 정상. 휴대폰 브라우저의 health `ok / mock`은 사용자 확인.
- `expo install --check`는 최신 권장 버전과 14개 차이로 실패했습니다. npm 설치 audit는 moderate 10건을 보고했습니다. 자동 업그레이드·audit fix는 하지 않았으며, 이후 의존성 갱신 시 별도 회귀 검증이 필요합니다.
- 휴대폰 Expo Go 연결과 최초 시연모드 표시는 사용자 확인. 로컬 API에 휴대폰 요청 HTTP 200 확인. 이후 로컬 실제 AI 전환 완료, 모델 접근·합성 텍스트 응답 1회·합성 그림 생성 1회 및 이미지 디코딩 통과. 검증 결과는 Git 제외 `tmp/local-development/openai-verification.json`, 그림은 같은 폴더 `openai-smoke.png`입니다. 검증은 앱과 같은 SDK/모델 인자를 사용했으며 개발 DB에 검증용 대화·작품을 넣지 않았습니다. 실제 AI 모드에서 휴대폰 재로그인 및 앱 전체 그림일기 흐름은 별도 사용자 확인 필요.

설정 방식은 [Expo 환경변수](https://docs.expo.dev/guides/environment-variables/)와 [동적 앱 설정](https://docs.expo.dev/workflow/configuration/), 설치 시 [SDK 58 문서](https://docs.expo.dev/versions/v58.0.0/)를 확인했습니다.
