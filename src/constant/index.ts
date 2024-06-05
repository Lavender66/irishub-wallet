// 配置成keplr中的同链信息
export const CHAIN_CONFIG = {
  chainId: 'nyancat-9',
  node: 'https://rpc.nyancat.rainbow.one',
  fee: {
    denom: 'unyan',
    amount: '800000'
  },
  gas: '400000',
  network: 0,
  explorer: 'https://nyancat.iobscan.io/#/',
  baseUnit: 6
}

// chrome storage valut
export const VAULT_STORAGE = {
  AES_COUNTER_CIPHER: 'vault/aesCounterCipher',
  AES_COUNTER_SALT: 'vault/aesCounterSalt',
  AES_PASSWORD_CIPHER: 'vault/passwordCipher',
  USER_PASSWORD_MAC: 'vault/userPasswordMac',
  USER_PASSWORD_SALT: 'vault/userPasswordSalt',
  VAULT_MAP: 'vault/vaultMap',
}

export const KEYRING_STORAGE = {
  SELECTED_VAULT_ID: 'keyring-v2/selectedVaultId'
}

