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

// 查询链上所有的token以及详细信息
// export async function queryAllTokens() {
// 	return await client.token.queryTokens();
// }

// // 查询地址某个denom的余额
export async function queryBankBalance(address: string, denom: string) {
	return await client.bank.queryBalance(address, denom);
}

// // 查询地址所有的余额
// export async function queryBankAllBalances(address: string) {
// 	return await client.bank.queryAllBalances(address);
// }


/*********   tx  **********/
export async function sendTxOnline(to: string, amount1: string) {
	// console.log('=====types', types.Wallet, client)
	const baseTx = {
		from: 'name',
		password: 'p',
		mode: 2,
		account_number: 2,
		sequence: 40,
		chainId: client.config.chainId
	}
	const amount: types.Coin[] = [
		{
			denom: 'unyan',
			amount: amount1,
		},
	];
	const msgs: any[] = [
		{
			type: types.TxType.MsgSend,
			value: {
				from_address: 'iaa1g2tq9kacgj2tljrgku8mampz7c3l9xy6pxv6cc',
				to_address: to,
				amount
			}
		}
	];
	// watch wallet
	const unsignedStdTx = client.tx.buildTx(msgs, baseTx);
	const unsignedTxStr = Buffer.from(unsignedStdTx.getData()).toString('base64');
	// cold wallet
	const recover_unsigned_std_tx = client.tx.newStdTxFromTxData(unsignedTxStr);
	const recover_signed_std_tx = await client.tx.sign(recover_unsigned_std_tx, baseTx, true);
	const recover_signed_std_tx_str = Buffer.from(recover_signed_std_tx.getData()).toString('base64');
	// watch wallet
	const signed_std_tx = client.tx.newStdTxFromTxData(recover_signed_std_tx_str);
	return await client.tx.broadcast(signed_std_tx, baseTx.mode);
}

export const client = BaseClient.getClient();
export const sdk = iris
export const sdkType = types