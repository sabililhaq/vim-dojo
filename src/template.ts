export const vimDojoMarkup = `
<section class="vim-dojo" data-vim-dojo>
  <div class="challenge-shell" data-state="loading">
    <div class="challenge-meta">
      <span class="challenge-id">
        <span data-challenge-count>Challenge 01</span>
        <span data-passed hidden>done</span>
      </span>
      <span data-category></span>
    </div>
    <h2 data-title>Loading Vim Dojo</h2>
    <p data-description>Preparing the editor.</p>

    <div class="editor-wrap">
      <div data-editor></div>
    </div>

    <p class="error" data-error hidden>Unable to initialize the Vim editor. Please refresh the page or try another browser.</p>

    <div class="controls">
      <div class="actions">
        <button type="button" data-hint-button>Hint</button>
        <button type="button" data-retry-button>Retry</button>
        <button type="button" class="secondary" data-previous-button>Previous</button>
        <button type="button" data-next-button>Next</button>
        <button type="button" class="secondary" data-shuffle-button hidden>Shuffle</button>
      </div>

      <div class="toast" data-toast hidden role="status" aria-live="polite">
        <p data-result-message></p>
        <p class="attempt-stats">
          <span data-method></span>
          <span data-keystrokes></span>
          <span data-time></span>
        </p>
        <div class="auto-continue" data-auto-continue hidden>
          <span class="auto-continue-track" aria-hidden="true">
            <span class="auto-continue-fill"></span>
          </span>
          <span data-auto-continue-label></span>
        </div>
      </div>
    </div>

    <div class="hint" data-hint hidden></div>

    <div class="progress">
      <span data-progress>01 / 08</span>
      <span data-mode>Normal</span>
    </div>

    <div class="playlist">
      <nav class="playlist-row" data-modes aria-label="Practice mode"></nav>
      <p class="playlist-prompt">Want a specific category?</p>
      <nav class="playlist-row" data-categories aria-label="Challenge category"></nav>
    </div>
  </div>

  <div class="intro">
    <h1>Vim Dojo</h1>
    <p class="tagline">Practice Vim. Don't learn Vim.</p>
    <p>
      This is not a beginner Vim tutorial. You should already know Normal mode,
      Insert mode, motions, operators, and common commands.
    </p>
    <p class="beginner-link">
      New to Vim?
      <a href="https://www.vim-hero.com/lessons/basic-movement" target="_blank" rel="noopener noreferrer">
        VimHero Basic Movement
      </a>
    </p>
  </div>
</section>
`.trim();
