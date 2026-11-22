# maeum-2nd 로컬 실행 안내

> 2026-11-22 클라우드 전환: 모바일 .env는 https://34.158.202.133을 사용합니다. API·그림 작업자는 VM에서 실행되므로 현재 앱 사용에는 아래 로컬 API/작업자 실행이 필요하지 않습니다. 모바일 폴더에서 npm.cmd start -- --clear로 Expo만 시작하세요. 현재 VM은 mock AI입니다. 최신 상태는 [VM 실행 안내](docs/MAEUM_VM_RUNBOOK.md)를 따르며 아래는 로컬 실행 복구용 기록입니다.

작업 경로: `C:\maeum-2nd` (Windows). 2026-11-21 최초 독립 이전.
이 문서는 원본 PC를 기준으로 한 기존 README/실행방법.txt보다 우선합니다.

## 독립 설정

| 항목 | 값 |
| --- | --- |
| 앱 표시 이름 | 마음이 머무는 곳 2nd |
| Expo slug / scheme | maeum-2nd / maeum2nd |
| npm 패키지 | maeum-2nd-mobile |
| Android / iOS ID | com.taehyun.park.maeum2nd |
| 로컬 저장 / 로그인 토큰 키 | maeum2nd.local.v1 / maeum2nd.api.token |
| SQLite | C:/maeum-2nd/backend/storage/maeum-2nd.db |
| DATA_DIR | C:/maeum-2nd/backend/storage |
| 모바일 API 주소 | http://192.168.0.4:8000 |
| 서버 / 모바일 모드 | AI_MODE=mock / EXPO_PUBLIC_APP_MODE=api |

Node 24.21.0, npm 11.19.0, Git 2.56.0.windows.2. Python 3.12.10을 공식 서명 설치 파일로 `backend/.runtime/python312-official`에 새로 설치하고 `backend/.venv`를 생성했습니다. 이전 PC의 런타임·가상환경을 재사용하지 않습니다. 전역 Python PATH는 변경하지 않습니다.

