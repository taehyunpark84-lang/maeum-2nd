"""그림 연출에 감정을 반영할지 결정합니다. 외부 라이브러리 없이 테스트할 수 있도록 분리했습니다."""
EMOTIONS = ('기쁨', '분노', '상처', '슬픔', '당황', '불안')

# 색·화풍은 art_direction.py가 따로 고르므로, 여기서는 색을 지정하지 않고 정서의 방향만 둡니다.
HINTS = {
    '기쁨': '생동감 있는 움직임과 열린 구도, 환하게 퍼지는 빛',
    '분노': '거센 에너지를 부정하지 않되 단단한 형태와 안정된 중심으로 가라앉히는 구도. 공격적이거나 폭력적인 표현은 피한다',
    '상처': '여린 존재를 부드럽게 감싸는 형태와 온기가 느껴지는 빛, 보호받는 느낌의 질감',
    '슬픔': '여백과 고요한 호흡, 곁에 머무는 존재의 온기, 쉬어 가는 느낌',
    '당황': '흐트러진 요소들이 하나의 중심으로 천천히 정돈되어 가는 구도',
    '불안': '흔들리는 요소를 받쳐 주는 안정된 중심과 넓게 열린 시야, 안심이 되는 빛',
}


def decide(classifier, gpt_emotion, minimum):
    """(사용 여부, 이유). 분류 모델이 minimum 이상으로 확신하고 GPT의 독립 판단과 같을 때만 True."""
    if not classifier:
        return False, 'no_classifier'
    if classifier['confidence'] < minimum:
        return False, 'uncertain'
    gpt_emotion = (gpt_emotion or '').strip()
    if gpt_emotion not in EMOTIONS:
        return False, 'gpt_unclear'
    if gpt_emotion != classifier['emotion']:
        return False, 'disagree'
    return True, 'agreed'


def hint_text(emotion):
    return ('\n감정 참고: 이야기에서 확인된 중심 감정은 ' + emotion + '이다. 감정을 지우거나 억지로 행복하게 만들지 말고, '
            '색과 화풍은 위의 선택을 따르되 다음 정서의 방향을 장면의 분위기·구도·빛의 성질에 반영한다: ' + HINTS[emotion])
