"""Add scene-aligned narration to the preserved candidate.21 demonstration.

Requires ffmpeg, ffprobe and Pillow. Generate the seven WAV files with the
pinned launch-video-kit gen-voice.mjs and docs/contest/demo-voiceover.json.
No network calls or credentials are used by this editor.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, required=True)
parser.add_argument('--voice-dir', type=Path, required=True)
parser.add_argument('--font', type=Path, required=True)
parser.add_argument('--work-dir', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
args.work_dir.mkdir(parents=True, exist_ok=True)
args.output.parent.mkdir(parents=True, exist_ok=True)
config = json.loads((ROOT/'docs/contest/demo-voiceover.json').read_text(encoding='utf-8'))

def run(command):
    subprocess.run(command, check=True)

def duration(filename):
    return float(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'csv=p=0', str(filename)], text=True).strip())

def digest(filename):
    return hashlib.sha256(Path(filename).read_bytes()).hexdigest()

def clock(seconds, separator=','):
    milliseconds = round(seconds*1000)
    return f'{milliseconds//3600000:02}:{milliseconds//60000%60:02}:{milliseconds//1000%60:02}{separator}{milliseconds%1000:03}'

# Stable portions of the original recording, omitting route loading frames.
ranges = [(2.0,18.64),(20.12,36.08),(37.08,53.08),
          (54.04,70.04),(71.36,87.32),(88.44,104.44)]
routes = ['/', '/desde-fp/ADG02S', '/desde-fp/ADG02S/ofertas',
          '/formacion/ADG02S', '/comparar?program=ADG02S', '/datos-abiertos', '/']
teal, cream = '#124e46', '#fafaf7'
font = lambda size: ImageFont.truetype(str(args.font), size)

closing = Image.new('RGB', (1280,800), cream)
draw = ImageDraw.Draw(closing)
draw.rectangle((0,0,1280,16), fill=teal)
draw.text((92,108), 'SALIDA CyL', font=font(76), fill=teal)
draw.text((96,237), 'De la formación profesional', font=font(44), fill=teal)
draw.text((96,296), 'al siguiente paso.', font=font(44), fill=teal)
draw.rounded_rectangle((92,408,1188,530), radius=18, fill=teal)
draw.text((130,430), 'salidacyl.es', font=font(67), fill='white')
draw.text((96,596), 'Explora tu FP · Consulta las fuentes · Descarga la memoria', font=font(29), fill=teal)
draw.text((96,700), 'X Concurso de Datos Abiertos de Castilla y León · 2026', font=font(25), fill='#47635d')
closing_path = args.work_dir/'closing.png'
closing.save(closing_path)

# A slim title band adds the actual address without obscuring the recorded UI.
banner = Image.new('RGB', (1280,44), teal)
ImageDraw.Draw(banner).text((28,7), 'SALIDA CyL  ·  salidacyl.es', font=font(25), fill='white')
banner_path = args.work_dir/'banner.png'
banner.save(banner_path)

segments, scenes, subtitles = [], [], []
offset = 0.0
for index, line in enumerate(config['lines']):
    voice = args.voice_dir/f"vo-{line['id']}.wav"
    spoken = duration(voice)
    length = ranges[index][1]-ranges[index][0] if index<6 else 18.0
    lead = 0.8 if index<6 else 1.0
    if spoken+lead+0.4>length:
        raise ValueError(f"Narration {line['id']} does not fit its scene")
    segment = args.work_dir/f"segment-{line['id']}.mp4"
    command = ['ffmpeg','-v','error','-y']
    if index<6:
        command += ['-ss',str(ranges[index][0]),'-t',str(length),'-i',str(args.source),
                    '-loop','1','-i',str(banner_path),'-i',str(voice)]
        filters = '[0:v]setpts=PTS-STARTPTS,pad=1280:844:0:44:color=0x124e46[base];[base][1:v]overlay=0:0,setsar=1[v];'
        audio_index=2
    else:
        command += ['-loop','1','-i',str(closing_path),'-i',str(voice)]
        filters = '[0:v]pad=1280:844:0:22:color=0xfafaf7,setsar=1[v];'
        audio_index=1
    filters += f'[{audio_index}:a]adelay={round(lead*1000)}:all=1,apad,atrim=duration={length}[a]'
    command += ['-filter_complex',filters,'-map','[v]','-map','[a]',
                '-t',str(length),'-r','25','-c:v','libx264','-preset','medium',
                '-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k',
                '-ar','48000','-movflags','+faststart',str(segment)]
    run(command)
    segments.append(segment)
    scenes.append({'id':line['id'],'route':routes[index],'startSeconds':offset,
                   'durationSeconds':length,'speechStartSeconds':offset+lead,
                   'speechDurationSeconds':spoken,'voiceSha256':digest(voice)})
    # Sentence cues remain short enough to read over the existing scene captions.
    sentences = [sentence.strip()+'.' for sentence in line['text'].split('.') if sentence.strip()]
    total_characters = sum(len(sentence) for sentence in sentences)
    cursor=offset+lead
    for sentence in sentences:
        end=cursor+spoken*len(sentence)/total_characters
        subtitles.append((cursor,end,sentence))
        cursor=end
    offset+=length
    print(f"Rendered scene {line['id']}: {length:.2f}s",flush=True)

concat_path=args.work_dir/'segments.txt'
concat_path.write_text(''.join("file '"+str(p.resolve()).replace('\\','/')+"'\n" for p in segments),encoding='utf-8')
subtitle_path=args.output.with_suffix('.srt')
subtitle_path.write_text(''.join(f'{i+1}\n{clock(start)} --> {clock(end)}\n{text}\n\n' for i,(start,end,text) in enumerate(subtitles)).rstrip()+'\n',encoding='utf-8',newline='\n')
args.output.with_suffix('.vtt').write_text('WEBVTT\n\n'+''.join(f'{clock(start,".")} --> {clock(end,".")}\n{text}\n\n' for start,end,text in subtitles).rstrip()+'\n',encoding='utf-8',newline='\n')
run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(concat_path),
     '-i',str(subtitle_path),'-map','0:v','-map','0:a','-map','1:s',
     '-c:v','copy','-c:a','copy','-c:s','mov_text','-metadata:s:a:0','language=spa',
     '-metadata:s:s:0','language=spa','-metadata','title=SALIDA CyL - Demostración narrada',
     '-movflags','+faststart',str(args.output)])
manifest={'schemaVersion':1,'sourceRecordingCommit':'ca8289ebe12c888af7765a212ce44b3754f838ca',
          'sourceFile':args.source.name,'sourceSha256':digest(args.source),
          'canonicalUrl':'https://salidacyl.es/','voiceProvider':'NaN',
          'model':config['model'],'voice':config['voice'],'syntheticNarration':True,
          'originalRecordingPreserved':True,'previousMemoSceneReplaced':True,
          'outputFile':args.output.name,'outputSha256':digest(args.output),
          'durationSeconds':duration(args.output),'scenes':scenes,
          'voiceoverSha256':digest(ROOT/'docs/contest/demo-voiceover.json')}
args.output.with_suffix('.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Created {args.output} ({manifest["durationSeconds"]:.2f}s)',flush=True)
