"""Generate the Spanish demo narration with edge-tts 7.2.8 and FFmpeg.

Uses the online Microsoft Edge TTS service without an API key. Keep the raw
audio and word boundaries so the final subtitles follow the spoken voice.
"""
import argparse
import asyncio
import importlib.metadata
import json
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]


async def generate(config, output):
    version = importlib.metadata.version('edge-tts')
    if version != config['clientVersion']:
        raise ValueError(f"Install edge-tts=={config['clientVersion']}; found {version}")
    output.mkdir(parents=True, exist_ok=True)
    for line in config['lines']:
        stem = output / f"vo-{line['id']}"
        raw = stem.with_suffix('.mp3')
        boundaries = stem.with_suffix('.jsonl')
        await edge_tts.Communicate(
            line['text'], voice=config['voice'], rate=config['rate'],
            boundary='WordBoundary',
        ).save(str(raw), str(boundaries))
        norm = config['loudnorm']
        target = f"loudnorm=I={norm['I']}:TP={norm['TP']}:LRA={norm['LRA']}"
        measurement = subprocess.run([
            'ffmpeg', '-hide_banner', '-i', str(raw), '-af',
            target + ':print_format=json', '-f', 'null', '-',
        ], check=True, capture_output=True, text=True).stderr
        measured, _ = json.JSONDecoder().raw_decode(measurement[measurement.rfind('{'):])
        normalize = (target + f":measured_I={measured['input_i']}"
                     + f":measured_TP={measured['input_tp']}"
                     + f":measured_LRA={measured['input_lra']}"
                     + f":measured_thresh={measured['input_thresh']}"
                     + f":offset={measured['target_offset']}:linear=true")
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af', normalize,
            '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le',
            str(stem.with_suffix('.wav')),
        ], check=True)
        words = []
        cursor = 0
        for record in boundaries.read_text(encoding='utf-8').splitlines():
            item = json.loads(record)
            if item['type'] == 'WordBoundary':
                position = line['text'].find(item['text'], cursor)
                if position < 0 or any(char.isalnum() for char in line['text'][cursor:position]):
                    raise ValueError(f"Unexpected or missing word in scene {line['id']}")
                cursor = position + len(item['text'])
                words.append({'start': item['offset'] / 10_000_000,
                              'end': (item['offset'] + item['duration']) / 10_000_000,
                              'position': position})
        if any(char.isalnum() for char in line['text'][cursor:]):
            raise ValueError(f"Incomplete boundaries for scene {line['id']}")
        cues = []
        first = 0
        for index, word in enumerate(words):
            last = index == len(words) - 1
            end = len(line['text']) if last else words[index + 1]['position']
            text = line['text'][words[first]['position']:end].strip()
            if last or len(text) >= 70 or index - first >= 7 or text.endswith(('.', '?', '!')):
                cues.append({'startSeconds': words[first]['start'],
                             'durationSeconds': word['end'] - words[first]['start'],
                             'text': text})
                first = index + 1
        if not cues:
            raise ValueError(f"No word boundaries for scene {line['id']}")
        stem.with_suffix('.cues.json').write_text(
            json.dumps(cues, ensure_ascii=False, indent=2) + '\n',
            encoding='utf-8', newline='\n',
        )
        print(f"Generated {line['id']}: {config['voice']}", flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path, required=True)
    args = parser.parse_args()
    config = json.loads((ROOT / 'docs/contest/demo-voiceover.json').read_text(encoding='utf-8'))
    asyncio.run(generate(config, args.output_dir))
