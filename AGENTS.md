<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep automotive domain calculations and synthetic data in pure modules under `src/domain`, with a shared browser-safe provider so every demonstration screen uses one source of truth.
  Why: the demo must stay internally consistent and replaceable by a future real-data provider.
- Keep conversational history as browser-local, URL-addressable threads; model calls remain outside this account-free MVP.
  Why: the selected demonstration experience needs reload-safe private threads without requiring backend setup.
