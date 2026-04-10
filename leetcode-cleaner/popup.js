const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

// Load saved state
chrome.storage.local.get({ enabled: true }, ({ enabled }) => {
  toggle.checked = enabled;
  updateStatus(enabled);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ enabled });
  updateStatus(enabled);
});

function updateStatus(enabled) {
  status.innerHTML = enabled
    ? 'Status: <span class="on">Active</span>'
    : 'Status: <span class="off">Paused</span>';
}
