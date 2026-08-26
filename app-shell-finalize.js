/* MouldMaster app-shell finalizer — 2026.08.26.2 */
(function(){
'use strict';
if(!window.MM_APP_SHELL)throw new Error('app-shell-finalize.js requires app-shell-registry.js');
if(!window.MM_LEARNING_EXPERIENCE)throw new Error('app-shell-finalize.js requires learning-experience.js');
if(!window.MM_CURRICULUM_INTEGRATION)throw new Error('app-shell-finalize.js requires curriculum-integration.js');
if(!window.MM_SPECIALIST_CURRICULUM)throw new Error('app-shell-finalize.js requires specialist-curriculum.js');
if(!window.MM_MOULD_MASTER_WORKSPACE)throw new Error('app-shell-finalize.js requires mould-master-workspace.js');
window.MM_APP_SHELL.finalize();
window.MM_APP_SHELL_FINALIZED='2026.08.26.2';
})();
