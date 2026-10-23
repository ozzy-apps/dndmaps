#!/usr/bin/python3
"""Offline GTK/WebKit desktop shell for Fable Map Studio."""
import argparse
import base64
import json
import os
from pathlib import Path
import sys

import gi
gi.require_version('Gtk', '3.0')
gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, WebKit2, GLib, Gio, Gdk

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent if (BASE.parent / 'app').is_dir() else BASE
APP_DIR = ROOT / 'app' if (ROOT / 'app').is_dir() else Path('/usr/share/fable-map-studio/app')
MAX_PROJECT = 30 * 1024 * 1024


class Fable(Gtk.Application):
    def __init__(self, smoke_test=False, screenshot=None, capture=None):
        super().__init__(application_id='studio.fable.MapStudio', flags=Gio.ApplicationFlags.NON_UNIQUE)
        self.capture = capture or {}
        self.smoke_test = smoke_test
        self.screenshot_path = screenshot
        self.exit_status = 0
        self.state_dir = Path(GLib.get_user_data_dir()) / 'fable-map-studio'
        self.connect('activate', self.activate_window)

    def activate_window(self, _application):
        self.window = Gtk.ApplicationWindow(application=self)
        self.window.set_title('Fable — Map studio')
        self.window.set_default_size(1520, 1000)
        self.window.set_size_request(1020, 700)
        self.window.set_icon_from_file(str(APP_DIR / 'assets/fable.svg'))
        self.manager = WebKit2.UserContentManager()
        self.manager.connect('script-message-received::native', self.on_message)
        self.manager.register_script_message_handler('native')
        if self.smoke_test:
            self.manager.add_script(WebKit2.UserScript.new('window.__FABLE_SMOKE__=true;window.__FABLE_CAPTURE__=' + json.dumps(self.capture) + ';', WebKit2.UserContentInjectedFrames.TOP_FRAME, WebKit2.UserScriptInjectionTime.START, None, None))
        if not self.smoke_test:
            try:
                prefs = json.loads((self.state_dir / 'preferences.json').read_text())
                self.manager.add_script(WebKit2.UserScript.new(
                    'window.__FABLE_PREFERENCES__ = ' + json.dumps(prefs) + ';',
                    WebKit2.UserContentInjectedFrames.TOP_FRAME,
                    WebKit2.UserScriptInjectionTime.START, None, None))
            except (OSError, ValueError):
                pass
            try:
                state = (self.state_dir / 'autosave.fable').read_text()
                if len(state) <= MAX_PROJECT:
                    payload = json.dumps(json.loads(state)).replace('</', '<\\/')
                    self.manager.add_script(WebKit2.UserScript.new(
                        'window.__FABLE_INITIAL__ = ' + payload + ';',
                        WebKit2.UserContentInjectedFrames.TOP_FRAME,
                        WebKit2.UserScriptInjectionTime.START, None, None))
            except (OSError, ValueError):
                pass
        self.webview = WebKit2.WebView.new_with_user_content_manager(self.manager)
        settings = self.webview.get_settings()
        settings.set_allow_file_access_from_file_urls(True)
        settings.set_enable_write_console_messages_to_stdout(self.smoke_test)
        self.webview.connect('decide-policy', self.on_policy)
        self.webview.connect('load-changed', self.on_load)
        self.webview.connect('web-process-terminated', self.on_crash)
        self.window.add(self.webview)
        self.webview.load_uri((APP_DIR / 'index.html').as_uri())
        self.window.show_all()
        if self.smoke_test:
            GLib.timeout_add_seconds(90, self.test_timeout)

    def on_policy(self, _view, decision, decision_type):
        if decision_type == WebKit2.PolicyDecisionType.NAVIGATION_ACTION:
            uri = decision.get_navigation_action().get_request().get_uri()
            if not uri.startswith((APP_DIR / 'index.html').as_uri()):
                decision.ignore()
                return True
        return False

    def on_message(self, _manager, result):
        try:
            message = json.loads(result.get_js_value().to_string())
            kind = message.get('type')
            if kind == 'autosave' and not self.smoke_test:
                content = json.dumps(message['document'])
                if len(content) > MAX_PROJECT:
                    return
                self.state_dir.mkdir(parents=True, exist_ok=True)
                temporary = self.state_dir / 'autosave.tmp'
                temporary.write_text(content)
                temporary.replace(self.state_dir / 'autosave.fable')
            elif kind == 'preferences' and not self.smoke_test:
                preferences = message.get('preferences', {})
                if not isinstance(preferences, dict) or len(json.dumps(preferences)) > 16000:
                    return
                self.state_dir.mkdir(parents=True, exist_ok=True)
                temporary = self.state_dir / 'preferences.tmp'
                temporary.write_text(json.dumps(preferences))
                temporary.replace(self.state_dir / 'preferences.json')
            elif kind == 'alpha-test-result' and self.smoke_test:
                report = self.pending_test_report
                report['checks'].extend(message.get('checks', []))
                report['passed'] = report['passed'] and message.get('passed', False)
                if message.get('error'):
                    report['error'] = message['error']
                self.finish_test_report(report)
            elif kind == 'save':
                self.save_file(message)
            elif kind == 'open':
                self.open_file()
        except (ValueError, KeyError, OSError) as error:
            self.notify('Could not save: ' + str(error))

    def evaluate(self, script, callback=None):
        self.webview.evaluate_javascript(script, -1, None, None, None, callback, None)

    def notify(self, message):
        self.evaluate('window.Fable?.notify(' + json.dumps(message) + ')')

    def save_file(self, message):
        name = Path(str(message.get('name', 'Untitled map.fable'))).name
        if not name.endswith(('.fable', '.png')):
            return
        chooser = Gtk.FileChooserDialog(title='Save ' + name, parent=self.window,
                                        action=Gtk.FileChooserAction.SAVE)
        chooser.add_buttons('Cancel', Gtk.ResponseType.CANCEL, 'Save', Gtk.ResponseType.ACCEPT)
        chooser.set_current_name(name)
        chooser.set_do_overwrite_confirmation(True)
        if chooser.run() == Gtk.ResponseType.ACCEPT:
            target = Path(chooser.get_filename())
            if message.get('encoding') == 'base64':
                target.write_bytes(base64.b64decode(message['content'], validate=True))
            else:
                target.write_text(message['content'])
            self.notify('Saved ' + target.name)
        chooser.destroy()

    def open_file(self):
        chooser = Gtk.FileChooserDialog(title='Open Fable project', parent=self.window,
                                        action=Gtk.FileChooserAction.OPEN)
        chooser.add_buttons('Cancel', Gtk.ResponseType.CANCEL, 'Open', Gtk.ResponseType.ACCEPT)
        project_filter = Gtk.FileFilter()
        project_filter.set_name('Fable project (.fable, .json)')
        project_filter.add_pattern('*.fable')
        project_filter.add_pattern('*.json')
        chooser.add_filter(project_filter)
        if chooser.run() == Gtk.ResponseType.ACCEPT:
            path = Path(chooser.get_filename())
            if path.stat().st_size > MAX_PROJECT:
                self.notify('Project file is too large (30 MB maximum).')
            else:
                self.evaluate('window.Fable.importProject(' + json.dumps(path.read_text()) + ')')
        chooser.destroy()

    def on_crash(self, _view, reason):
        print('Web process terminated:', reason, file=sys.stderr)
        self.exit_status = 1
        self.quit()

    def on_load(self, _view, event):
        if event == WebKit2.LoadEvent.FINISHED and self.smoke_test:
            GLib.timeout_add(1200, self.run_smoke_test)

    def test_timeout(self):
        if not getattr(self, 'test_finished', False):
            print('FAIL: native smoke test timed out', file=sys.stderr)
            self.exit_status = 1
            self.quit()
        return False

    def run_smoke_test(self):
        test_file = ROOT / 'tests/native-interactions.js'
        script = test_file.read_text() if test_file.exists() else 'JSON.stringify({ready:!!window.Fable})'
        self.evaluate(script, self.on_test_result)
        return False

    def on_test_result(self, view, result, _data):
        try:
            value = view.evaluate_javascript_finish(result)
            report = json.loads(value.to_string())
            alpha_test = ROOT / 'tests/alpha-import.js'
            if report.get('passed') and alpha_test.exists():
                self.pending_test_report = report
                self.evaluate(alpha_test.read_text())
                return
            self.finish_test_report(report)
        except Exception as error:
            self.finish_test_report({'passed': False, 'error': str(error), 'checks': []})

    def finish_test_report(self, report):
        try:
            exported_png = report.pop('exportedPNG', None)
            if exported_png and self.screenshot_path:
                export_path = self.screenshot_path.parent / 'sample-map.png'
                export_path.write_bytes(base64.b64decode(exported_png))
                print('Map export:', export_path)
            if self.screenshot_path:
                self.screenshot_path.with_suffix('.checks.json').write_text(json.dumps(report, indent=2))
            print(json.dumps(report, indent=2))
            if not report.get('passed'):
                self.exit_status = 1
        except Exception as error:
            print('FAIL:', error, file=sys.stderr)
            self.exit_status = 1
        self.test_finished = True
        if self.screenshot_path:
            GLib.timeout_add(700, self.capture_snapshot)
        else:
            self.quit()

    def capture_snapshot(self):
        self.webview.get_snapshot(WebKit2.SnapshotRegion.VISIBLE, WebKit2.SnapshotOptions.NONE, None, self.on_snapshot, None)
        return False

    def on_snapshot(self, view, result, _data):
        try:
            surface = view.get_snapshot_finish(result)
            surface.write_to_png(str(self.screenshot_path))
            print('Screenshot:', self.screenshot_path)
        except Exception as error:
            print('Screenshot failed:', error, file=sys.stderr)
            self.exit_status = 1
        self.quit()


def main():
    parser = argparse.ArgumentParser(description='Fable map studio')
    parser.add_argument('--smoke-test', action='store_true', help='Run native editor integration checks and quit')
    parser.add_argument('--screenshot', type=Path, help='Write a PNG of the editor after smoke testing')
    parser.add_argument('--capture-theme', choices=['light','dark'])
    parser.add_argument('--capture-scene', choices=['dungeon','outdoor','states','fog'])
    parser.add_argument('--capture-tool', choices=['wall','floor','room','terrain','atmosphere','light','erase'])
    args = parser.parse_args()
    app = Fable(args.smoke_test, args.screenshot, {'theme': args.capture_theme, 'scene': args.capture_scene, 'tool': args.capture_tool})
    app.run([sys.argv[0]])
    return app.exit_status


if __name__ == '__main__':
    sys.exit(main())
