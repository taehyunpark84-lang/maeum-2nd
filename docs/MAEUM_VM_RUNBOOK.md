# Google Cloud VM 실행 상태 — 2026-11-22

VM 백엔드 배포와 HTTPS 공개 연결 완료. 모바일 .env도 VM HTTPS 주소로 전환했습니다. 실제 휴대폰 가입/로그인 확인과 실제 AI 키 설정은 남아 있습니다.

| 항목 | 설정 |
| --- | --- |
| 프로젝트 / VM / 영역 | maeum-515107 / maeum-server / asia-northeast3-c |
| 외부 IP | 34.158.202.133, 고정 예약 maeum-server-ip |
| 사용자 | taehyun_park84 |
| 백엔드 경로 | /home/taehyun_park84/maeum-2nd/backend |
| Python | 3.12.3, backend/.venv |
| MySQL | 8.0.46, 127.0.0.1:3306, maeum_db, utf8mb4 |
| DB 계정 | maeum_user@localhost (maeum_db 전용 권한) |
| 설정 파일 | 위 backend 경로의 .env, 권한 0600 |
| 이미지 영속 경로 | /home/taehyun_park84/maeum-2nd/backend/storage |
| API | https://34.158.202.133 → Nginx → 127.0.0.1:8000 |
| 서비스 | maeum-api.service / maeum-worker.service |
| AI | mock, API 키 비움 |

로컬 SQLite/계정/대화/작품/backend .env/API 키는 업로드하지 않았습니다. 모바일 .env는 EXPO_PUBLIC_API_URL=https://34.158.202.133으로 변경했습니다. VM에는 기존 로컬 계정이 없으므로 앱에서 로그아웃 후 새로 가입해야 합니다.

## HTTPS 설정 (2026-11-22)

- Nginx 1.24, Certbot snap 5.10.0. IP용 Let's Encrypt shortlived 인증서 발급 완료. 도메인 구매 없음.
- 설정: /etc/nginx/sites-available/maeum-api. HTTP 인증 경로는 /var/www/maeum-acme, 나머지는 HTTPS 308 이동. HTTPS는 API로 프록시하며 스트리밍 버퍼링을 끄고 응답 제한 300초 적용.
- 인증서: /etc/letsencrypt/live/maeum-api/. 최초 만료 2026-11-29 02:25:53 KST. 자동 갱신 시 날짜 변경.
- snap.certbot.renew.timer enabled 확인. /etc/letsencrypt/renewal-hooks/deploy/maeum-nginx에서 nginx -t 후 reload. 갱신 dry-run 및 deploy hook 실행 성공.
- VM의 기존 HTTP/HTTPS 허용 설정 사용. MySQL 3306/API 8000은 루프백 전용 유지.
- 노트북에서 TLS 검증을 끄지 않고 HTTPS /health ok/mock 확인. VM에서 비로그인 /me 401, HTTP 308, 서비스 active/enabled 확인.
- 실제 AI 키는 아직 VM에 없으며 유료 호출하지 않았습니다. IP 인증서 지원 근거: https://letsencrypt.org/2026/03/11/shorter-certs-certbot

```bash
sudo systemctl status nginx snap.certbot.renew.timer --no-pager
sudo /snap/bin/certbot renew --cert-name maeum-api --dry-run --run-deploy-hooks
curl -fsS https://34.158.202.133/health
```

## 상태 및 관리 (VM SSH에서)

```bash
sudo systemctl status maeum-api maeum-worker --no-pager
curl -fsS http://127.0.0.1:8000/health

# 설정 변경 후 둘 다 재시작
sudo systemctl restart maeum-api maeum-worker

# 중지 / 시작
sudo systemctl stop maeum-api maeum-worker
sudo systemctl start maeum-api maeum-worker

# 최근 로그
sudo journalctl -u maeum-api -u maeum-worker -n 60 --no-pager
```

두 서비스는 root가 아닌 taehyun_park84로 실행되며 같은 작업 경로와 .env, MySQL 및 이미지 경로를 사용합니다. 재부팅 자동 시작(enabled), 실패 시 재시작을 설정했습니다. SSH 창을 닫아도 실행됩니다. 실제 VM 재부팅은 하지 않았습니다. 서비스 정의는 `/etc/systemd/system/maeum-api.service`, `/etc/systemd/system/maeum-worker.service`이며 backend에도 사본이 있습니다. [systemd 서비스 공식 문서](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html).

## 수행한 검증

- 업로드 ZIP SHA-256 일치, 잠금 파일 패키지 설치 성공, pip check 통과.
- Alembic `f115_profile_art_sources (head)`까지 스키마 생성.
- 최초 MySQL 검사에서 Float/DOUBLE 차이 발견. ORM 시간·기간 타입에 MySQL DOUBLE(asdecimal=False) variant를 명시하여 정밀도와 Python float 반환을 유지. 로컬 소스와 VM에 동일 반영. DB를 지우거나 타입 검사 전체를 비활성화하지 않았습니다.
- MySQL `alembic check` 통과. VM 기존 테스트 39개 통과(이 테스트들은 격리 SQLite 사용).
- 별도 MySQL 검사: 가입/로그인/대화/요약/작업 접수/작업자 함수 실행/그림·썸네일 조회/비로그인 차단 통과. 단일 외부 트랜잭션과 savepoint를 사용하고 끝에 rollback. 이미지는 임시 경로 사용. 실제 다중 프로세스 동시 처리 부하 시험은 아닙니다.
- 검사 후 업무 테이블 13개 모두 0건. Alembic 메타데이터만 존재. 영속 storage 파일 없음.
- 두 systemd 서비스 active/enabled, 서비스 재시작 후 HTTP health의 ok/mock 확인. API와 MySQL 모두 루프백 바인딩, 방화벽 공개 변경 없음.

`verify_mysql_flow.py`는 **빈 DB의 최초 배포 검증 전용**입니다. 테스트 후 업무 테이블 전체 0건을 요구하므로 정상 데이터를 만든 이후 그대로 실행하지 마세요. 앱 서비스의 일반 실행에는 이 스크립트가 호출되지 않습니다.

## 다음 연결 단계

1. 휴대폰 브라우저에서 https://34.158.202.133/health를 확인합니다. MySQL 3306과 API 8000은 외부에 열지 않습니다.
2. 실제 AI 사용 시 사용자가 VM의 `.env`에 직접 키를 입력하고 AI_MODE=openai로 설정한 후 두 서비스를 재시작합니다. 모델 접근 권한/비용은 별도 확인이 필요하며 이번에는 유료 호출하지 않았습니다.
3. 모바일 EXPO_PUBLIC_API_URL은 HTTPS로 변경 완료. Expo에서 앱을 다시 열고 로그아웃/새 회원가입 후 사용합니다. 키는 모바일에 넣지 않습니다.
4. 로컬 SQLite 데이터를 이관할지 별도로 결정합니다. 현재 MySQL에는 기존 계정이 없으며 SQLite 파일은 자동 이전되지 않습니다.
5. 운영 전 MySQL 동시 작업/장애 복구, 이미지·DB 백업과 복원, 저장 기간·안전 대응을 추가 검증합니다.
