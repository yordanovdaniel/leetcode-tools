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

      // Now start the stopwatch natively.
      // The timer widget requires two clicks: first to reset the timer to 00:00,
      // then to start it. Between clicks, React may re-render the button, so we
      // re-query the DOM after each click.
      await new Promise(r => setTimeout(r, 600)); // wait for confirm modal to close
      
      try {
        console.log('[LeetCode Cleaner] Opening timer menu...');

        // Primary selector for timer menu button
        const TIMER_MENU_SELECTOR = "#__next > div.flex.min-w-\\[360px\\].flex-col.text-label-1.dark\\:text-dark-label-1.overflow-x-auto.bg-sd-background-gray.h-\\[100vh\\] > div > div > div.relative > nav > div.relative.flex.flex-1.items-center.justify-end > div.relative.flex.items-center.justify-end.gap-2 > div.flex.flex-none > div.h-8.rounded-sd.bg-fill-tertiary.rounded-r-none > div > div:nth-child(1) > div > div.flex.h-full.cursor-pointer.rounded-sd-sm.p-1.hover\\:bg-sd-accent > div";

        // Try primary selector, then fall back to scanning for timer-like buttons
        let timerMenuBtn = document.querySelector(TIMER_MENU_SELECTOR);
        if (!timerMenuBtn) {
          // Fallback: look for clickable elements near a timer display (digits like "00:00")
          const allEls = document.querySelectorAll('[class*="timer"], [class*="stopwatch"], [aria-label*="timer" i], [aria-label*="stopwatch" i]');
          for (const el of allEls) {
            const clickable = el.closest('button, [role="button"], [class*="cursor-pointer"]') || el.querySelector('button, [role="button"], [class*="cursor-pointer"]');
            if (clickable) { timerMenuBtn = clickable; break; }
          }
        }
        
        if (timerMenuBtn) {
          timerMenuBtn.click();
          
          await new Promise(r => setTimeout(r, 400)); // wait for dropdown
          console.log('[LeetCode Cleaner] Clicking timer action...');
          
          // Primary selector for timer action button (Radix UI generates random IDs)
          let actionBtn = document.querySelector('[id^="radix-"] > div > div.relative.h-8.w-full > div > button');
          
          // Fallback: look for a button with start/reset text in any open dropdown/popover
          if (!actionBtn) {
            const dropdowns = document.querySelectorAll('[id^="radix-"], [role="menu"], [role="listbox"], [class*="popover"], [class*="dropdown"]');
            for (const dd of dropdowns) {
              const buttons = dd.querySelectorAll('button');
              for (const b of buttons) {
                const text = (b.textContent || '').toLowerCase();
                if (text.includes('start') || text.includes('reset') || text.includes('restart')) {
                  actionBtn = b;
                  break;
                }
              }
              if (actionBtn) break;
            }
          }

          if (actionBtn) {
            actionBtn.click();
            
            // Wait for React to process the first click
            await new Promise(r => setTimeout(r, 300));
            
            // React may have destroyed and recreated the button after the 1st click,
            // so we must query the document again to get the fresh element!
            actionBtn = document.querySelector('[id^="radix-"] > div > div.relative.h-8.w-full > div > button');
            if (!actionBtn) {
              // Repeat fallback scan
              const dropdowns = document.querySelectorAll('[id^="radix-"], [role="menu"], [role="listbox"], [class*="popover"], [class*="dropdown"]');
              for (const dd of dropdowns) {
                const buttons = dd.querySelectorAll('button');
                for (const b of buttons) {
                  const text = (b.textContent || '').toLowerCase();
                  if (text.includes('start') || text.includes('reset') || text.includes('restart')) {
                    actionBtn = b;
                    break;
                  }
                }
                if (actionBtn) break;
              }
            }
            if (actionBtn) {
              actionBtn.click();
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
