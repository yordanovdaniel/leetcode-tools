(async function leetcodeCleaner() {
  // Check if extension is enabled
  const { enabled } = await chrome.storage.local.get({ enabled: true });
  if (!enabled) return;

  let lastCleanedProblem = '';

  const RESET_BUTTON_SELECTOR =
    '#editor > div.flex.h-8.items-center.justify-between.border-b.py-1.pl-\\[10px\\].pr-\\[10px\\].lc-md\\:pl-1.lc-md\\:pr-1.border-border-quaternary.dark\\:border-border-quaternary > div.flex.h-full.items-center.gap-1 > button:nth-child(3)';

  // Fallback: find reset button by its aria-label or tooltip
  function findResetButton() {
    let btn = document.querySelector(RESET_BUTTON_SELECTOR);
    if (btn) return btn;

    const editorHeader = document.querySelector('#editor');
    if (!editorHeader) return null;

    const buttons = editorHeader.querySelectorAll('button');
    for (const b of buttons) {
      const label = (b.getAttribute('aria-label') || b.textContent || '').toLowerCase();
      if (label.includes('reset') || label.includes('restore')) return b;
      
      const tooltip = b.getAttribute('data-tooltip') || b.getAttribute('title') || '';
      if (tooltip.toLowerCase().includes('reset') || tooltip.toLowerCase().includes('restore')) return b;
    }
    return null;
  }

  function waitForElement(finder, timeout = 5000) {
    return new Promise((resolve) => {
      const el = finder();
      if (el) return resolve(el);

      let timeoutId;
      const observer = new MutationObserver(() => {
        const el = finder();
        if (el) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });

      timeoutId = setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  async function tryReset() {
    const url = window.location.href;
    if (!url.includes('leetcode.com/problems/')) return;
    
    // Avoid running continuously on the same problem
    const match = url.match(/\/problems\/([^/]+)/);
    if (!match) return;
    const currentProblem = match[1];
    
    if (lastCleanedProblem === currentProblem) return;

    // Check if editor actually exists right now
    const resetBtn = findResetButton();
    if (!resetBtn) return; // Editor/button not loaded quite yet

    // Found editor and button for a new problem! Let's lock it.
    lastCleanedProblem = currentProblem;
    console.log(`[LeetCode Cleaner] Editor detected for new problem: ${currentProblem}`);

    // Small delay to let React finish hydrating the editor
    await new Promise(r => setTimeout(r, 300));

    console.log('[LeetCode Cleaner] Clicking reset button...');
    
    // We fetch the button again just in case DOM shifted
    const currentResetBtn = findResetButton();
    if (currentResetBtn) {
      currentResetBtn.click();
    }

    // Wait for the Confirm dialog to appear
    await new Promise(r => setTimeout(r, 500));

    const confirmBtn = await waitForElement(() => {
      const allButtons = document.querySelectorAll('button');
      for (const b of allButtons) {
        const text = b.textContent.trim().toLowerCase();
        if (text === 'confirm' || text === 'reset' || text === 'yes') {
          // Look for modals overlaying the screen
          const parent = b.closest('[role="dialog"], [class*="modal"], [class*="overlay"]');
          if (parent) return b;
        }
      }
      return null;
    }, 5000);

    if (confirmBtn) {
      console.log('[LeetCode Cleaner] Clicking Confirm button...');
      confirmBtn.click();
      console.log('[LeetCode Cleaner] ✅ Code has been reset!');

      // Now start the stopwatch natively
      await new Promise(r => setTimeout(r, 600)); // wait for confirm modal to close
      
      try {
        console.log('[LeetCode Cleaner] Opening timer menu...');
        const timerMenuBtn = document.querySelector("#__next > div.flex.min-w-\\[360px\\].flex-col.text-label-1.dark\\:text-dark-label-1.overflow-x-auto.bg-sd-background-gray.h-\\[100vh\\] > div > div > div.relative > nav > div.relative.flex.flex-1.items-center.justify-end > div.relative.flex.items-center.justify-end.gap-2 > div.flex.flex-none > div.h-8.rounded-sd.bg-fill-tertiary.rounded-r-none > div > div:nth-child(1) > div > div.flex.h-full.cursor-pointer.rounded-sd-sm.p-1.hover\\:bg-sd-accent > div");
        
        if (timerMenuBtn) {
          timerMenuBtn.click();
          
          await new Promise(r => setTimeout(r, 400)); // wait for dropdown
          console.log('[LeetCode Cleaner] Clicking timer action...');
          
          // Radix UI generates random IDs like radix-:r2: or radix-_r_f_, so we fuzzy match the beginning
          let actionBtn = document.querySelector('[id^="radix-"] > div > div.relative.h-8.w-full > div > button');
          
          if (actionBtn) {
            actionBtn.click();
            
            // Wait for React to process the first click
            await new Promise(r => setTimeout(r, 300));
            
            // React might have destroyed and recreated the button after the 1st click,
            // so we must query the document again to get the fresh element!
            actionBtn = document.querySelector('[id^="radix-"] > div > div.relative.h-8.w-full > div > button');
            if (actionBtn) {
              actionBtn.click(); // User requested 2 clicks (one to reset, one to start)
              console.log('[LeetCode Cleaner] ✅ Timer started!');
            }
          }
        }
      } catch (err) {
        console.warn('[LeetCode Cleaner] Could not start timer:', err);
      }

    } else {
      console.log('[LeetCode Cleaner] Could not find the confirm button. Maybe there was no code to reset.');
    }
  }

  // LeetCode is a Single Page App (SPA). 
  setInterval(tryReset, 200);
})();
