"""Exercise real native persistence handlers with an isolated temporary data folder."""
import importlib.util
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest

spec = importlib.util.spec_from_file_location('fable_shell', Path(__file__).resolve().parents[1] / 'packaging/fable.py')
shell = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shell)


class Message:
    def __init__(self, payload):
        self.payload = payload

    def get_js_value(self):
        return SimpleNamespace(to_string=lambda: json.dumps(self.payload))


class NativeStorageTests(unittest.TestCase):
    def test_theme_and_brush_preferences_are_saved_atomically(self):
        with tempfile.TemporaryDirectory() as directory:
            app = SimpleNamespace(smoke_test=False, state_dir=Path(directory))
            prefs = {'uiTheme': 'dark', 'terrain': {'noise': 88}, 'room': {'shape': 'cavern'}}
            shell.Fable.on_message(app, None, Message({'type': 'preferences', 'preferences': prefs}))
            self.assertEqual(json.loads((app.state_dir / 'preferences.json').read_text()), prefs)
            self.assertFalse((app.state_dir / 'preferences.tmp').exists())
            prefs['uiTheme'] = 'light'
            shell.Fable.on_message(app, None, Message({'type': 'preferences', 'preferences': prefs}))
            self.assertEqual(json.loads((app.state_dir / 'preferences.json').read_text())['uiTheme'], 'light')

    def test_smoke_mode_does_not_write_preferences_or_autosave(self):
        with tempfile.TemporaryDirectory() as directory:
            app = SimpleNamespace(smoke_test=True, state_dir=Path(directory))
            for payload in [{'type': 'preferences', 'preferences': {'uiTheme': 'dark'}}, {'type': 'autosave', 'document': {'version': 2}}]:
                shell.Fable.on_message(app, None, Message(payload))
            self.assertEqual(list(app.state_dir.iterdir()), [])


if __name__ == '__main__':
    unittest.main()
