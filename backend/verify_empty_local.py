"""최초 이전 검증 전용: 로컬 DB를 읽기만 하며 초기화/삭제하지 않습니다."""
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB = ROOT / 'storage' / 'maeum-2nd.db'


def main():
    assert DB.is_file(), 'Run alembic upgrade head first'
    with sqlite3.connect(DB.as_uri() + '?mode=ro', uri=True) as connection:
        tables = [row[0] for row in connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )]
        assert 'alembic_version' in tables, 'Migration metadata missing'
        for table in sorted(tables):
            quoted = '"' + table.replace('"', '""') + '"'
            count = connection.execute(f'SELECT COUNT(*) FROM {quoted}').fetchone()[0]
            print(f'{table}: {count}')
            if table != 'alembic_version':
                assert count == 0, f'{table} contains user data; do not automatically delete it'
        assert connection.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
        assert not connection.execute('PRAGMA foreign_key_check').fetchall()
    for folder in ('images', 'thumbnails', 'backups'):
        files = list((ROOT / 'storage' / folder).rglob('*'))
        assert not any(path.is_file() for path in files), f'{folder} is not empty'
    print('PASS: empty local schema, integrity OK, no images/thumbnails/backups')


if __name__ == '__main__':
    main()
