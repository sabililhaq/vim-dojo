export const vimDojoMarkup = `
<section class="vim-dojo" data-vim-dojo>
  <div class="challenge-shell" data-state="loading">
    <div class="challenge-meta">
      <span data-challenge-count>Challenge 01</span>
      <span data-category></span>
    </div>
    <h2 data-title>Loading Vim Dojo</h2>
    <p data-description>Preparing the editor.</p>

    <div class="editor-wrap">
      <div data-editor></div>
    </div>

    <p class="error" data-error hidden>Unable to initialize the Vim editor. Please refresh the page or try another browser.</p>

    <div class="feedback" data-feedback hidden>
      <strong data-result-title>Completed</strong>
      <p data-result-message></p>
      <p class="attempt-stats">
        <span data-method></span>
        <span data-keystrokes></span>
        <span data-time></span>
      </p>
    </div>

    <div class="hint" data-hint hidden></div>

    <div class="auto-continue" data-auto-continue hidden>
      <span class="auto-continue-track" aria-hidden="true">
        <span class="auto-continue-fill"></span>
      </span>
      <span data-auto-continue-label></span>
    </div>

    <div class="actions">
      <button type="button" data-hint-button>Hint</button>
      <button type="button" data-retry-button>Retry</button>
      <button type="button" data-next-button>Next</button>
      <button type="button" class="secondary" data-reset-button title="Reset session — go to first challenge">Reset</button>
    </div>

    <div class="progress">
      <span data-progress>01 / 08</span>
      <span data-mode>Normal</span>
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
