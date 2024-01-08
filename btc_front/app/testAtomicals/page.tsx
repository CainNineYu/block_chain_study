"use client";
import ConnectWallet from "@/components/unisat/ConnectWallet";
import useGetAccounts from "@/hooks/unisat/useGetAccounts";
import UnisatInstance from "@/hooks/unisat/useUnisatInstance";
import { networks, Psbt, initEccLib } from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import axios from "axios";
import { UtxoInfo } from "@/plugins/transaction";
initEccLib(ecc);







export default function Home() {
    const unisat = UnisatInstance();
    const { accounts } = useGetAccounts();
    const sendBitcoin = async () => {
        const txid = await unisat?.sendBitcoin(
            "tb1qcv64c72yfrks5lu0wzcu4rtj43g3zdne296u45",
            100,
        );
        console.log(txid);
    };
    const createAndSignTransaction = async () => {
        const network = networks.testnet; // 使用测试网络
        const publicKey = await unisat?.getPublicKey();
        const psbt = new Psbt({ network });
        const utxos: UtxoInfo[] = await axios.get(
            `https://mempool.space/testnet/api/address/${accounts[0]}/utxo`,
        );
        const toAddress = "tb1qcv64c72yfrks5lu0wzcu4rtj43g3zdne296u45"; // 接收者地址
        const amountToSend = 1000; // 发送的金额
        const fee = 1; // 矿工费
        const txHex: string = await axios.get(
            `https://mempool.space/testnet/api/tx/${utxos[1].txid}/hex`,
        );
        psbt.addInput({
            hash: utxos[1].txid,
            index: utxos[1].vout,
            // nonWitnessUtxo: Buffer.from(txHex, "hex"),
            // redeemScript: Buffer.from(publicKey || "", "hex"),
        });
        psbt.addOutput({
            address: toAddress,
            value: amountToSend,
        });
        const changeAddress = accounts[0]; // 找零地址
        psbt.addOutput({
            address: changeAddress,
            value: utxos[1].value - amountToSend - fee,
        });
        // const sign = await unisat?.signPsbt(psbt.toHex(), {
        //     autoFinalized: false,
        // });
        const sign = await unisat?.signPsbt(psbt.toHex());


        if (sign) {
            psbt.finalizeAllInputs();
            const txid = unisat?.pushPsbt(sign);
            console.log(txid);
        }
    };
    const getUtxo = async () => {
        const res = await fetch(
            `https://mempool.space/testnet/api/address/${accounts[0]}/utxo`,
        );
        console.log(await res.json());
    };
    const getRate = async () => {
        const res = await fetch("https://mempool.space/api/v1/fees/recommended");
        console.log("getRate: ",await res.json());
    };

    const createTapRoot = async () => {
        const publicKey = await unisat?.getPublicKey();
        const psbt = new Psbt({ network: networks.testnet });
        const utxos = await axios(
          `https://mempool.space/testnet/api/address/${accounts[0]}/utxo`,
        ).then((res) => res.data);
        const scriptPk = address
          .toOutputScript(accounts[0], networks.testnet)
          .toString("hex");
        psbt.addInput({
          hash: utxos[0].txid,
          index: utxos[0].vout,
          witnessUtxo: {
            value: utxos[0].value,
            script: Buffer.from(scriptPk, "hex"),
          },
        });
        psbt.addOutput({
          address: "tb1p735a86jnkfkqktj6kw0pzqnrs6cltekgsaj3fxaxxhg9krma2y6s85j3th",
          value: 9500,
        });
    
        const toSignInputs = psbt.txInputs.map((v, index) => ({
          index,
          publicKey: publicKey,
        }));
        // const sign = await unisat?.signPsbt(psbt.toHex(), {
        //   autoFinalized: true,
        //   toSignInputs,
        // });
        const sign = await unisat?.signPsbt(psbt.toHex());
        console.log(sign, "sign");
        if (sign) {
          await unisat?.pushPsbt(sign);
        }
      };
    

  return(
      <div className="connect-wallet gap-3 flex flex-col">
          <ConnectWallet />
          <button className="btn block" onClick={() => sendBitcoin()}>
              sendBitcoin
          </button>
          <button className="btn block" onClick={() => getRate()}>
              获取费率
          </button>
          <button className="btn block" onClick={() => getUtxo()}>
              获取utxo list
          </button>
          <button className="btn block" onClick={() => createAndSignTransaction()}>
              构建交易
          </button>
      </div>
      )
}
