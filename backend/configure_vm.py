"""VM 최초 설정. 비밀번호는 숨김 입력하며 기존 .env는 덮어쓰지 않습니다."""
from getpass import getpass
from pathlib import Path
import os
from sqlalchemy import URL, create_engine, text

root = Path(__file__).resolve().parent
target = root / '.env'
if target.exists():
    raise SystemExit('Existing .env preserved; edit it manually.')
password = getpass('MySQL password (hidden): ')
url = URL.create('mysql+pymysql', username='maeum_user', password=password,
                 host='127.0.0.1', port=3306, database='maeum_db',
                 query={'charset': 'utf8mb4'})
engine = create_engine(url, hide_parameters=True)
try:
    with engine.connect() as conn:
        print('Connected:', conn.execute(text('SELECT CURRENT_USER(), DATABASE()')).one())
except Exception as exc:
    raise SystemExit('Connection failed: ' + type(exc).__name__)
finally:
    engine.dispose()
data = root / 'storage'
data.mkdir(exist_ok=True)
value = url.render_as_string(hide_password=False)
# dotenv double quotes escape backslashes and quotes; the URL encodes password delimiters.
value = value.replace('\\', '\\\\').replace('"', '\\"')
content = ('AI_MODE=mock\nOPENAI_API_KEY=\n'
           'TEXT_MODEL=gpt-6.1-terra\nIMAGE_MODEL=gpt-image-2.6-flare\n'
           'IMAGE_REQUESTS_PER_HOUR=30\n'
           f'DATA_DIR={data}\nDATABASE_URL="{value}"\n')
fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(fd, 'w', encoding='utf-8') as handle:
    handle.write(content)
print('Created private .env; AI mode mock; no API key copied.')
