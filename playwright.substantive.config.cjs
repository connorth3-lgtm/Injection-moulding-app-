// Full Chromium substantive QA excludes the immutable visual lock by filename, not test title.
// The visual lock has its own job and its own required baseline server.
module.exports={...require('./playwright.config.cjs'),testIgnore:/visual-regression\.spec\.js/};

