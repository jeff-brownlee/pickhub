### Working with staging and main

This guide explains how to do day-to-day work on `staging`, promote changes to `main`, and then get back to `staging` cleanly.

#### Prerequisites
- You have the repo cloned and remotes configured for GitHub (`origin`).
- Local `main` and `staging` branches track the corresponding remote branches.

#### 1) Start or switch to staging
If `staging` exists already (recommended):
```bash
git checkout staging
git pull --rebase
```

If you need to create `staging` from the latest `main`:
```bash
git checkout main
git pull --rebase
git checkout -b staging
git push -u origin staging
```

#### 2) Do work on staging
Make your edits and commit logically grouped changes:
```bash
# after editing files
git add -A
git commit -m "feat: <short description>"
git push
```

To keep `staging` current with `main` while you work:
```bash
git fetch origin
git rebase origin/main
# resolve conflicts if any, then continue
git push --force-with-lease
```

#### 3) Promote staging to main (preferred: Pull Request)
Use a PR on GitHub for review/CI and a clean history:
1. Push `staging` (if not already):
   ```bash
   git push
   ```
2. Open a PR from `staging` -> `main` on GitHub.
3. Merge the PR (squash or merge commit per preference).

Alternative (CLI merge, when PR isn’t desired):
```bash
git checkout main
git pull --rebase
git merge --no-ff staging -m "Merge staging"
git push
```

Optional: tag a release after merging to `main`:
```bash
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

#### 4) Get back to staging after promotion
Update `staging` so it includes the latest `main` state:
```bash
git checkout staging
git fetch origin
git rebase origin/main
# or: git merge origin/main
git push --force-with-lease
```

This keeps `staging` ahead of `main` with only new work.

#### Common operations cheat sheet
```bash
# Switch branches
git checkout staging
git checkout main

# Update current branch with remote
git pull --rebase

# Rebase staging onto main
git fetch origin
git rebase origin/main

# Merge staging into main (CLI)
git checkout main && git pull --rebase && git merge --no-ff staging && git push

# Create tracking branch
git push -u origin staging
```

#### Troubleshooting
- Remote rejected push (non-fast-forward):
  ```bash
  git pull --rebase
  # resolve conflicts
  git push
  ```
- Rebase conflicts: fix files, then
  ```bash
  git add -A
  git rebase --continue
  ```
- Abort a rebase if needed:
  ```bash
  git rebase --abort
  ```

Notes:
- Prefer PRs for visibility, review, and CI checks before promoting to `main`.
- Keep commits focused; avoid committing generated artifacts unless required by the build.


