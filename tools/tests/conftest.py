import pathlib
import sys

# Make tools/ importable so tests can `import llm_adapter`, `import config`, etc.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
