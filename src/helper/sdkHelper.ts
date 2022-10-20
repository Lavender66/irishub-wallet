import types from "chrome-v3-irishub/dist/src/types"
import { CHAIN_CONFIG } from "@/constant";
import * as iris from "chrome-v3-irishub"
export const Consts = {
	timeout: 10000,
};

// 实现keyDao
class KeyDAO {
	keyMap: { [key: string]: types.Wallet } = {};
	// types 要单独导入
	write(name: string, key: types.Wallet) {
		this.keyMap[name] = key;
	}
	read(name: string): types.Wallet {
		return this.keyMap[name];
	}
	delete(name: string) {
		delete this.keyMap[name];
	}
}
const BaseClient = {
	getClient() {
		const config = {
			node: CHAIN_CONFIG.node,
			network: Number(CHAIN_CONFIG.network),
			chainId: CHAIN_CONFIG.chainId,
			gas: CHAIN_CONFIG.gas,
			fee: CHAIN_CONFIG.fee,
		};

		const client = iris
			.newClient(config)
			.withKeyDAO(new KeyDAO())
			.withRpcConfig({ timeout: Consts.timeout });
		return client;
	},
};

/*********   keys management   **********/
// 新增一个账户名字和密码
export const keyAddFunc = (name: string, password: string) => {
	const wallet = client.keys.add(name, password)
	const decryptMnemonic = client.config.keyDAO.decrypt(wallet.mnemonic, password)
	const walletInfo = {
		wallet,
		decryptMnemonic
	}
	return walletInfo
}

//得到助记词
export const keyMnemonicFunc = (mnemonic: string, password: string) => {
	return client.config.keyDAO.decrypt(mnemonic, password)
}

// 助记词加密
export const keyMnemonicEncrypt = (mnemonic: string, password: string) => {
	return client.config.keyDAO.encrypt(mnemonic, password)
}

// 恢复
export const keyRecoverFunc = (name: string, password: string, mnemonic: string) => {
	return client.keys.recover(name, password, mnemonic)
}

// 显示地址
export const keysAddressFunc = (name: string) => {
	return client.keys.show(name)
}


/*********   query chain   **********/
// 查询地址的account_number and sequence
// export async function queryAuthAccount(address:string) {
// 	return await client.auth.queryAccount(address);
// }

// 查询iris链上的主token, 可以查到单位
export async function queryMainToken() {
	const [tokens, params] = await Promise.all([
		client.token.queryTokens(),
		client.staking.queryParams(),
	]);
	if (tokens && params) {
		const mainToken = (tokens || []).filter(
			(token: any) => token.minUnit === params.params.bondDenom
		);
		return mainToken[0];
	}
	return {};
}


// 查询地址某个denom的余额
export async function queryBankBalance(address: string, denom: string) {
	return await client.bank.queryBalance(address, denom);
}

export const client = BaseClient.getClient();
