KoELECTRA 6감정 로컬 서버

실행/재설치/모델 파일 준비/검증 결과: docs/TEAM_INTEGRATION.md
루트에서 .\scripts\run-local-development.ps1 emotion 으로 실행합니다.
koelectra_emotion6_multi_best 폴더의 로컬 safetensors를 사용합니다.
학습용 training_args.bin은 필요하지 않습니다.
127.0.0.1:8001에서 PC 내부 백엔드에만 제공합니다.
모델 점수는 진단이나 검증된 정확도가 아니며 그림 연출에 조건부로 참고합니다.
팀원 코드를 기반으로 경로 고정/로컬 전용 모델 로드/입력 상태를 보완했습니다.
