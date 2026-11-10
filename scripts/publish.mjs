// Publishes everything saved in the /admin editor (and any local changes) to the live site.
// Usage: npm run publish-site
// Steps: get the editor's latest saves from GitHub → rebuild events/verses/videos and the site → commit → push.
import { execSync } from 'node:child_process';

const run = (cmd) => { console.log(`\n> ${cmd}`); execSync(cmd, { stdio: 'inherit' }); };
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

run('git pull --rebase');
run('npm run -s events');
run('npm run -s build');
run('git add docs');
if (!out('git diff --cached --name-only')) {
  console.log('\nNothing new to publish — the website is already up to date.');
} else {
  run('git commit -q -m "Publish editor changes"');
  run('git push');
  console.log('\nPublished. The website updates in about 1–2 minutes: https://thorskii92.github.io/faithway-bbc/');
}
