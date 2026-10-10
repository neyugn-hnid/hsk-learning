import json
import re
import sys
from pathlib import Path

from docx import Document


SOURCE = Path(__file__).parents[1] / "data" / "(1) TIẾNG TRUNG_Bai1-10.docx"
OUTPUT = Path(__file__).parents[1] / "data" / "bai1-10-sentences.json"

LESSON_RE = re.compile(r"第\s*(\d+)\s*课")
VOCAB_RE = re.compile(r"^(.+?)\s+\(([^()]*)\)\s+\(([^()]*)\):\s*(.+)$")
ANSWER_RE = re.compile(
    r"([\u3400-\u9fff][^。！？]*[。！？]+)\s*[。！？]*\s*"
    r"([A-Za-zÀ-ỹ][^\u3400-\u9fff]*?)(?=[\u3400-\u9fff]|$)"
)


def is_lesson_heading(text):
    match = LESSON_RE.search(text)
    return int(match.group(1)) if match else None


def is_answer_heading(text):
    return text.startswith("参考答案")


def split_answers(text):
    answers = []
    for match in ANSWER_RE.finditer(text):
        answers.append({"hanzi": match.group(1).strip(), "pinyin": match.group(2).strip()})
    return answers


def extract_lessons(paragraphs):
    lessons = []
    current = None
    in_answers = False
    answer_lines = []
    pending_sentence = None
    pending_vocabulary = []

    def flush_sentence():
        nonlocal pending_sentence, pending_vocabulary
        if pending_sentence and current is not None:
            current["sentences"].append(
                {
                    "vietnamese": pending_sentence,
                    "vocabulary": pending_vocabulary,
                }
            )
        pending_sentence = None
        pending_vocabulary = []

    def flush_answers():
        if current is None:
            return
        answers = []
        for line in answer_lines:
            answers.extend(split_answers(line))
        for index, answer in enumerate(answers):
            if index < len(current["sentences"]):
                current["sentences"][index].update(answer)

    for raw_text in paragraphs:
        text = " ".join(raw_text.split())
        if not text:
            continue

        if is_answer_heading(text):
            if current is not None:
                flush_sentence()
            in_answers = True
            answer_lines = []
            continue

        lesson_number = is_lesson_heading(text)
        if lesson_number is not None:
            if current is not None:
                flush_sentence()
                flush_answers()
                lessons.append(current)
            current = {"lesson": lesson_number, "title": text, "sentences": []}
            in_answers = False
            answer_lines = []
            continue

        if current is None:
            continue

        if in_answers:
            answer_lines.append(text)
            continue

        if text.startswith("→"):
            flush_sentence()
            continue

        vocab_match = VOCAB_RE.match(text)
        if vocab_match and pending_sentence is not None:
            pending_vocabulary.append(
                {
                    "hanzi": vocab_match.group(1).strip(),
                    "pinyin": vocab_match.group(2).strip(),
                    "word_type": vocab_match.group(3).strip(),
                    "meaning": vocab_match.group(4).strip(),
                }
            )
            continue

        if pending_sentence is None and not text.startswith("第"):
            pending_sentence = text

    if current is not None:
        flush_sentence()
        flush_answers()
        lessons.append(current)

    return lessons


def main():
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else SOURCE
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else OUTPUT
    document = Document(source)
    paragraphs = [paragraph.text for paragraph in document.paragraphs]
    result = {"source": source.name, "lessons": extract_lessons(paragraphs)}
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output} with {len(result['lessons'])} lessons")
    print(f"Sentences: {sum(len(lesson['sentences']) for lesson in result['lessons'])}")


if __name__ == "__main__":
    main()