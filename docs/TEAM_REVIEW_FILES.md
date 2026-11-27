# 팀원 비교본 전체 파일 차이

2026-11-27. 팀원 코드 반영 전의 비교 자료입니다. 모든 선택은 아직 미정입니다.

- 최신 기준: `d51eab4782130c9ced90a138c92796dbc4e70abc` (`main`에서 분기)
- 최신 작업 폴더: `C:\dev\maeum-review`
- 팀원 비교 폴더: `C:\dev\team-source`
- 원본 main의 미커밋 문서는 보존하되, 이 비교는 커밋된 최신 버전을 기준으로 합니다.
- 두 Git 기록에 공통 조상이 없어 파일 차이를 팀원의 수정으로 단정하지 않습니다. 최신에서 추가된 기능도 차이에 포함됩니다.
- 설치 파일, 빌드/캐시, 환경 비밀값, DB/생성 이미지 등 런타임 자료는 비교·이관 대상에서 제외합니다.
- UTF-8 BOM 및 CRLF/LF만 다른 경우 내용 차이와 구분합니다. 자동 병합·삭제·복사하지 않았습니다.

최신 637개 / 팀원 629개 / 공통 내용 동일 76개 / 형식만 다름 510개 / 내용 다름 24개 / 최신에만 27개 / 팀원에만 19개.

파일 전체의 SHA-256과 상태는 [inventory.json](../tmp/team-review/inventory.json), 텍스트 차이 원문은 `tmp/team-review/diffs/`에 있습니다. 이 두 자료는 Git 제외 로컬 검토 자료입니다.

