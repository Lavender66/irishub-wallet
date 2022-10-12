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
	// baseTx: {
	// 	mode: iris.types.BroadcastMode.Sync,
	// 	password: "1234567890",
	// },
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
export const client = BaseClient.getClient();
export const sdk = iris

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

// let address =  client.keys.recover('test','1234567890','machine style fan middle olympic affair scene update history lunar cinnamon fat escape slab alley ozone dad cool goose room kite banner unveil consider')
// const address = client.keys.recover(
// 	"1",
// 	"test",
// 	"kidney fitness that debris wedding reject casino coconut know alien avoid sock coast magnet bonus machine mimic rice method box property attitude runway enjoy",
// 	"sm2"
// );
// console.log(address, "地址信息");
/*********   query chain   **********/
// 查询地址的account_number and sequence
// export async function queryAuthAccount(address:string) {
// 	return await client.auth.queryAccount(address);
// }

// 查询iris链上的主token
// export async function queryMainToken() {
// 	const [tokens, params] = await Promise.all([
// 		client.token.queryTokens(),
// 		client.staking.queryParams(),
// 	]);
// 	if (tokens && params) {
// 		const mainToken = (tokens || []).filter(
// 			(token:any) => token.minUnit === params.params.bondDenom
// 		);
// 		return mainToken[0];
// 	}
// 	return {};
// }

// 查询链上所有的token以及详细信息
// export async function queryAllTokens() {
// 	return await client.token.queryTokens();
// }

// // 查询地址某个denom的余额
// export async function queryBankBalance(address: string, denom) {
// 	return await client.bank.queryBalance(address, denom);
// }

// // 查询地址所有的余额
// export async function queryBankAllBalances(address) {
// 	return await client.bank.queryAllBalances(address);
// }
