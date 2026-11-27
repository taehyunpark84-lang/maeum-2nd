# 생각방

> 2026-11-27: 새 기능은 **마음 — 4인 감정 회의**입니다. 최신 흐름·리마인더·실행 방법은 [MIND_COUNCIL.md](MIND_COUNCIL.md)를 확인하세요. 아래는 보존한 기존 3인 토론 방식의 설명입니다.

사용자가 제시한 고민을 세 AI 캐릭터가 서로 다른 관점으로 이야기하는 기능이다. 기존 공간 대화와 별개로 동작하며, 사용자 의견을 다음 발언의 우선순위에 반영한다.

## 사용 흐름

1. 하단 **생각방** 탭에서 오른쪽 아래 **고민입력**을 누른다.
2. 고민을 입력하면 세 캐릭터의 이름·입장·설명을 확인할 수 있다. **확인**한 뒤 첫 턴이 시작된다.
3. 한 턴은 파랑·주황·보라 캐릭터가 각각 한 번씩 말하는 것이다. 세 발언 후 자동으로 멈춘다. **대화 이어하기**를 눌러 다음 턴을 시작한다.
4. 진행 중 **중지**하면 읽던 상태에서 멈춘다. 이어하기는 남은 화자부터 진행한다. 화면을 벗어나거나 앱이 백그라운드로 가도 자동으로 멈추며 돌아왔다고 자동 재개하지 않는다.
5. 입력창에 나의 입장을 보내면 진행 중인 응답을 취소하고, 그 의견을 반영해 남은 턴 또는 다음 턴을 이어간다. 기존 요청이 늦게 완료돼도 최신 의견을 덮어쓰지 않는다.
6. **설정 → 이전 생각방 대화 표시**의 기본값은 끔이다. 끄면 입장 전 기록만 숨기며, 해당 입장 중의 새 발언은 표시한다. 켜면 저장된 현재 주제의 이전 기록을 볼 수 있다. 숨김은 삭제가 아니다.
7. 새 고민을 작성하다 취소하면 기존 대화가 보존된다. 새 역할 구성을 확정하면 이전 주제는 종료되고 새로운 주제로 시작한다. 종료한 주제의 기록은 저장되지만 현재 UI에서는 주제별 기록 보관함을 제공하지 않는다.

## 실제 AI와 시연 모드

- 온라인: 기존 서버의 `AI_MODE=openai`이면 기존 `TEXT_MODEL`로 주제별 역할 배정과 각 발언을 생성한다. 세 역할은 직전 발언에 공감·반대·보완·질문으로 응답하고 사용자가 표현한 우선순위를 반영하도록 요청한다. AI가 사용자의 선택을 대신 확정하지 않는다.
- 서버 `AI_MODE=mock`: 같은 계정·DB·API를 사용하되 응답은 시연이다.
- 앱 `EXPO_PUBLIC_APP_MODE=mock`: 서버 없이 주제별 예시 역할과 대화를 시연한다. 별도 AsyncStorage 키 `maeum2nd.discussion.mock.v1`에 저장한다.
- 화면은 실제 AI와 시연을 구분한다. 이름·입장은 이미지 색상과 분리되어 주제마다 달라진다.
- 실제 모드의 역할 배정 1회와 챗봇 발언마다 모델 호출이 발생한다. 일반 대화와 동일한 서버 API 키를 사용하며 앱에 키를 포함하지 않는다.

## 저장과 요청 처리

온라인 기록은 계정별로 DB에 저장하고 기존 공간 대화·그림·기억과 섞지 않는다. 생각방 기록은 공유 피드로 보내지 않는다. 표시 설정도 기존 일반 대화의 `show_history`와 별도로 관리한다.

새 스키마 `g116_discussions`는 `discussion_sessions`, `discussion_messages`, `discussion_settings`를 추가한다. 현재 주제, 다음 화자, 완료 턴, revision, 요청 ID를 보존한다. AI 생성 후 revision을 다시 검사해 사용자 의견 또는 새 주제 이전의 낡은 응답을 거절한다. 실패한 의견 전송 재시도는 같은 요청 ID를 사용한다.

발언 생성은 세션별 DB 리스로 중복 실행을 막는다. 이미 생성 중이면 앱이 잠시 기다렸다 다시 확인하며, 기다리는 중에도 중지할 수 있다. 실패·취소 시 리스를 해제하고 프로세스가 종료되면 만료 후 복구한다.

## 실행과 반영

개발 명령은 저장소 루트가 `C:\maeum-2nd`인 경우 다음과 같다.

```powershell
cd C:\maeum-2nd\backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\run-server.cmd
```

```powershell
cd C:\maeum-2nd\mobile
npm.cmd start -- --clear
```

위 마이그레이션은 선택한 환경의 DB에 적용된다. 운영 DB는 먼저 백업하고 배포 절차에 따라 적용한다. 모바일의 `EXPO_PUBLIC_API_URL`이 가리키는 서버에도 생각방 API와 마이그레이션이 있어야 한다. 기존 설치 APK에는 새 코드가 자동 반영되지 않으므로 새 빌드 설치가 필요하다. 이번 작업의 실제 적용·미검증 여부는 `PROGRESS.md`의 최신 항목을 따른다.

서버 없는 시연은 `.env`를 덮어쓰지 않고 현재 터미널에서 선택할 수 있다.

```powershell
cd C:\maeum-2nd\mobile
$env:EXPO_PUBLIC_APP_MODE = 'mock'
npm.cmd start -- --clear
```

## 검증 명령

```powershell
cd C:\maeum-2nd\mobile
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
```

백엔드는 기존 pytest 격리 절차를 사용한다. `scripts/verify-discussion-live.py --live`는 기존 키로 실제 모델을 최대 5회 호출하는 선택적 검사다. 합성 고민과 새 `tmp/discussion-live/` DB를 사용하며 실제 사용자 DB를 수정하지 않는다. 실행 결과의 `report.json`으로 실제 응답을 검토한다.

## 구현 위치

- `mobile/src/app/discussion.tsx`: Expo Router, 계정 확인, 온라인/오프라인 어댑터 선택.
- `mobile/src/features/discussion/DiscussionRoom.tsx`: 화면·모달·기록 표시·입력창.
- `controller.ts`, `useDiscussion.ts`: 턴 재생, 중지, 생명주기, 오류·재시도.
- `networkService.ts`, `localService.ts`, `types.ts`: API/시연 경계와 데이터 계약.
- `backend/app/discussions.py`, `discussion_ai.py`: 인증·저장·동시성·실제 모델 호출.
- `backend/migrations/versions/g116_discussions.py`: SQLite/MySQL 마이그레이션.

위험 단어 횟수에 따른 강제 종료는 구현하지 않았다. 실제 서비스의 안전 대응과 기록 보존·삭제 정책은 별도 검토 항목이다.
