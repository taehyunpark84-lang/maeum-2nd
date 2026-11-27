"""Artwork-only cleanup; chat originals and ordinary bracketed story text stay intact."""
import re
from .chat_text import SOURCE

DEMO_STORY = re.compile(r'(?m)^[ \t]*\[시연 (?:이야기|요약)\][ \t]*(?:\r?\n)?')


def clean_art_story(text):
    text = SOURCE.sub('', text)
    while DEMO_STORY.search(text):
        text = DEMO_STORY.sub('', text)
    return text.strip()
