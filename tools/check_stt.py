import os
import sys
import json
from pathlib import Path

# Ensure project root on sys.path
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=ROOT / '.env', override=True)
except Exception:
    pass

os.environ.setdefault('HF_HOME', str(Path.home() / '.cache' / 'huggingface'))

from app.speech_to_text import SpeechToText

TEST_WAV = ROOT / 'data' / 'tmp' / 'test1s.wav'

result = {
    'root': str(ROOT),
    'env': {
        'VOSK_MODEL_PATH': os.environ.get('VOSK_MODEL_PATH'),
        'HF_HOME': os.environ.get('HF_HOME'),
    },
    'wav_exists': TEST_WAV.exists(),
    'wav': str(TEST_WAV),
}

try:
    st = SpeechToText()
    result['init_ok'] = True
    try:
        out = st.transcribe(str(TEST_WAV))
        result['transcribe_ok'] = True
        result['out'] = out
    except Exception as e:
        result['transcribe_ok'] = False
        result['transcribe_err'] = repr(e)
except Exception as e:
    result['init_ok'] = False
    result['init_err'] = repr(e)

print(json.dumps(result, indent=2))
