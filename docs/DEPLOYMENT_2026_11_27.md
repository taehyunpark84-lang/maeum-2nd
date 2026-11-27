# 2026-11-27 클라우드 배포 결과

- 배포 main: `d51eab4782130c9ced90a138c92796dbc4e70abc`.
- 대상: `maeum-515107` / `maeum-server` / `asia-northeast3-c`.
- VM이 중지되어 있어 시작했으며, 작업 종료 시 실행 상태로 유지.
- 기존 서버는 Git 체크아웃이 아니었음. GitHub의 커밋 고정 아카이브를 별도 디렉터리에 받아 적용.
- 운영 경로: `/home/taehyun_park84/maeum-2nd/backend`.
- 릴리스 경로: `/home/taehyun_park84/maeum-releases/main-d51eab4`.
- 서버의 기존 `.env`, API 키, MySQL 연결, 이미지 저장 경로 유지. 개발 PC DB/설정 업로드 없음.

## 백업

`/home/taehyun_park84/maeum-backups/before-main-d51eab4-20261127T055803Z`

- 서비스 중지 전 진행 중 그림 작업 없음(완료 10건) 확인. 중지 후 일관된 상태에서 백업.
- `database.sql`: MySQL 전체 논리 백업. 트리거/루틴/이벤트 포함 옵션 사용.
- `backend.tar.gz`: 기존 코드·`.env`·storage. 가상환경과 Python 캐시 제외.
- `system-config.tar.gz`: 두 서비스 정의, Nginx, Let's Encrypt 설정. 비밀정보 포함이므로 공유/Git 업로드 금지.
- `pip-freeze.txt`, `checksums.json`: 기존 패키지 목록/백업 파일 SHA-256.
- `data-before.json`: 기존 테이블 열·행 수·전체 행 해시, 저장 파일과 `.env` 해시. 원본 대화 내용 출력 없음.
- 백업 경로 권한 0700, DB 덤프 0600. 압축파일 목록 읽기/해시 검사 통과.
- 기존 가상환경은 백업 경로의 `venv-original`에 보존. 운영 `backend/.venv`는 새 릴리스 `venv`를 가리키는 심볼릭 링크. 릴리스/백업 폴더 임의 삭제 금지.
- 같은 VM 디스크에 저장한 백업이며 외부 복제 및 실제 DB 복원 리허설은 미실시.

## 적용 및 검증

- 독립 Python 환경에 잠금 파일 설치, pip check 통과. 격리 백엔드 pytest **64개 통과**(21.74초). 운영 DB 대상 테스트 아님.
- 운영 Alembic `g116_discussions` → `h117_mind_council`. 생각방 테이블 2개에 열 추가. upgrade/check 통과.
- 변경 전 테이블 17개 중 Alembic 메타데이터를 제외한 기존 업무 테이블 16개의 기존 모든 열/행 해시 및 행 수 일치.
- 저장 파일 20개 및 `.env` 해시 일치. 배포 app 파일 33개가 main 소스와 해시 일치.
- API·worker·MySQL·Nginx 모두 active. API/worker NRestarts 각각 0.
- 내부 및 외부 HTTPS health: `ok / openai`. 실제 AI 설정은 배포 전후 동일. 과거 VM 문서의 mock 상태와 구분.
- `/me`, `/discussions/current`, `/discussions/settings` 비로그인 요청 모두 401.
- OpenAPI 생각방 경로 등록 확인. Nginx 설정 검사 성공. 배포 구간 서비스 로그 오류/Traceback 필터에서 오류 없음.
- 릴리스 폴더에 `result.json`, `tests.log`, `install.log`, `backup-path.txt` 보관.
- 미검증: 휴대폰 Expo 화면, 운영 계정 인증 후 전체 흐름, 실제 AI 대화/그림 생성, MySQL 동시 사용자 부하. 이번 배포에서는 유료 AI 호출 없음.
- APK 빌드/Expo 연결 변경은 미실시. 최신 모바일 코드를 클라우드 주소에 연결해 별도 UI 확인 필요.

## 복구 원칙

1. API/worker 중지 후 배포 이후 기록이 있다면 현재 DB/storage부터 추가 백업.
2. 기존 코드 복원 시 신규 이미지/기록을 과거 백업으로 덮어쓰지 말 것.
3. `backend/.venv`의 심볼릭 링크만 해제하고 `venv-original`을 원래 위치로 복원. 링크 대상을 재귀 삭제하지 말 것.
4. 추가 열만 적용한 마이그레이션이므로 이전 코드 복구에 DB 전체 복원/downgrade가 필요한지 먼저 판단. 자동 downgrade 금지.
5. 전체 DB 복원은 배포 후 기록 손실 범위를 확인하고 별도 진행. `database.sql`은 배포 직전 시점이며 이번에는 실제 복원하지 않음.
6. 서비스 시작 후 health·인증·기존 자료·그림 작업을 재검증.

관리 명령(VM SSH):

```bash
sudo systemctl status maeum-api maeum-worker --no-pager
curl -fsS https://34.158.202.133/health
sudo journalctl -u maeum-api -u maeum-worker -n 60 --no-pager
```