Expo SDK 58 / React Native 0.88.1 / React 19.3.0 및 의존성 버전은 잠금 파일을 유지합니다. 공식 [SDK 58 호환 표](https://docs.expo.dev/versions/v58.0.0/)와 [앱 식별자 설정](https://docs.expo.dev/versions/v58.0.0/config/app/)을 확인했습니다. Python 설치 출처: [Python 3.12.10](https://www.python.org/downloads/release/python-31210/).

새 루트 Git은 원격이 없습니다. 원본 GitHub에 push하지 않았고 새 원격도 만들지 않았습니다. 원본 `extra.eas.projectId`를 제거했으며 EAS build/update/submit을 하지 않았습니다. Codex 사이드바 표시 이름은 필요하면 사용자가 `maeum-2nd`로 지정하세요.

## 실행 — PowerShell 창 3개

API:

```powershell
cd C:\maeum-2nd\backend
.\run-server.cmd
# 동일 명령:
# .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

작업자:

```powershell
cd C:\maeum-2nd\backend
.\run-worker.cmd
# 동일 명령:
# .\.venv\Scripts\python.exe -m app.worker
```

Expo:

```powershell
cd C:\maeum-2nd\mobile
npm.cmd start -- --clear
```

종료: 각 실행 창에서 `Ctrl+C`. cmd 배치 종료 확인이 나오면 `Y`. 다른 프로젝트의 Python/Node 프로세스를 일괄 종료하지 마세요. 재시작 전에 이전 실행 창을 종료하여 8000/8081 포트를 중복 사용하지 않습니다. API·작업자·Expo는 서로 다른 프로세스이며 Expo만 실행하면 서버가 시작되지 않습니다.

PC에서 `http://127.0.0.1:8000/health` 또는 `http://192.168.0.4:8000/health`를 열어 `status: ok`, `ai_mode: mock`을 확인합니다. 정상 사용 시 계정과 기록은 계속 보존되며 실행할 때마다 삭제하는 코드는 없습니다.

## 휴대폰 연결

1. PC와 휴대폰을 같은 Wi-Fi에 연결합니다. SDK 58을 지원하는 Expo Go에서 새 QR을 엽니다. 이 프로젝트 전용 개발 빌드는 새 네이티브 ID로 별도 설치해야 합니다.
2. 휴대폰 브라우저에서 `http://192.168.0.4:8000/health`를 확인합니다. IP가 바뀌면 `mobile/.env`의 API 주소를 바꾸고 Expo를 `--clear`로 재시작합니다.
3. 연결되지 않으면 VPN·게스트 Wi-Fi·AP 기기 격리·Windows 네트워크 프로필을 확인합니다. 필요한 경우 신뢰하는 사설 네트워크에서 Python/Node 또는 TCP 8000/8081만 허용합니다. 방화벽 전체를 끄지 않습니다.
4. Android 기본 에뮬레이터 전용 주소는 `http://10.0.2.2:8000`입니다. 실제 휴대폰에서 localhost는 PC가 아닙니다.
5. 첫 화면은 로그인/회원가입이어야 하며 이전 계정으로 자동 로그인되면 안 됩니다. 확인 후 사용자가 새로 가입합니다. 준비 검증 중 기본 DB에 테스트 계정을 넣지 않습니다.

기존 Expo Go 전체 데이터나 다른 앱의 저장소를 지우지 않습니다. 새로운 저장 키를 사용하고 기존 서버·세션별 작품 캐시 분리 및 로그아웃 정리 코드는 유지합니다.

이번 PC의 Wi-Fi는 **Public 프로필**이며 Domain/Private/Public 방화벽이 모두 켜져 있습니다. 방화벽 설정은 변경하지 않았습니다. PC 자체의 LAN 응답은 확인했지만 휴대폰에서 들어오는 연결은 아직 확인하지 않았으므로 필요할 때 신뢰하는 Wi-Fi의 네트워크 프로필과 허용 규칙을 점검하세요.

## 설치 복구와 검증

의존성이 없을 때만 실행합니다. 이 명령들은 사용자 DB를 초기화하지 않습니다.

```powershell
cd C:\maeum-2nd\mobile
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npx.cmd expo install --check

cd C:\maeum-2nd\backend
.\.runtime\python312-official\python.exe -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic check
.\.venv\Scripts\python.exe -m pytest -q
```

`backend/.env`는 이 복사본 내부의 DB/저장 경로를 명시합니다. `.env`가 환경변수보다 우선하며 실제 키는 비어 있습니다. `PYTHON_DOTENV_DISABLED`를 전역으로 설정하지 마세요. 폴더를 옮기면 `.env` 절대 경로와 가상환경을 갱신해야 합니다.

`backend/verify_empty_local.py`는 **최초 이전 상태 확인용 읽기 전용 검사**입니다. 정상 사용으로 기록을 만든 이후에는 실패하는 것이 정상입니다. 실패했다고 DB를 삭제하지 마세요. pytest는 실제 `.env` 읽기를 차단하고 별도 임시 DB와 이미지 경로를 사용합니다.

## 실제 AI 전환은 이후 선택

현재는 실제 로그인·SQLite·작업 큐를 사용하고 AI 답변/그림만 고정 시연합니다. 맞춤 AI 생성이 아니며 유료 호출을 하지 않습니다.
실제 AI를 원할 때 `backend/.env`에만 사용자가 직접 새 키를 입력하고 `AI_MODE=openai`로 변경하세요. 그 시점에 계정의 모델 접근 권한과 `TEXT_MODEL`, `IMAGE_MODEL`, `app/tuning.py`의 인자 호환성을 확인한 뒤 API와 작업자를 모두 재시작합니다. 실제 호출에는 비용이 발생할 수 있습니다. 키를 채팅이나 EXPO_PUBLIC 변수에 넣지 마세요. 모델 값이 존재한다고 접근 가능함을 보장하지 않습니다.

클라우드 단계는 [별도 계획](docs/MAEUM_2ND_CLOUD_PLAN.md)에 기록했습니다. 이번에는 VM/MySQL 접속이나 클라우드 자원 변경을 하지 않습니다.

## 이번 PC의 검증 결과

- 설치: `npm ci` 완료(808개). Python 잠금 패키지 39개 버전 일치, `pip check` 통과. 연결 제한/다운로드 끊김으로 재시도했으며 npm은 `--maxsockets=4 --fetch-timeout=600000 --fetch-retries=4`로 완료했습니다.
- 모바일: typecheck, lint(경고 0), 테스트 19개 통과.
- 백엔드: 격리 pytest 39개 통과. 제한 환경에서 멈춘 실행은 종료하고 권한 있는 실행으로 확인했습니다.
- DB: Alembic upgrade head 및 check 통과. 업무 테이블 13개 모두 0건, alembic_version만 1건. integrity_check/foreign_key_check 정상, 생성 이미지·썸네일·백업 없음. 테스트 이후 재검사도 통과했습니다.
- Expo 호환성: 설치된 SDK의 로컬 의존성 표는 통과. 온라인 `expo install --check`는 최신 권장 패치와 차이로 실패했습니다. 기존 버전 유지 요구에 따라 자동 업데이트하지 않았습니다.
- 온라인 권장 차이: expo 58.0.23→58.0.26, @expo/ui 58.0.27→58.0.29, constants 58.0.15→58.0.16, file-system 58.0.13→58.0.14, font 58.0.11→58.0.12, linear-gradient 58.0.3→58.0.4, linking 58.0.16→58.0.17, router 58.0.30→58.0.32, splash-screen 58.0.13→58.0.14, status-bar 58.0.4→58.0.5, symbols 58.0.4→58.0.5, web-browser 58.0.7→58.1.0. 업그레이드는 이후 별도 회귀 검증과 함께 결정합니다.
- 실기기 화면은 아직 미검증입니다. 설치된 Medium_Phone 에뮬레이터가 ADB unauthorized 상태여서 로그인/회원가입 첫 화면을 확인하지 못했습니다. 기존 기기 데이터나 Expo Go 전체 저장소를 삭제하지 않았습니다.
- API: 실제 기동 및 `127.0.0.1:8000/health`, `192.168.0.4:8000/health` 모두 HTTP 200 / `ok`, `mock` 확인.
- 작업자: 동일 backend 작업 디렉터리와 `.env`로 실제 프로세스 기동 확인. 빈 작업 큐 유지. 작업 처리 흐름은 격리 통합 테스트에서 검증했습니다.
- Expo: 실제 기동, `/status`의 `packager-status:running` 확인. Android 매니페스트의 표시 이름 `마음이 머무는 곳 2nd`, slug `maeum-2nd` 확인.
- Android export: 1,509개 모듈 Hermes 번들 및 자산 69개 생성 성공. 이는 APK 설치나 기기 화면 검증을 뜻하지 않습니다. 임시 산출물은 `tmp/maeum-2nd-android-export`이며 배포용으로 사용하지 않습니다.
- 검증 종료 후 API·작업자·Expo 및 이번에 시작한 에뮬레이터를 종료했습니다. 8000/8081 리스너 없음 확인. 실행하려면 위 세 창의 명령을 사용하세요.
- 이번 단계의 로컬 환경 준비는 완료했습니다. **실기기 로그인/회원가입 첫 화면, 휴대폰의 LAN 접근, iOS 실행은 미검증**이며 온라인 Expo 최신 패치 검사 경고가 남아 있습니다. 과거 PC 기록은 이번 검증으로 간주하지 않습니다.
