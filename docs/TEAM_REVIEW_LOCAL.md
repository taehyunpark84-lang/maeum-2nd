# 팀원 변경 검토용 로컬 실행

2026-11-27. 팀원 코드를 반영하기 전에 최신 main을 별도 브랜치에서 확인하는 환경입니다.

## 기준과 작업 위치

- 브랜치: `codex/teammate-review`
- 기준 커밋: `d51eab4782130c9ced90a138c92796dbc4e70abc`
- 작업 폴더: `C:\dev\maeum-review`
- 원본: `C:\dev\maeum-latest` (`main`). 기존 미커밋 문서는 그대로 보존합니다.
- 팀원 비교본: `C:\dev\team-source`. 이 폴더는 수정하지 않습니다.
- 현재 앱 코드는 최신 main과 동일하며, 팀원 기능은 아직 반영하지 않습니다.

## 로컬 설정

- 모바일: `EXPO_PUBLIC_APP_MODE=api`, `EXPO_PUBLIC_LOCAL_DEVELOPMENT=1`
- API: `http://172.30.1.18:8000`
- Expo Go: `exp://172.30.1.18:8081`
- 개발 DB: `C:\dev\maeum-review\backend\storage\maeum-development.db`
- 서버 AI: `mock`. 대화·감정 해석·그림 생성 결과는 시연입니다. 실제 AI 키는 넣지 않았습니다.
- `.env`, 설치 패키지, DB, 생성 이미지, 로그는 Git 제외입니다.
- 이 환경은 새 DB를 사용하므로 기존 클라우드/다른 개발 환경의 계정·작품이 표시되지 않습니다.

## 재실행

아래 명령을 PowerShell 창 세 개에서 각각 실행합니다. 이미 실행 중이면 중복 실행하지 않습니다.

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

각 창에서 `Ctrl+C`로 종료합니다. 자동으로 시작한 프로세스의 식별 정보와 로그는 `tmp/team-review`를 확인합니다. 다른 프로젝트의 Python/Node 프로세스를 일괄 종료하지 않습니다.

## 휴대폰에서 확인

1. PC와 휴대폰을 같은 Wi-Fi에 연결합니다.
2. 휴대폰 브라우저에서 `http://172.30.1.18:8000/health`를 열어 `ok`, `mock`을 확인합니다.
3. Expo Go에서 `exp://172.30.1.18:8081`을 열거나 QR을 스캔합니다.
4. 필요하면 이전 로컬 세션에서 로그아웃하고, 이 개발 DB에 사용할 계정을 새로 만듭니다. 실제 로그인 서버 기능을 새로 구현하는 작업이 아니라 기존 최신 코드의 로컬 동작을 확인하는 단계입니다.
5. 공간·마음회의·그림·갤러리의 현재 동작을 확인합니다.

Wi-Fi 주소가 바뀌면 `mobile/.env`의 API 주소를 현재 PC IPv4로 바꾼 뒤 Expo를 재시작합니다. 실행기는 다른 PC/클라우드 주소를 거부합니다.

Expo의 로컬 개발·환경변수 공식 안내: https://docs.expo.dev/get-started/start-developing/ , https://docs.expo.dev/guides/environment-variables/

## 비교와 반영 순서

1. 최신 버전의 로컬 동작을 확인합니다.
2. 팀원 비교본과의 전체 파일 차이 및 기능별 차이를 기록합니다.
3. 각 기능을 `내 버전 유지 / 팀원 버전 채택 / 두 구현 조합 / 보류` 중에서 사용자가 결정합니다.
4. 결정된 항목만 이 브랜치에 반영하고 다시 검증합니다.
5. 최종 결과 확인 전에는 main 병합·GitHub 푸시·클라우드 배포를 하지 않습니다.

## 이번 준비의 검증

- Node 24.21.0 / npm 11.19.0, Python 3.14.7. 기존 lockfile로 모바일 808개·백엔드 39개 패키지를 별도 설치했습니다. 잠금 버전을 변경하지 않았습니다.
- 모바일 typecheck/lint, 모바일 테스트 56개, 백엔드 테스트 64개 통과. `pip check` 통과.
- Alembic `h117_mind_council` 적용 및 schema check 통과. 생성 직후 업무 테이블 16개·업무 데이터 0건, SQLite 무결성/외래 키 정상.
- API/독립 작업자/Metro 실행 중. localhost 및 PC LAN health HTTP 200 `ok/mock`, Metro 상태 정상.
- Android 개발 번들 1,661 모듈 생성 성공. Expo 매니페스트에서 실제 소스 경로가 이 검토 worktree임을 확인했습니다.
- 사용자가 QR을 스캔해 휴대폰 Expo Go에서 로그인 또는 공간 화면이 표시됨을 확인했습니다. 키보드/접근성·전체 그림일기 흐름·iOS는 별도 미검증입니다.
- Expo 권장 버전 검사는 기존 잠금 버전과 현재 권장 패치 14개 차이로 실패했습니다. 비교 기준을 유지하기 위해 자동 업그레이드하지 않았습니다.
- QR: `tmp/team-review/expo-go-qr.png`. 로그와 자동 실행 PID: `tmp/team-review/`.
- 비교 결과는 [기능별 선택표](TEAM_REVIEW_DECISIONS.md) 및 [전체 파일 표](TEAM_REVIEW_FILES.md)를 확인하세요. 팀원 기능은 소스 검토 단계이며 실행/권한/모델 검증은 하지 않았습니다.
