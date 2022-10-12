export function saveValue(value: any) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(value, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve('success');
    });
  });
}

export function getValue(value: any) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(value, items => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve(items);
    });
  });
}

export function removeValue(value: any) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(value, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      resolve('');
    });
  });
}
