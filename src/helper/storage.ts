

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

export function getValue(value: any): any {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(value, items => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      }
      if(Object.keys(items).length==0) {
        resolve(null);
      } else {
        resolve(items[value])
      }
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