| 파일 | 차이 | 최신→팀원 줄 추가/삭제 | 선택 |
|---|---|---:|---|
| [MAEUM_2ND_RUNBOOK.md](../tmp/team-review/diffs/MAEUM_2ND_RUNBOOK.md.diff) | 내용이 다름 | +0 / -19 | 미정 |
| [backend/.env.example](../tmp/team-review/diffs/backend/.env.example.diff) | 내용이 다름 | +12 / -0 | 미정 |
| [backend/app/ai.py](../tmp/team-review/diffs/backend/app/ai.py.diff) | 내용이 다름 | +29 / -7 | 미정 |
| [backend/app/art_story.py](../tmp/team-review/diffs/backend/app/art_story.py.diff) | 내용이 다름 | +5 / -7 | 미정 |
| [backend/app/art_text.py](../tmp/team-review/diffs/backend/app/art_text.py.diff) | 최신에만 있음 | +0 / -12 | 미정 |
| [backend/app/config.py](../tmp/team-review/diffs/backend/app/config.py.diff) | 내용이 다름 | +16 / -0 | 미정 |
| [backend/app/db.py](../tmp/team-review/diffs/backend/app/db.py.diff) | 내용이 다름 | +49 / -3 | 미정 |
| [backend/app/discussions.py](../tmp/team-review/diffs/backend/app/discussions.py.diff) | 내용이 다름 | +17 / -58 | 미정 |
| [backend/app/emotion_art.py](../tmp/team-review/diffs/backend/app/emotion_art.py.diff) | 팀원에만 있음 | +31 / -0 | 미정 |
| [backend/app/emotion_classifier.py](../tmp/team-review/diffs/backend/app/emotion_classifier.py.diff) | 팀원에만 있음 | +86 / -0 | 미정 |
| [backend/app/main.py](../tmp/team-review/diffs/backend/app/main.py.diff) | 내용이 다름 | +272 / -6 | 미정 |
| [backend/app/mind_council.py](../tmp/team-review/diffs/backend/app/mind_council.py.diff) | 최신에만 있음 | +0 / -164 | 미정 |
| [backend/app/prompts/common.txt](../tmp/team-review/diffs/backend/app/prompts/common.txt.diff) | 내용이 다름 | +1 / -4 | 미정 |
| [backend/app/prompts/council/anger.txt](../tmp/team-review/diffs/backend/app/prompts/council/anger.txt.diff) | 최신에만 있음 | +0 / -19 | 미정 |
| [backend/app/prompts/council/anxiety.txt](../tmp/team-review/diffs/backend/app/prompts/council/anxiety.txt.diff) | 최신에만 있음 | +0 / -18 | 미정 |
| [backend/app/prompts/council/common.txt](../tmp/team-review/diffs/backend/app/prompts/council/common.txt.diff) | 최신에만 있음 | +0 / -8 | 미정 |
| [backend/app/prompts/council/joy.txt](../tmp/team-review/diffs/backend/app/prompts/council/joy.txt.diff) | 최신에만 있음 | +0 / -15 | 미정 |
| [backend/app/prompts/council/reminders.txt](../tmp/team-review/diffs/backend/app/prompts/council/reminders.txt.diff) | 최신에만 있음 | +0 / -15 | 미정 |
| [backend/app/prompts/council/sadness.txt](../tmp/team-review/diffs/backend/app/prompts/council/sadness.txt.diff) | 최신에만 있음 | +0 / -17 | 미정 |
| [backend/app/prompts/ocean.txt](../tmp/team-review/diffs/backend/app/prompts/ocean.txt.diff) | 내용이 다름 | +306 / -22 | 미정 |
| [backend/app/prompts/temple.txt](../tmp/team-review/diffs/backend/app/prompts/temple.txt.diff) | 내용이 다름 | +78 / -27 | 미정 |
| [backend/migrations/versions/h117_community_counseling.py](../tmp/team-review/diffs/backend/migrations/versions/h117_community_counseling.py.diff) | 팀원에만 있음 | +95 / -0 | 미정 |
| [backend/migrations/versions/h117_mind_council.py](../tmp/team-review/diffs/backend/migrations/versions/h117_mind_council.py.diff) | 최신에만 있음 | +0 / -18 | 미정 |
| [backend/tests/test_art_text.py](../tmp/team-review/diffs/backend/tests/test_art_text.py.diff) | 최신에만 있음 | +0 / -92 | 미정 |
| [backend/tests/test_emotion_classifier.py](../tmp/team-review/diffs/backend/tests/test_emotion_classifier.py.diff) | 팀원에만 있음 | +80 / -0 | 미정 |
| [backend/tests/test_mind_council.py](../tmp/team-review/diffs/backend/tests/test_mind_council.py.diff) | 최신에만 있음 | +0 / -171 | 미정 |
| [docs/LOCAL_DEVELOPMENT.md](../tmp/team-review/diffs/docs/LOCAL_DEVELOPMENT.md.diff) | 최신에만 있음 | +0 / -74 | 미정 |
| [docs/MIND_COUNCIL.md](../tmp/team-review/diffs/docs/MIND_COUNCIL.md.diff) | 최신에만 있음 | +0 / -64 | 미정 |
| [docs/PROGRESS.md](../tmp/team-review/diffs/docs/PROGRESS.md.diff) | 내용이 다름 | +0 / -88 | 미정 |
| [docs/THOUGHT_ROOM.md](../tmp/team-review/diffs/docs/THOUGHT_ROOM.md.diff) | 내용이 다름 | +0 / -2 | 미정 |
| [mobile/README.md](../tmp/team-review/diffs/mobile/README.md.diff) | 내용이 다름 | +0 / -21 | 미정 |
| [mobile/app.config.ts](../tmp/team-review/diffs/mobile/app.config.ts.diff) | 최신에만 있음 | +0 / -15 | 미정 |
| [mobile/assets/council/README.md](../tmp/team-review/diffs/mobile/assets/council/README.md.diff) | 최신에만 있음 | +0 / -6 | 미정 |
| `mobile/assets/council/character-reference.png` | 최신에만 있음 | 바이너리 | 미정 |
| [mobile/assets/council/manifest.json](../tmp/team-review/diffs/mobile/assets/council/manifest.json.diff) | 최신에만 있음 | +0 / -28 | 미정 |
| `mobile/assets/council/moderator-owl.png` | 최신에만 있음 | 바이너리 | 미정 |
| `mobile/assets/counselors/lavender.jpg` | 팀원에만 있음 | 바이너리 | 미정 |
| `mobile/assets/counselors/lily-of-the-valley.jpg` | 팀원에만 있음 | 바이너리 | 미정 |
| `mobile/assets/counselors/sunflower.jpg` | 팀원에만 있음 | 바이너리 | 미정 |
| [mobile/expo-env.d.ts](../tmp/team-review/diffs/mobile/expo-env.d.ts.diff) | 팀원에만 있음 | +3 / -0 | 미정 |
| [mobile/src/app/discussion.tsx](../tmp/team-review/diffs/mobile/src/app/discussion.tsx.diff) | 내용이 다름 | +3 / -3 | 미정 |
| [mobile/src/config/counselors.ts](../tmp/team-review/diffs/mobile/src/config/counselors.ts.diff) | 팀원에만 있음 | +16 / -0 | 미정 |
| [mobile/src/config/environment.ts](../tmp/team-review/diffs/mobile/src/config/environment.ts.diff) | 최신에만 있음 | +0 / -5 | 미정 |
| [mobile/src/features/App.tsx](../tmp/team-review/diffs/mobile/src/features/App.tsx.diff) | 내용이 다름 | +5 / -5 | 미정 |
| [mobile/src/features/discussion/CouncilAvatar.tsx](../tmp/team-review/diffs/mobile/src/features/discussion/CouncilAvatar.tsx.diff) | 최신에만 있음 | +0 / -57 | 미정 |
| [mobile/src/features/discussion/DiscussionRoom.tsx](../tmp/team-review/diffs/mobile/src/features/discussion/DiscussionRoom.tsx.diff) | 내용이 다름 | +887 / -546 | 미정 |
| [mobile/src/features/discussion/LegacyDiscussionRoom.tsx](../tmp/team-review/diffs/mobile/src/features/discussion/LegacyDiscussionRoom.tsx.diff) | 최신에만 있음 | +0 / -1106 | 미정 |
| [mobile/src/features/discussion/controller.ts](../tmp/team-review/diffs/mobile/src/features/discussion/controller.ts.diff) | 내용이 다름 | +3 / -69 | 미정 |
| [mobile/src/features/discussion/council.ts](../tmp/team-review/diffs/mobile/src/features/discussion/council.ts.diff) | 최신에만 있음 | +0 / -157 | 미정 |
| [mobile/src/features/discussion/localService.ts](../tmp/team-review/diffs/mobile/src/features/discussion/localService.ts.diff) | 내용이 다름 | +17 / -94 | 미정 |
| [mobile/src/features/discussion/networkService.ts](../tmp/team-review/diffs/mobile/src/features/discussion/networkService.ts.diff) | 내용이 다름 | +14 / -52 | 미정 |
| [mobile/src/features/discussion/types.ts](../tmp/team-review/diffs/mobile/src/features/discussion/types.ts.diff) | 내용이 다름 | +3 / -18 | 미정 |
| [mobile/src/features/discussion/useDiscussion.ts](../tmp/team-review/diffs/mobile/src/features/discussion/useDiscussion.ts.diff) | 내용이 다름 | +0 / -1 | 미정 |
| [mobile/src/features/online/CommunityFeed.tsx](../tmp/team-review/diffs/mobile/src/features/online/CommunityFeed.tsx.diff) | 팀원에만 있음 | +234 / -0 | 미정 |
| [mobile/src/features/online/Counseling.tsx](../tmp/team-review/diffs/mobile/src/features/online/Counseling.tsx.diff) | 팀원에만 있음 | +185 / -0 | 미정 |
| [mobile/src/features/online/OnlineApp.tsx](../tmp/team-review/diffs/mobile/src/features/online/OnlineApp.tsx.diff) | 내용이 다름 | +108 / -4 | 미정 |
| [mobile/src/services/api.ts](../tmp/team-review/diffs/mobile/src/services/api.ts.diff) | 내용이 다름 | +25 / -2 | 미정 |
| [mobile/tests/environment.test.ts](../tmp/team-review/diffs/mobile/tests/environment.test.ts.diff) | 최신에만 있음 | +0 / -56 | 미정 |
| [mobile/tests/mindCouncil.test.ts](../tmp/team-review/diffs/mobile/tests/mindCouncil.test.ts.diff) | 최신에만 있음 | +0 / -310 | 미정 |
| [scripts/emotion_server/README.txt](../tmp/team-review/diffs/scripts/emotion_server/README.txt.diff) | 팀원에만 있음 | +7 / -0 | 미정 |
| [scripts/emotion_server/app.py](../tmp/team-review/diffs/scripts/emotion_server/app.py.diff) | 팀원에만 있음 | +63 / -0 | 미정 |
| [scripts/emotion_server/koelectra_emotion6_multi_best/config.json](../tmp/team-review/diffs/scripts/emotion_server/koelectra_emotion6_multi_best/config.json.diff) | 팀원에만 있음 | +50 / -0 | 미정 |
| `scripts/emotion_server/koelectra_emotion6_multi_best/model.safetensors` | 팀원에만 있음 | 바이너리 | 미정 |
| [scripts/emotion_server/koelectra_emotion6_multi_best/tokenizer.json](../tmp/team-review/diffs/scripts/emotion_server/koelectra_emotion6_multi_best/tokenizer.json.diff) | 팀원에만 있음 | +35155 / -0 | 미정 |
| [scripts/emotion_server/koelectra_emotion6_multi_best/tokenizer_config.json](../tmp/team-review/diffs/scripts/emotion_server/koelectra_emotion6_multi_best/tokenizer_config.json.diff) | 팀원에만 있음 | +15 / -0 | 미정 |
| `scripts/emotion_server/koelectra_emotion6_multi_best/training_args.bin` | 팀원에만 있음 | 바이너리 | 미정 |
| [scripts/emotion_server/requirements.txt](../tmp/team-review/diffs/scripts/emotion_server/requirements.txt.diff) | 팀원에만 있음 | +5 / -0 | 미정 |
| [scripts/run-local-development.ps1](../tmp/team-review/diffs/scripts/run-local-development.ps1.diff) | 최신에만 있음 | +0 / -49 | 미정 |
| [scripts/use-node.ps1](../tmp/team-review/diffs/scripts/use-node.ps1.diff) | 최신에만 있음 | +0 / -20 | 미정 |
| [scripts/verify-council-live.py](../tmp/team-review/diffs/scripts/verify-council-live.py.diff) | 최신에만 있음 | +0 / -109 | 미정 |

