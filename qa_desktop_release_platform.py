from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent

def load(path):
    value=json.loads((ROOT/path).read_text(encoding="utf-8"))
    if not isinstance(value,dict): raise AssertionError(f"{path} must be an object")
    return value

state=load("data/desktop-release-platform-v1.json")
version=load("version.json")
assert state.get("schemaVersion")==1
assert state.get("release")==version.get("desktop_release")
assert state.get("tag")==version.get("desktop_release_tag")
assert state.get("status") in {"hold","validated"}
if state.get("githubImmutable") is not True:
    assert state.get("status")=="hold", "mutable GitHub release must remain HOLD"
    assert state.get("issue")=="#278"
    assert "new governed desktop release version" in state.get("exitCondition","")
else:
    assert state.get("status")=="validated", "platform-immutable release should be represented as validated"
print(f"Desktop release platform QA passed: {state['tag']} immutable={state['githubImmutable']} status={state['status']}.")
