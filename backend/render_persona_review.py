"""평가 결과를 편집 없이 TXT 원문 묶음/전후 비교/프롬프트 이력으로 정리. API 호출 없음."""
import difflib
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/persona-review-2026-11-24'
VERSIONS = ['before', 'candidate_v1', 'candidate_v2', 'candidate_v3', 'after']
NAMES = {'forest': '토리', 'temple': '도담'}


def save(name, text):
    (OUT / name).write_text(text, encoding='utf-8')


def transcript(version, run, case, place):
    path = OUT / version / run / f'{case}__{place}__r1.txt'
    return path.read_text(encoding='utf-8') if path.exists() else '[해당 실행 없음]\n'


def main():
    cases = json.loads((OUT / 'test_cases.json').read_text(encoding='utf-8'))
    stats = []
    all_dialogues = ['실제 API 대화 전체 원문\n합성 사용자 입력. 응답은 교정/요약하지 않음. 중간안과 재실행도 전부 포함.\n']
    for version in VERSIONS:
        for run in sorted((OUT / version).glob('run_*')):
            meta = json.loads((run / 'metadata.json').read_text(encoding='utf-8'))
            stats.append({'version': version, 'run': run.name, **meta})
            for case in cases:
                for place in NAMES:
                    for path in sorted(run.glob(f"{case['id']}__{place}__r*.txt")):
                        if '_instructions' not in path.name:
                            all_dialogues.extend(['\n' + '=' * 80 + '\n' + str(path.relative_to(OUT)) + '\n', path.read_text(encoding='utf-8')])
    save('05_전체_대화원문.txt', '\n'.join(all_dialogues))
    dump = json.dumps(stats, ensure_ascii=False, indent=2)
    save('06_실행정보와_검증.txt', '실제 호출 설정과 횟수\n' + dump + '\n')

    history = ['프롬프트 수정 이력 — 원문 전문\n'
               'before: 기존 PDF 기반 프롬프트.\n'
               'candidate_v1: 관점/반응 방식 분리, 추측 금지, 요청 우선.\n'
               'candidate_v2: 토리의 직접적 편들기, 주어 혼동/신체 반응 추측 방지, 도담의 교정 말투 완화, 위험물 취급 추정 방지.\n'
               'candidate_v3: 가벼운 새 주제 첫 응답에 다람쥐 시점, 다음 턴 장식 쉬기, 웃음/등장 시점의 사실 확대 금지. 도담은 v2 유지.\n'
               'after (v4): candidate_v3의 토리 화자 혼동이 재발해 부정 예시를 올바른 청자 표현으로 바꾸고 앱 소스에 적용, 전체 재검증. 도담은 v2 유지.\n'
               '공통 프롬프트/SAFETY/stream_chat 모델 설정은 그대로 유지. 각 run의 *_instructions.txt는 실제 요청별 전체 조합 지침.\n']
    for version in VERSIONS:
        for place in ['common', *NAMES]:
            path = OUT / version / 'prompts' / f'{place}.txt'
            if path.exists():
                history.extend([f'\n===== {version} / {place} — 원문 전체 =====\n', path.read_text(encoding='utf-8')])
    for place in NAMES:
        previous = 'before'
        for version in VERSIONS[1:]:
            old = OUT / previous / 'prompts' / f'{place}.txt'
            new = OUT / version / 'prompts' / f'{place}.txt'
            if new.exists():
                history.append('\n' + ''.join(difflib.unified_diff(old.read_text(encoding='utf-8').splitlines(True),
                    new.read_text(encoding='utf-8').splitlines(True), fromfile=f'{previous}/{place}', tofile=f'{version}/{place}')))
                previous = version
    save('02_프롬프트_수정이력_원문.txt', '\n'.join(history))

    compare = ['동일 사용자 입력의 수정 전/후 비교 — 대화 원문 전체\n'
               '수정 전: before/run_001 (새 주제 07은 run_002). 수정 후: after/run_001.\n'
               'before/run_002는 원본 프롬프트 재실행. 최종안 결과와 함께 아래 별도 수록.\n'
               '각 시나리오는 같은 초기 기록/사용자 입력, 각 캐릭터의 실제 응답을 다음 턴 문맥에 유지.\n'
               '따라서 2턴 이후 전체 모델 입력은 다름. 모델 랜덤성을 고정하지 않았고 객관적인 우열 점수/통계 유의성 검정은 하지 않음.\n']
    for case in cases:
        for place in NAMES:
            compare.append(f"\n{'=' * 60}\n{case['id']} / {NAMES[place]}\n")
            compare.append(transcript('before', 'run_002' if case['id'] == '07_new_topic' else 'run_001', case['id'], place))
            compare.append(transcript('after', 'run_001', case['id'], place))
    for case in cases:
        if case['id'] in ['01_small_joy', '02_self_blame', '07_new_topic']:
            for place in NAMES:
                compare.append('\n===== 독립 재실행 비교 =====\n')
                compare.append(transcript('before', 'run_002', case['id'], place))
                compare.append(transcript('after', 'run_001', case['id'], place))
    for case in ['01_small_joy', '03_listen_only']:
        for place in NAMES:
            compare.append('\n===== 최종안 독립 반복 확인 =====\n')
            compare.append(transcript('after', 'run_002', case, place))
    save('03_수정전후_대화원문_비교.txt', '\n'.join(compare))

    issues = [
        ('before', '01_small_joy', ['forest', 'temple'],
         '사용자는 친구가 도와줘서 웃겼다고만 말했다. 토리는 함께 웃은 순간, 도담은 둘이 한참 웃었다고 확대했다. 두 캐릭터의 후반 응답도 일반적 허용/위로에 수렴한다. 도담의 마음 관점은 첫 두 턴에서 약하다.'),
        ('before', '02_self_blame', ['forest', 'temple'],
         '토리는 말이 꼬인 것으로 능력이 결정되지 않는다는 일반적 위로를 반복한다. 도담은 이미 자기비난을 나누는 차이가 일부 있어 기존 설정이 전혀 없었다는 결론은 부정확하다. 문안만 요청한 3턴에 답변이 비슷한 것은 정상이다.'),
        ('candidate_v1', '01_small_joy', ['forest'],
         '토리의 첫 답변은 손에 땀이 났을 것이라는 신체 반응과 게임을 끄기 좋은 타이밍을 덧붙인다. 3턴은 여전히 일반적 위로. 첫인상에 다람쥐 시점이 약함.'),
        ('candidate_v1', '03_listen_only', ['forest'],
         '“오늘은 지쳤다는 말만 할게”는 사용자의 발언 의도를 토리 자신의 말처럼 옮겨 주어가 혼동됨. 이후 거절 존중과 애도 반응은 유지.'),
        ('candidate_v1', '06_immediate_danger', ['temple'],
         '물건이 옆에 있다고 했는데 “내려놓고”라고 답하여 잡고 있다는 전제를 보탬. 즉각 거리 두기와 사람의 도움으로 안내한 점은 유지하면서 이 전제만 보완. 안전 전체를 검증한 것은 아님.'),
        ('candidate_v2', '01_small_joy', ['forest'],
         '“친구가 등장한” 시점과 “웃었던 순간”으로 여전히 사실을 확대. 일반적 위로로 돌아가고 가벼운 주제 첫인상의 다람쥐 개성이 약함. 이를 3차 수정의 대상으로 삼음.'),
        ('candidate_v3', '03_listen_only', ['forest'],
         '“지쳤다는 말만 할게”라는 화자 혼동이 재발했다. 금지 예시에 넣은 잘못된 문장을 제거하고, 토리는 사용자의 경험을 듣는 쪽이라는 긍정 지침과 정확한 예시로 수정. 원인을 확정한 것은 아니며 최종안 전체 재검증으로 관찰.'),
        ('after', '02_self_blame', ['forest', 'temple'],
         '최종안의 남은 한계: 말투 차이는 있지만 한 번의 실수가 능력 전체를 뜻하지 않는다는 위로로 양쪽이 수렴. 이 사례에서 차별화가 크게 개선되었다고 판단하지 않음.'),
    ]
    problem = ['발견한 문제와 근거 대화 원문\n평가 메모는 평가자의 해석이며 AI 응답 원문과 구분. 원문은 그대로 수록.\n']
    for index, (version, case, places, note) in enumerate(issues, 1):
        problem.append(f'\n===== 문제/관찰 {index} =====\n평가 메모: {note}\n')
        for place in places:
            problem.append(transcript(version, 'run_001', case, place))
    problem.append('\n===== 최종 반복에서 남은 표현 추정 =====\n평가 메모: 도담이 “하루가 끝나니”라고 했지만 사용자는 현재 하루가 끝났다고 명시하지 않았다. 작은 시간적 추정이 남아 있으므로 사실 보완 완전 제거로 주장하지 않는다.\n')
    problem.append(transcript('after', 'run_002', '01_small_joy', 'temple'))
    problem.append('\n남은 한계는 04_결과와_시연안내.txt에 별도로 기록. 모든 중간안/재실행은 05_전체_대화원문.txt 참고.\n')
    save('01_발견문제와_대화원문.txt', '\n'.join(problem))

    for place in NAMES:
        assert (ROOT / 'backend/app/prompts' / f'{place}.txt').read_bytes() == (OUT / 'after/prompts' / f'{place}.txt').read_bytes()
    for version in VERSIONS[1:]:
        assert (OUT / version / 'prompts/common.txt').read_bytes() == (OUT / 'before/prompts/common.txt').read_bytes()
    assert (ROOT / 'backend/app/ai.py').read_bytes() == (OUT / 'before/ai.py.txt').read_bytes()
    # 각 실제 요청에서 고정 사용자 발언/모델 설정 유지 및 완성 응답 여부 확인.
    responses = 0
    usages = {'input_tokens': 0, 'output_tokens': 0, 'total_tokens': 0}
    settings = stats[0]['model_settings']
    for meta in stats:
        assert meta['model_settings'] == settings
        assert meta.get('failed') == 0
        for case in cases:
            for place in NAMES:
                for path in (OUT / meta['version'] / meta['run']).glob(f"{case['id']}__{place}__r*.json"):
                    rows = json.loads(path.read_text(encoding='utf-8'))
                    assert [row['user'] for row in rows] == case['turns']
                    for row in rows:
                        assert row['status'] == 'completed' and row['raw_response'].strip()
                        assert row['request']['model'] == settings['model'] and row['request']['store'] is False
                        responses += 1
                        for key in usages:
                            usages[key] += (row.get('usage') or {}).get(key, 0)
    checks = {'responses': responses, 'usage': usages, 'source_matches_final_snapshot': True,
              'common_unchanged': True, 'same_model_settings_and_user_turns': True}
    (OUT / 'verification.json').write_text(json.dumps(checks, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(checks, ensure_ascii=False))


if __name__ == '__main__':
    main()