## 내용이 같고 형식만 다른 파일

- `.gitattributes`
- `.gitignore`
- `AGENTS.md`
- `MAEUM_2ND_MIGRATION_GUIDE.md`
- `NEW_LAPTOP_START.md`
- `START_HERE.md`
- `assets/audio/README.md`
- `assets/discussion/README.md`
- `assets/discussion/generation-prompts.json`
- `assets/discussion/manifest.json`
- `assets/manifest.json`
- `backend/README.md`
- `backend/alembic.ini`
- `backend/app/__init__.py`
- `backend/app/ai_errors.py`
- `backend/app/art_direction.py`
- `backend/app/chat_text.py`
- `backend/app/discussion_ai.py`
- `backend/app/limits.py`
- `backend/app/prompts/README.md`
- `backend/app/prompts/cafe.txt`
- `backend/app/prompts/cathedral.txt`
- `backend/app/prompts/forest.txt`
- `backend/app/prompts/garden.txt`
- `backend/app/security.py`
- `backend/app/shared_history.py`
- `backend/app/thumbnails.py`
- `backend/app/tuning.py`
- `backend/app/worker.py`
- `backend/configure_vm.py`
- `backend/evaluate_personas.py`
- `backend/migrations/env.py`
- `backend/migrations/script.py.mako`
- `backend/migrations/versions/2bcd39828766_initial_schema.py`
- `backend/migrations/versions/ca7279440180_request_limits_and_precise_timestamps.py`
- `backend/migrations/versions/d113_shared_user_memory.py`
- `backend/migrations/versions/e114_art_preview_range.py`
- `backend/migrations/versions/f115_profile_art_sources.py`
- `backend/migrations/versions/g116_discussions.py`
- `backend/render_persona_review.py`
- `backend/requirements.lock.txt`
- `backend/run-server.cmd`
- `backend/run-worker.cmd`
- `backend/tests/conftest.py`
- `backend/tests/test_ai_errors.py`
- `backend/tests/test_art_direction.py`
- `backend/tests/test_art_story.py`
- `backend/tests/test_chat_text.py`
- `backend/tests/test_config.py`
- `backend/tests/test_discussions.py`
- `backend/tests/test_flow.py`
- `backend/tests/test_profile_sources.py`
- `backend/tests/test_shared_history.py`
- `backend/tests/test_thumbnails.py`
- `backend/verify_empty_local.py`
- `backend/verify_mysql_flow.py`
- `docs/01-scope.md`
- `docs/02-screens.md`
- `docs/03-design-assets.md`
- `docs/04-development.md`
- `docs/05-validation.md`
- `docs/ANDROID_APK_TEST.md`
- `docs/AUDIO.md`
- `docs/MAEUM_2ND_CLOUD_PLAN.md`
- `docs/MAEUM_VM_RUNBOOK.md`
- `docs/START_PROMPT.txt`
- `docs/persona-review-2026-11-24/00_선정과_검증계획.txt`
- `docs/persona-review-2026-11-24/01_발견문제와_대화원문.txt`
- `docs/persona-review-2026-11-24/02_프롬프트_수정이력_원문.txt`
- `docs/persona-review-2026-11-24/03_수정전후_대화원문_비교.txt`
- `docs/persona-review-2026-11-24/04_결과와_시연안내.txt`
- `docs/persona-review-2026-11-24/05_전체_대화원문.txt`
- `docs/persona-review-2026-11-24/06_실행정보와_검증.txt`
- `docs/persona-review-2026-11-24/07_실행장애.txt`
- `docs/persona-review-2026-11-24/README.txt`
- `docs/persona-review-2026-11-24/after/ai.py.txt`
- `docs/persona-review-2026-11-24/after/chat_text.py.txt`
- `docs/persona-review-2026-11-24/after/mobile_concepts.ts.txt`
- `docs/persona-review-2026-11-24/after/prompts/common.txt`
- `docs/persona-review-2026-11-24/after/prompts/forest.txt`
- `docs/persona-review-2026-11-24/after/prompts/temple.txt`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__forest__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__forest__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__temple__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__temple__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/01_small_joy__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__forest__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__forest__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__temple__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__temple__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/02_self_blame__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__forest__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__forest__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__temple__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__temple__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/03_listen_only__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__forest__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__forest__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__temple__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__temple__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/04_practical__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/05_identity__forest__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/05_identity__forest__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/05_identity__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/05_identity__temple__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/05_identity__temple__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/05_identity__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/06_immediate_danger__forest__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/06_immediate_danger__forest__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/06_immediate_danger__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/06_immediate_danger__temple__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/06_immediate_danger__temple__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/06_immediate_danger__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__forest__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__forest__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__temple__r1.json`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__temple__r1.txt`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/07_new_topic__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_001/metadata.json`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__forest__r1.json`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__forest__r1.txt`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__temple__r1.json`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__temple__r1.txt`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/01_small_joy__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__forest__r1.json`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__forest__r1.txt`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__temple__r1.json`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__temple__r1.txt`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/03_listen_only__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/after/run_002/metadata.json`
- `docs/persona-review-2026-11-24/after/tuning.py.txt`
- `docs/persona-review-2026-11-24/before/ai.py.txt`
- `docs/persona-review-2026-11-24/before/chat_text.py.txt`
- `docs/persona-review-2026-11-24/before/mobile_concepts.ts.txt`
- `docs/persona-review-2026-11-24/before/prompts/common.txt`
- `docs/persona-review-2026-11-24/before/prompts/forest.txt`
- `docs/persona-review-2026-11-24/before/prompts/temple.txt`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__forest__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__forest__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__temple__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__temple__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/01_small_joy__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__forest__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__forest__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__temple__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__temple__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/02_self_blame__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__forest__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__forest__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__temple__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__temple__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/03_listen_only__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__forest__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__forest__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__temple__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__temple__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/04_practical__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/05_identity__forest__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/05_identity__forest__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/05_identity__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/05_identity__temple__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/05_identity__temple__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/05_identity__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/06_immediate_danger__forest__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/06_immediate_danger__forest__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/06_immediate_danger__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/06_immediate_danger__temple__r1.json`
- `docs/persona-review-2026-11-24/before/run_001/06_immediate_danger__temple__r1.txt`
- `docs/persona-review-2026-11-24/before/run_001/06_immediate_danger__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_001/metadata.json`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__forest__r1.json`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__forest__r1.txt`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__temple__r1.json`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__temple__r1.txt`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/01_small_joy__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__forest__r1.json`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__forest__r1.txt`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__temple__r1.json`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__temple__r1.txt`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/02_self_blame__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__forest__r1.json`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__forest__r1.txt`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__temple__r1.json`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__temple__r1.txt`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/07_new_topic__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/before/run_002/metadata.json`
- `docs/persona-review-2026-11-24/before/tuning.py.txt`
- `docs/persona-review-2026-11-24/candidate_v1/ai.py.txt`
- `docs/persona-review-2026-11-24/candidate_v1/chat_text.py.txt`
- `docs/persona-review-2026-11-24/candidate_v1/mobile_concepts.ts.txt`
- `docs/persona-review-2026-11-24/candidate_v1/prompts/common.txt`
- `docs/persona-review-2026-11-24/candidate_v1/prompts/forest.txt`
- `docs/persona-review-2026-11-24/candidate_v1/prompts/temple.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/01_small_joy__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/02_self_blame__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/03_listen_only__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/04_practical__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/05_identity__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/05_identity__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/05_identity__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/05_identity__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/05_identity__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/05_identity__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/06_immediate_danger__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/06_immediate_danger__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/06_immediate_danger__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/06_immediate_danger__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/06_immediate_danger__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/06_immediate_danger__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v1/run_001/metadata.json`
- `docs/persona-review-2026-11-24/candidate_v1/tuning.py.txt`
- `docs/persona-review-2026-11-24/candidate_v2/ai.py.txt`
- `docs/persona-review-2026-11-24/candidate_v2/chat_text.py.txt`
- `docs/persona-review-2026-11-24/candidate_v2/mobile_concepts.ts.txt`
- `docs/persona-review-2026-11-24/candidate_v2/prompts/common.txt`
- `docs/persona-review-2026-11-24/candidate_v2/prompts/forest.txt`
- `docs/persona-review-2026-11-24/candidate_v2/prompts/temple.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/01_small_joy__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/02_self_blame__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/03_listen_only__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/04_practical__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/05_identity__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/05_identity__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/05_identity__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/05_identity__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/05_identity__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/05_identity__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/06_immediate_danger__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/06_immediate_danger__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/06_immediate_danger__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/06_immediate_danger__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/06_immediate_danger__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/06_immediate_danger__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v2/run_001/metadata.json`
- `docs/persona-review-2026-11-24/candidate_v2/tuning.py.txt`
- `docs/persona-review-2026-11-24/candidate_v3/ai.py.txt`
- `docs/persona-review-2026-11-24/candidate_v3/chat_text.py.txt`
- `docs/persona-review-2026-11-24/candidate_v3/mobile_concepts.ts.txt`
- `docs/persona-review-2026-11-24/candidate_v3/prompts/common.txt`
- `docs/persona-review-2026-11-24/candidate_v3/prompts/forest.txt`
- `docs/persona-review-2026-11-24/candidate_v3/prompts/temple.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/01_small_joy__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/02_self_blame__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/03_listen_only__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/04_practical__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/05_identity__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/05_identity__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/05_identity__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/05_identity__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/05_identity__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/05_identity__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/06_immediate_danger__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/06_immediate_danger__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/06_immediate_danger__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/06_immediate_danger__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/06_immediate_danger__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/06_immediate_danger__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__forest__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__forest__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__forest__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__forest__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__forest__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__temple__r1.json`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__temple__r1.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__temple__r1__turn1_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__temple__r1__turn2_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/07_new_topic__temple__r1__turn3_instructions.txt`
- `docs/persona-review-2026-11-24/candidate_v3/run_001/metadata.json`
- `docs/persona-review-2026-11-24/candidate_v3/tuning.py.txt`
- `docs/persona-review-2026-11-24/test_cases.json`
- `docs/persona-review-2026-11-24/verification.json`
- `docs/team-guide/README.md`
- `docs/team-guide/build_guides.py`
- `docs/validation/discussion-live-20261123.json`
- `mobile/.env.example`
- `mobile/.gitignore`
- `mobile/AGENTS.md`
- `mobile/LICENSE`
- `mobile/app.json`
- `mobile/assets/app-icon/generation.json`
- `mobile/assets/audio/README.md`
- `mobile/assets/audio/manifest.json`
- `mobile/assets/audio/미리듣기.html`
- `mobile/assets/expo.icon/Assets/expo-symbol 2.svg`
- `mobile/assets/expo.icon/icon.json`
- `mobile/eas.json`
- `mobile/eslint.config.js`
- `mobile/package-lock.json`
- `mobile/package.json`
- `mobile/scripts/reset-project.js`
- `mobile/src/app/_layout.tsx`
- `mobile/src/app/index.tsx`
- `mobile/src/components/AmbientAudioProvider.tsx`
- `mobile/src/components/AmbientGlow.tsx`
- `mobile/src/components/Sound.tsx`
- `mobile/src/components/ui.tsx`
- `mobile/src/config/assets.ts`
- `mobile/src/config/demo.json`
- `mobile/src/features/Chat.tsx`
- `mobile/src/features/DiaryEditor.tsx`
- `mobile/src/features/PlaceCards.tsx`
- `mobile/src/features/online/ArtworkHistory.tsx`
- `mobile/src/features/online/ArtworkImage.tsx`
- `mobile/src/features/online/AuthScreen.tsx`
- `mobile/src/features/online/ChatArtwork.tsx`
- `mobile/src/features/online/GenderSelector.tsx`
- `mobile/src/features/online/JobStatus.tsx`
- `mobile/src/features/online/OnlineChat.tsx`
- `mobile/src/services/ambientAudio.ts`
- `mobile/src/services/artworkImages.ts`
- `mobile/src/services/chatDisplay.ts`
- `mobile/src/services/mock.ts`
- `mobile/src/services/saveArtwork.ts`
- `mobile/src/types.ts`
- `mobile/tests/artworkImages.test.ts`
- `mobile/tests/audio.test.ts`
- `mobile/tests/chatDisplay.test.ts`
- `mobile/tests/discussionController.test.ts`
- `mobile/tests/discussionLocal.test.ts`
- `mobile/tests/discussionNetwork.test.ts`
- `mobile/tests/model.test.ts`
- `mobile/tests/saveArtwork.test.ts`
- `mobile/tsconfig.json`
- `mock-data/demo.json`
- `references/README.md`
- `scripts/build-test-apk.ps1`
- `scripts/edit_forest_loop.py`
- `scripts/edit_room_loops.py`
- `scripts/generate_ambience.py`
- `scripts/verify-discussion-live.py`
- `새 텍스트 문서.txt`
- `실행방법.txt`
