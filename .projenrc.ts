import { TypescriptApplicationProject, WorkflowActionsX } from '@gplassard/projen-extensions';
import { GithubWorkflow } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';
import { TypeScriptJsxMode } from 'projen/lib/javascript';

const project = new TypescriptApplicationProject({
  name: 'rando-planner',
  deps: [
    'leaflet', 'protomaps-leaflet', 'react', 'react-dom', 'react-leaflet',
  ],
  devDeps: [
    '@types/leaflet',
    '@types/geojson',
    '@types/react',
    '@types/react-dom',
    '@vitejs/plugin-react',
    'sass',
    'vite',
  ],
  tsconfig: {
    compilerOptions: {
      lib: ['dom', 'es2019'],
      jsx: TypeScriptJsxMode.REACT_JSX,
    },
    include: [
      'src/**/*.tsx',
    ],
  },
  tsconfigDev: {
    compilerOptions: {
      module: 'nodenext',
    },
    include: [
      'vite.config.ts',
    ],
  },
  pnpmWorkspace: {
    allowBuilds: {
      '@parcel/watcher': false,
    },
  },
});
project.addScripts( {
  'dev': 'vite',
  'build': 'tsc && vite build',
  'serve': 'vite preview',
  'data': 'tsx scripts/data/pipeline.ts',
  'data:fetch': 'tsx scripts/data/fetch.ts',
  'data:prepare': 'tsx scripts/data/prepare.ts',
});
// Raw datasets are downloaded by the data pipeline, they are not committed.
project.gitignore.addPatterns('/data/raw/');
// database.json is a large pipeline output unused by the app, keep it out of git.
project.gitignore.addPatterns('/data/database.json');
// Branch that holds one directory per PR preview environment. Every preview
// publish, cleanup and prune deploys the full site (main site + all previews)
// directly to GitHub Pages, so previews are live immediately after the PR
// workflow runs, and multiple previews are served in parallel.
const PREVIEWS_BRANCH = 'previews';
// Previews that have not been updated for this long are removed by a daily prune job.
const PREVIEW_TTL_SECONDS = 7 * 24 * 60 * 60;

const gitPushUrl = 'https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git';
const gitIdentity = [
  'git config user.name "github-actions[bot]"',
  'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
].join('\n');

