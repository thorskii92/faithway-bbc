// Publishes everything saved in the /admin editor (and any local changes) to the live site.
// Usage: npm run publish-site
// Steps: get the editor's latest saves from GitHub → rebuild events/verses/videos and the site → commit → push.
import { execSync } from 'node:child_process';

const STEPS = {
  'git pull --rebase --autostash': 'Downloading the latest editor saves from GitHub failed. Check your internet connection, then try again.',
  'npm run -s events': 'Building the events, verses and videos failed. The message above names the file with the problem.',
  'npm run -s build': 'Building the website failed. The message above shows what went wrong.',
  'git add docs': 'Preparing the files failed.',
  'git commit -q -m "Publish editor changes"': 'Saving the changes failed.',
  'git push': 'Uploading to GitHub failed. Make sure you are signed in (run: gh auth login), then try again.',
};

function run(cmd) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch {
    // VS Code's background git fetch can clash with ours ("cannot lock ref"): wait a moment and retry once
    if (cmd.startsWith('git pull') || cmd === 'git push') {
      try {
        console.log('  (GitHub was busy, retrying...)');
        execSync('node -e "setTimeout(()=>{},3000)"');
        execSync('git fetch', { stdio: 'inherit' });
        execSync(cmd, { stdio: 'inherit' });
        return;
      } catch { /* fall through to the error message */ }
    }
    console.error(`\n✖ ${STEPS[cmd] || 'This step failed.'}\n  Nothing was published. Copy the messages above and send them to Claude if you need help.`);
    process.exit(1);
  }
}
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

run('git pull --rebase --autostash');
run('npm run -s events');
run('npm run -s build');
run('git add docs');
if (!out('git diff --cached --name-only')) {
  console.log('\n✔ Nothing new to publish. The website is already up to date.');
} else {
  run('git commit -q -m "Publish editor changes"');
  run('git push');
  console.log('\n✔ Published. The website updates in about 1–2 minutes: https://thorskii92.github.io/faithway-bbc/');
}
