from pathlib import Path

root=Path('.')
qms_path=root/'quality-management.js'
lib_path=root/'source-library.js'
idx_path=root/'index.html'
sw_path=root/'service-worker.js'
qa_path=root/'qa_iso9001_qms.py'

qms=qms_path.read_text(encoding='utf-8')
lib=lib_path.read_text(encoding='utf-8')
marker='/* MouldMaster ISO 9001 QMS support — 2026.09.15.2 */'
if marker not in lib:
    if marker not in qms:
        raise SystemExit('QMS runtime marker missing')
    lib=lib.rstrip()+'\n\n'+qms.strip()+'\n'
lib_path.write_text(lib,encoding='utf-8')

idx=idx_path.read_text(encoding='utf-8')
entry="      ['./quality-management.js','<script src=\"./quality-management.js\">'],\n"
if entry not in idx:
    raise SystemExit('quality-management bootstrap entry missing')
idx_path.write_text(idx.replace(entry,'',1),encoding='utf-8')

sw=sw_path.read_text(encoding='utf-8')
asset="  './quality-management.js',\n"
if asset not in sw:
    raise SystemExit('quality-management offline asset missing')
sw_path.write_text(sw.replace(asset,'',1),encoding='utf-8')

qa=qa_path.read_text(encoding='utf-8')
qa=qa.replace("RUNTIME_JS = ROOT / \"quality-management.js\"\n", "RUNTIME_JS = ROOT / \"source-library.js\"\n",1)
qa=qa.replace("need(\"localStorage\" not in runtime and \"indexedDB\" not in runtime, \"QMS support must remain read-only and must not create a shadow controlled-record store\")\n", "qms_runtime = runtime[runtime.index('/* MouldMaster ISO 9001 QMS support — 2026.09.15.2 */'):]\nneed(\"localStorage\" not in qms_runtime and \"indexedDB\" not in qms_runtime, \"QMS support must remain read-only and must not create a shadow controlled-record store\")\n",1)
qa=qa.replace("need(\"fetch(DATA_URL\" in runtime, \"QMS runtime must load governed data contract\")\n", "need(\"fetch(DATA_URL\" in qms_runtime, \"QMS runtime must load governed data contract\")\n",1)
qa=qa.replace("need(\"['./quality-management.js','<script src=\\\"./quality-management.js\\\">']\" in index, \"QMS runtime not loaded by shell\")\n", "need(\"['./quality-management.js','<script src=\\\"./quality-management.js\\\">']\" not in index, \"QMS support must not add a new bootstrap script\")\nneed(\"['./source-library.js','<script src=\\\"./source-library.js\\\">']\" in index, \"governed source-library runtime missing from shell\")\n",1)
qa=qa.replace("for asset in [\n    \"'./quality-management.js'\",\n    \"'./src/domains/quality/data/quality-management-iso9001-v1.json'\",\n]:\n", "for asset in [\n    \"'./source-library.js'\",\n    \"'./src/domains/quality/data/quality-management-iso9001-v1.json'\",\n]:\n",1)
qa_path.write_text(qa,encoding='utf-8')

qms_path.unlink()