const deployWebsite = new GithubWorkflow(project.github!, 'deploy-website', {
  limitConcurrency: true,
  concurrencyOptions: {
    group: 'deploy-website',
    cancelInProgress: true,
  },
});
deployWebsite.on({
  push: {
    branches: ['main'],
  },
  workflowDispatch: {},
});
deployWebsite.addJob('deploy', {
  name: 'deploy',
  environment: {
    name: 'github-pages',
    url: '${{ steps.deployment.outputs.deployment_url }}',
  },
  runsOn: ['ubuntu-latest'],
  permissions: {
    contents: JobPermission.READ,
    packages: JobPermission.READ,
    pages: JobPermission.WRITE,
    idToken: JobPermission.WRITE,
  },
  steps: [
    WorkflowActionsX.checkout({}),
    WorkflowActionsX.setupPnpm({ install: false }),
    WorkflowActionsX.setupNode({}),
    WorkflowActionsX.installDependencies({}),
    {
      name: 'Build',
      run: 'pnpm run build',
    },
    {
      name: 'Include preview environments',
      env: {
        GH_TOKEN: '${{ github.token }}',
      },
      run: [
        `REPO_URL="${gitPushUrl}"`,
        `if git ls-remote --exit-code --heads "$REPO_URL" ${PREVIEWS_BRANCH} > /dev/null 2>&1; then`,
        `  git clone --depth 1 --single-branch --branch ${PREVIEWS_BRANCH} "$REPO_URL" "\${RUNNER_TEMP}/previews"`,
        '  mkdir -p dist/previews',
        '  rsync -a --exclude=.git "${RUNNER_TEMP}/previews/" dist/previews/',
        'else',
        "  echo 'No preview environments to include'",
        'fi',
      ].join('\n'),
    },
    {
      name: 'Setup pages',
      uses: 'actions/configure-pages@v5',
    },
    {
      name: 'Upload artifact',
      uses: 'actions/upload-pages-artifact@v3',
      with: {
        path: './dist',
      },
    },
    {
      name: 'Deploy to Github Pages',
      uses: 'actions/deploy-pages@v4',
    },
  ],
});
const updateData = new GithubWorkflow(project.github!, 'update-data', {
  limitConcurrency: true,
  concurrencyOptions: {
    group: 'update-data',
    cancelInProgress: true,
  },
});
updateData.on({
  schedule: [
    {
      cron: '0 4 * * 1',
    },
  ],
  workflowDispatch: {},
});
updateData.addJob('update-data', {
  name: 'update-data',
  runsOn: ['ubuntu-latest'],
  timeoutMinutes: 30,
  permissions: {
    contents: JobPermission.WRITE,
  },
  steps: [
    WorkflowActionsX.checkout({}),
    WorkflowActionsX.setupPnpm({ install: false }),
    WorkflowActionsX.setupNode({}),
    WorkflowActionsX.installDependencies({}),
    {
      name: 'Install tippecanoe (GeoJSON -> PMTiles)',
      run: 'sudo apt-get update && sudo apt-get install -y tippecanoe',
    },
    {
      name: 'Fetch and prepare data',
      run: 'pnpm run data',
    },
    {
      name: 'Commit and push data updates',
      run: [
        'git config user.name "github-actions[bot]"',
        'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
        'git add data',
        'if ! git diff --cached --quiet; then',
        '  git commit -m "chore(data): refresh prepared data"',
        '  git push',
        'else',
        '  echo "No data changes"',
        'fi',
      ].join('\n'),
    },
  ],
});
// Pushes the current content of preview-site/ to the previews branch, retrying
// when a concurrent publish has moved the branch in the meantime. `modify` runs
// inside the freshly cloned preview-site directory; `onNoChange` runs when the
// modification results in no staged change.
const publishPreviewsRun = (modify: string[], commitMessage: string, onNoChange: string[]) => [
  `REPO_URL="${gitPushUrl}"`,
  'PUSHED=false',
  'for attempt in 1 2 3 4 5; do',
  '  rm -rf preview-site',
  `  if git ls-remote --exit-code --heads "$REPO_URL" ${PREVIEWS_BRANCH} > /dev/null 2>&1; then`,
  `    git clone --depth 1 --single-branch --branch ${PREVIEWS_BRANCH} "$REPO_URL" preview-site`,
  '  else',
  '    mkdir -p preview-site',
  `    git -C preview-site init -b ${PREVIEWS_BRANCH}`,
  '    git -C preview-site remote add origin "$REPO_URL"',
  '  fi',
  ...modify.map(line => '  ' + line),
  ...gitIdentity.split('\n').map(cmd => `  git -C preview-site ${cmd.slice('git '.length)}`),
  '  git -C preview-site add -A',
  '  if git -C preview-site diff --cached --quiet; then',
  ...onNoChange,
  '  fi',
  `  git -C preview-site commit -m "${commitMessage}"`,
  '  if git -C preview-site push origin previews; then',
  '    PUSHED=true',
  '    break',
  '  fi',
  '  echo "Previews branch moved concurrently, retrying (attempt $attempt)"',
  '  sleep $((attempt * 10))',
  'done',
  'if [ "$PUSHED" != "true" ]; then',
  '  echo "Failed to publish previews branch" >&2',
  '  exit 1',
  'fi',
].join('\n');

// Deploy the full site (main site + all previews) to GitHub Pages.
const deployPagesSteps = [
  {
    name: 'Setup pages',
    uses: 'actions/configure-pages@v5',
  },
  {
    name: 'Upload artifact',
    uses: 'actions/upload-pages-artifact@v3',
    with: {
      path: './dist',
    },
  },
  {
    name: 'Deploy to Github Pages',
    uses: 'actions/deploy-pages@v4',
  },
];

