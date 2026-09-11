#!/usr/bin/env python3
from tools.html_script_parser import inline_script_bodies, script_blocks

sample = '<script>const a=1;</script><script src="./x.js"></script><script>const b="&amp;";</script>'
assert inline_script_bodies(sample) == ['const a=1;', 'const b="&amp;";']
assert len(script_blocks(sample)) == 3
assert inline_script_bodies('<script>ok</script   >') == ['ok']
malformed = '<script>unsafe'
try:
    inline_script_bodies(malformed)
except ValueError:
    pass
else:
    raise AssertionError('malformed script end tag must fail closed')
print('HTML script parser QA passed')
