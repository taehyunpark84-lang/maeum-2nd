# Android APK 테스트 — 2026-11-22

## 빌드

로컬 Android 빌드이며 EAS/스토어 업로드를 사용하지 않습니다. Expo prebuild로 생성하는 mobile/android는 Git 제외 대상입니다. Java 21, SDK 37, Build Tools 37.0.0, NDK 27.1.12297006을 사용합니다.

```powershell
cd C:\maeum-2nd
.\scripts\build-test-apk.ps1 -Offline
```

캐시에 없는 의존성이 있으면 -Offline을 빼고 실행합니다. 다른 PC는 -JavaHome과 -AndroidSdk를 지정하고 mobile에서 npm ci를 먼저 실행합니다.

결과: output/apk/maeum-2nd-test-arm64.apk. arm64 기기용으로 JS와 자산을 포함한 release 빌드입니다. Expo 템플릿의 debug 서명을 사용하는 테스트용이며 스토어 배포용 서명이 아닙니다. 앱 ID: com.taehyun.park.maeum2nd.

mobile/.env의 EXPO_PUBLIC_API_URL=https://34.158.202.133, EXPO_PUBLIC_APP_MODE=api를 사용합니다. backend/.env는 APK에 포함하지 않습니다. 실제 AI 모드는 VM 설정을 따릅니다.

## 저장 기능

- 인증된 원본 이미지 엔드포인트 사용. 시와 설명은 이미지에 합성하지 않음.
- 권한 거절 시 다운로드/저장 중단 및 안내.
- 제한된 사진 접근으로 앨범 조회가 실패해도 사진첩 저장 시도.
- 사진은 저장됐지만 전용 앨범 생성만 실패한 경우 구분해 안내.
- 임시 캐시 정리 실패가 저장 성공을 실패로 바꾸지 않도록 보완.
- 해당 경로를 다루는 격리 테스트 5개 추가. 실제 기기의 MediaStore 저장 검증과 구분.

## 휴대폰 확인

1. APK 설치 후 기존 VM 계정으로 직접 로그인합니다. 비밀번호를 채팅에 보내지 않습니다.
2. 갤러리에서 기존 작품을 선택해 '사진첩에 그림 저장'을 누르고 Android 권한 요청에 응답합니다.
3. 삼성 갤러리의 '마음이 머무는 곳' 앨범 또는 최근 사진에서 원본을 확인합니다.
4. 앱 종료 후 갤러리에서 다시 열어 영속 저장을 확인합니다.
5. 두 번째 저장도 확인합니다. 반복 저장은 별도 사본을 만들 수 있습니다.

## 검증 기록

- assembleRelease 성공(최초 온라인 빌드 1시간 6분 55초). 타입 검사·린트·전체 테스트 24개 통과.
- APK 76,118,988바이트. SHA256: CED011AE7E9609953E21ED89C21D7C40708551186EBADE62C3C6E434519063EE.
- apksigner 검증 통과. 테스트용 Android Debug 서명. 패키지 com.taehyun.park.maeum2nd, versionCode 1, 최소 Android API 24, target API 36, arm64-v8a.
- 내장 Hermes JS 번들 3,001,084바이트 및 VM HTTPS 주소 확인. APK 항목에 .env/DB/개인 키 파일 없음. 번들에서 실제 OpenAI 키 패턴 없음.
- USB 재연결 후 Samsung SM-A256N에 설치 확인. 패키지 versionCode 1, versionName 1.0.0, 설치 시각 2026-11-22 20:27:16 확인, MainActivity 실행 성공.
- 스트리밍 설치 지연으로 --no-streaming 방식 재시도. 이후 pm에서 실제 설치 확인. 사용자에게 로그인 및 기존 작품 저장 확인 요청. 실행 뒤 USB가 해제되어 대기 중인 설치 명령은 종료.
- 사용자 제공 실기기 화면에서 ‘마음이 머무는 곳’ 앨범 저장 완료 메시지와 별도로 첨부한 그림 파일 확인. 사용자 제공 증빙 기준으로 실제 저장 성공 확인. 원문 대화/작품 이미지는 저장소에 복사하지 않았습니다.
- USB MediaStore 직접 조회, 앱 종료 후 재열람 및 반복 저장은 별도 미검증입니다.