const assemblePreviewsStep = {
  name: 'Assemble previews into site',
  run: [
    'mkdir -p dist/previews',
    'rsync -a --exclude=.git preview-site/ dist/previews/',
  ].join('\n'),
};

const checkoutMainStep = {
  name: 'Checkout main',
  run: 'git checkout --force origin/main',
};

const previewWebsite = new GithubWorkflow(project.github!, 'preview-website', {
  limitConcurrency: true,
  concurrencyOptions: {
    group: 'preview-${{ github.event.pull_request.number }}',
    cancelInProgress: true,
  },
});
previewWebsite.on({
  pullRequest: {
    types: ['opened', 'synchronize', 'reopened', 'closed'],
  },
  // Daily run of the prune job, which drops previews untouched for PREVIEW_TTL_SECONDS.
  schedule: [
    {
      cron: '0 3 * * *',
    },
  ],
});
previewWebsite.addJob('preview', {
  name: 'preview',
  if: 'github.event_name == \'pull_request\' && github.event.action != \'closed\' && github.event.pull_request.head.repo.full_name == github.repository',
  environment: {
    name: 'preview-pr-${{ github.event.pull_request.number }}',
    url: '${{ steps.publish.outputs.url }}',
  },
  runsOn: ['ubuntu-latest'],
  permissions: {
    contents: JobPermission.WRITE,
    packages: JobPermission.READ,
    pullRequests: JobPermission.WRITE,
    pages: JobPermission.WRITE,
    idToken: JobPermission.WRITE,
  },
  steps: [
    WorkflowActionsX.checkout({
      ref: '${{ github.event.pull_request.head.ref }}',
      repository: '${{ github.event.pull_request.head.repo.full_name }}',
    }),
    WorkflowActionsX.setupPnpm({ install: false }),
    WorkflowActionsX.setupNode({}),
    WorkflowActionsX.installDependencies({ noFrozenLockfile: true }),
    {
      name: 'Build preview',
      id: 'build_preview',
      env: {
        PR_NUMBER: '${{ github.event.pull_request.number }}',
      },
      run: [
        'pnpm exec tsc && pnpm exec vite build --base=/rando-planner/previews/pr-${PR_NUMBER}/ --outDir dist-preview',
        'echo "build_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$GITHUB_OUTPUT"',
      ].join('\n'),
    },
    {
      name: 'Publish preview',
      id: 'publish',
      env: {
        PR_NUMBER: '${{ github.event.pull_request.number }}',
        GH_TOKEN: '${{ github.token }}',
      },
      run: publishPreviewsRun([
        'rm -rf "preview-site/pr-${PR_NUMBER}"',
        'mkdir -p "preview-site/pr-${PR_NUMBER}"',
        'cp -r dist-preview/. "preview-site/pr-${PR_NUMBER}"',
        'date +%s > "preview-site/pr-${PR_NUMBER}/.preview-updated"',
        'echo "url=https://${GITHUB_REPOSITORY_OWNER}.github.io/${GITHUB_REPOSITORY#*/}/previews/pr-${PR_NUMBER}/" >> "$GITHUB_OUTPUT"',
      ], 'preview: pr-${PR_NUMBER}', [
        '    PUSHED=true',
        '    break',
      ]),
    },
    checkoutMainStep,
    {
      name: 'Install main dependencies',
      env: {
        NODE_AUTH_TOKEN: '${{ secrets.GITHUB_TOKEN }}',
      },
      run: 'pnpm i --no-frozen-lockfile',
    },
    {
      name: 'Build main site',
      run: 'pnpm run build',
    },
    assemblePreviewsStep,
    ...deployPagesSteps,
    {
      name: 'Comment preview url',
      env: {
        PR_NUMBER: '${{ github.event.pull_request.number }}',
        GH_TOKEN: '${{ github.token }}',
        PREVIEW_URL: '${{ steps.publish.outputs.url }}',
        COMMIT_SHA: '${{ github.event.pull_request.head.sha }}',
        BUILD_TIME: '${{ steps.build_preview.outputs.build_time }}',
      },
      // Always edit the existing marker-tagged comment instead of posting a new one.
      run: [
        "MARKER='<!-- preview-environment -->'",
        'BODY=$(cat <<EOF',
        'Preview environment for PR #${PR_NUMBER}: ${PREVIEW_URL}',
        '',
        '- Commit: [${COMMIT_SHA:0:7}](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/commit/${COMMIT_SHA})',
        '- Built at: ${BUILD_TIME} (UTC)',
        '',
        '${MARKER}',
        'EOF',
        ')',
        'COMMENT_ID=$(gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" --paginate --jq ".[] | select(.body | contains(\"${MARKER}\")) | .id" | head -n 1)',
        'if [ -n "$COMMENT_ID" ]; then',
        '  gh api -X PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${COMMENT_ID}" -f body="$BODY" > /dev/null',
        'else',
        '  gh api -X POST "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" -f body="$BODY" > /dev/null',
        'fi',
      ].join('\n'),
    },
  ],
});
previewWebsite.addJob('cleanup', {
  name: 'cleanup',
  if: 'github.event_name == \'pull_request\' && github.event.action == \'closed\' && github.event.pull_request.head.repo.full_name == github.repository',
  runsOn: ['ubuntu-latest'],
  permissions: {
    contents: JobPermission.WRITE,
    packages: JobPermission.READ,
    pages: JobPermission.WRITE,
    idToken: JobPermission.WRITE,
  },
  steps: [
    WorkflowActionsX.checkout({}),
    WorkflowActionsX.setupPnpm({ install: false }),
    WorkflowActionsX.setupNode({}),
    checkoutMainStep,
    WorkflowActionsX.installDependencies({}),
    {
      name: 'Remove preview',
      env: {
        PR_NUMBER: '${{ github.event.pull_request.number }}',
        GH_TOKEN: '${{ github.token }}',
      },
      run: publishPreviewsRun([
        'rm -rf "preview-site/pr-${PR_NUMBER}"',
      ], 'preview: remove pr-${PR_NUMBER}', [
        '    exit 0',
      ]),
    },
    {
      name: 'Build main site',
      run: 'pnpm run build',
    },
    assemblePreviewsStep,
    ...deployPagesSteps,
  ],
});
previewWebsite.addJob('prune', {
  name: 'prune',
  if: 'github.event_name == \'schedule\'',
  runsOn: ['ubuntu-latest'],
  permissions: {
    contents: JobPermission.WRITE,
    packages: JobPermission.READ,
    pages: JobPermission.WRITE,
    idToken: JobPermission.WRITE,
  },
  steps: [
    WorkflowActionsX.checkout({}),
    WorkflowActionsX.setupPnpm({ install: false }),
    WorkflowActionsX.setupNode({}),
    checkoutMainStep,
    WorkflowActionsX.installDependencies({}),
    {
      name: 'Prune expired previews',
      env: {
        GH_TOKEN: '${{ github.token }}',
      },
      run: publishPreviewsRun([
        'NOW=$(date +%s)',
        `EXPIRY=${PREVIEW_TTL_SECONDS}`,
        'for stamp in preview-site/pr-*/.preview-updated; do',
        '  [ -f "$stamp" ] || continue',
        '  UPDATED=$(cat "$stamp")',
        '  if [ $((NOW - UPDATED)) -ge $EXPIRY ]; then',
        '    echo "Pruning $(dirname "$stamp") (last updated $(date -u -d "@$UPDATED" +%Y-%m-%dT%H:%MZ))"',
        '    rm -rf "$(dirname "$stamp")"',
        '  fi',
        'done',
      ], 'preview: prune expired previews', [
        '    exit 0',
      ]),
    },
    {
      name: 'Build main site',
      run: 'pnpm run build',
    },
    assemblePreviewsStep,
    ...deployPagesSteps,
  ],
});
project.synth();
