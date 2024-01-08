"use client";
import UnisatInstance from "@/hooks/unisat/useUnisatInstance";
import { Psbt, initEccLib, networks } from "bitcoinjs-lib";
import * as bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import { toXOnly } from "@/plugins/ordinals";
import useGetAccounts from "@/hooks/unisat/useGetAccounts";
initEccLib(ecc);

export enum AddressType {
  P2PKH,
  P2WPKH,
  P2TR,
  P2SH_P2WPKH,
  M44_P2WPKH, // deprecated
  M44_P2TR, // deprecated
  P2WSH,
  P2SH,
}
export interface UnspentOutput {
  txid: string;
  vout: number;
  satoshis: number;
  scriptPk: string;
  pubkey: string;
  addressType: AddressType;
  sighashType?: number;
}
export enum NetworkType {
  MAINNET,
  TESTNET,
  REGTEST,
}
export function toPsbtNetwork(networkType: NetworkType) {
  if (networkType === NetworkType.MAINNET) {
    return bitcoin.networks.bitcoin;
  } else if (networkType === NetworkType.TESTNET) {
    return bitcoin.networks.testnet;
  } else {
    return bitcoin.networks.regtest;
  }
}
export function getAddressType(
  address: string,
  networkType: NetworkType = NetworkType.MAINNET,
): AddressType {
  const network = toPsbtNetwork(networkType);
  let type: AddressType;

  try {
    const decoded = bitcoin.address.fromBase58Check(address);

    if (decoded.version === network.pubKeyHash) {
      type = AddressType.P2PKH;
    } else if (decoded.version === network.scriptHash) {
      type = AddressType.P2SH_P2WPKH; //P2SH
    } else {
      throw `unknown version number: ${decoded.version}`;
    }
  } catch (error) {
    try {
      // not a Base58 address, try Bech32
      const decodedBech32 = bitcoin.address.fromBech32(address);

      if (decodedBech32.version === 0 && decodedBech32.data.length === 20) {
        type = AddressType.P2WPKH;
      } else if (
        decodedBech32.version === 0 &&
        decodedBech32.data.length === 32
      ) {
        type = AddressType.P2WSH;
      } else if (
        decodedBech32.version === 1 &&
        decodedBech32.data.length === 32
      ) {
        type = AddressType.P2TR;
      } else {
        throw `unknown Bech32 address format`;
      }
    } catch (err) {
      throw "unsupport address type: " + address;
    }
  }
  return type;
}
interface TxInput {
  data: {
    hash: string;
    index: number;
    witnessUtxo: { value: number; script: Buffer };
    tapInternalKey?: Buffer;
  };
  utxo: UnspentOutput;
}

export function scriptPkToAddress(
  scriptPk: string | Buffer,
  networkType: NetworkType = NetworkType.MAINNET,
) {
  const network = toPsbtNetwork(networkType);
  try {
    const address = bitcoin.address.fromOutputScript(
      typeof scriptPk === "string" ? Buffer.from(scriptPk, "hex") : scriptPk,
      network,
    );
    return address;
  } catch (e) {
    return "";
  }
}

export function printPsbt(psbtData: string | bitcoin.Psbt) {
  let psbt: bitcoin.Psbt;
  if (typeof psbtData == "string") {
    psbt = bitcoin.Psbt.fromHex(psbtData);
  } else {
    psbt = psbtData;
  }
  let totalInput = 0;
  let totalOutput = 0;
  let str = "\nPSBT:\n";
  str += `Inputs:(${psbt.txInputs.length})\n`;
  psbt.txInputs.forEach((input, index) => {
    const inputData = psbt.data.inputs[index];
    str += `#${index} ${scriptPkToAddress(
      inputData.witnessUtxo?.script.toString("hex") || "",
    )} ${inputData.witnessUtxo?.value}\n`;
    str += `   ${Buffer.from(input.hash).reverse().toString("hex")} [${
      input.index
    }]\n`;
    totalInput += inputData.witnessUtxo?.value || 0;
  });

  str += `Outputs:(${psbt.txOutputs.length} )\n`;
  psbt.txOutputs.forEach((output, index) => {
    str += `#${index} ${output.address} ${output.value}\n`;
    totalOutput += output.value;
  });

  str += `Left: ${totalInput - totalOutput}\n`;
  try {
    const fee = psbt.getFee();
    const virtualSize = psbt.extractTransaction(true).virtualSize();
    const feeRate = fee / virtualSize;
    str += `Fee: ${fee}\n`;
    str += `FeeRate: ${feeRate}\n`;
    str += `VirtualSize: ${virtualSize}\n`;
  } catch (e) {
    // todo
  }

  str += "\n";
  console.log(str);
}

function utxoToInput(utxo: UnspentOutput): TxInput {
  if (
    utxo.addressType === AddressType.P2TR ||
    utxo.addressType === AddressType.M44_P2TR
  ) {
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex"),
      },
      sighashType: utxo.sighashType,
      tapInternalKey: toXOnly(Buffer.from(utxo.pubkey, "hex")),
    };
    return {
      data,
      utxo,
    };
  } else if (
    utxo.addressType === AddressType.P2WPKH ||
    utxo.addressType === AddressType.M44_P2WPKH
  ) {
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex"),
      },
      sighashType: utxo.sighashType,
    };
    return {
      data,
      utxo,
    };
  } else if (utxo.addressType === AddressType.P2PKH) {
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex"),
      },
      sighashType: utxo.sighashType,
    };
    return {
      data,
      utxo,
    };
  } else {
    const redeemData = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(utxo.pubkey, "hex"),
    });
    const data = {
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.satoshis,
        script: Buffer.from(utxo.scriptPk, "hex"),
      },
      redeemScript: redeemData.output,
      sighashType: utxo.sighashType,
    };
    return {
      data,
      utxo,
    };
  }
}
function addressToScriptPk(address: string, networkType: NetworkType) {
  const network = toPsbtNetwork(networkType);
  return bitcoin.address.toOutputScript(address, network);
}
const Test = () => {
  const unisat = UnisatInstance();
  const { accounts } = useGetAccounts();
  const sendBitcoin = async () => {
    const addressType = getAddressType(accounts[0]);
    const pubkey = await unisat?.getPublicKey();
    const psbt = new Psbt({ network: networks.testnet });
    const scriptPk = addressToScriptPk(
      accounts[0],
      NetworkType.TESTNET,
    ).toString("hex");
    const inputs = [];
    inputs.push(
      utxoToInput({
        txid: "fd5b68765575fa32753fd319db457023c7ce0f1211b88b4945ec509f08d5ea61",
        vout: 0,
        satoshis: 9000,
        scriptPk,
        pubkey: pubkey || "",
        addressType,
        sighashType:
          bitcoin.Transaction.SIGHASH_SINGLE |
          bitcoin.Transaction.SIGHASH_ANYONECANPAY,
      }),
    );
    inputs.forEach((v) => {
      if (v.utxo.addressType === AddressType.P2PKH) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;
      }
      psbt.data.addInput(v.data);
    });
    const outputs = [
      {
        address: accounts[0],
        value: 8500,
      },
    ];
    outputs.forEach((v) => {
      psbt.addOutput(v);
    });

    // TODO: 
    // psbt = " "
    const toSignInputs = psbt.txInputs.map((v, index) => ({
      index,
      publicKey: pubkey,
      address: accounts[0],
      sighashTypes: [
        bitcoin.Transaction.SIGHASH_SINGLE |
          bitcoin.Transaction.SIGHASH_ANYONECANPAY,
      ],
    }));
    const signedPsbtHex = await unisat?.signPsbt(psbt.toHex(), {
      autoFinalized: false,
      toSignInputs,
    });
    if (signedPsbtHex) {
      const signedPsbt = Psbt.fromHex(signedPsbtHex);
      for (let i = 0; i < signedPsbt.data.inputs.length; i++) {
        try {
          signedPsbt.finalizeInput(i);
        } catch (e) {
          console.error(e);
        }
      }
      console.log(signedPsbt.toHex());
    }
  };
  const sendBitcoin2 = async () => {
    const addressType = getAddressType(accounts[0]);
    const pubkey = await unisat?.getPublicKey();
    // TODO:       console.log(signedPsbt.toHex());  result 
    const hex =
      "70736274ff01005e020000000161ead5089f50ec45498bb811120fcec7237045db19d33f7532fa755576685bfd0000000000ffffffff013421000000000000225120b08c54bce3ea140a70fca686f3765b4d4bf820d1a7a0f7f971a54c0b142e9f7a000000000001012b2823000000000000225120b08c54bce3ea140a70fca686f3765b4d4bf820d1a7a0f7f971a54c0b142e9f7a010843014124e99107f5f45d6acb44624a1baf269f29df080c96c5bba483857a1d5b0cfe9d4783bc0612ffefa8e7219102d2af3bc5ca3d80518fe7a3fd085e892946f6b919830000";
    const psbt = Psbt.fromHex(hex, { network: networks.testnet });
    const psbt1 = new Psbt({ network: networks.testnet });
    printPsbt(hex);
    const scriptPk = addressToScriptPk(
      accounts[0],
      NetworkType.TESTNET,
    ).toString("hex");
    const inputs = [];

    inputs.push(
      utxoToInput({
        txid: "fd5b68765575fa32753fd319db457023c7ce0f1211b88b4945ec509f08d5ea61",
        vout: 1,
        satoshis: 9000,
        scriptPk,
        pubkey: pubkey || "",
        addressType,
        sighashType: bitcoin.Transaction.SIGHASH_ALL,
      }),
    );
    inputs.forEach((v) => {
      if (v.utxo.addressType === AddressType.P2PKH) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        psbt1.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;
      }
      psbt1.data.addInput(v.data);
    });
    psbt1.data.addInput(psbt.txInputs[0]);
    psbt1.data.inputs[1] = psbt.data.inputs[0];
    const outputs = [
      {
        address: accounts[0],
        value: 9000,
      },
    ];
    outputs.forEach((v) => {
      psbt1.addOutput(v);
    });
    psbt1.data.addOutput(psbt.txOutputs[0]);
    psbt1.data.outputs[1] = psbt.data.outputs[0];
    // TODO：构建pstb2
    // const psbt1 = Psbt.fromHex("===============", { network: networks.testnet });

    const toSignInputs = [];
    psbt1.data.inputs.forEach((v, index) => {
      const isNotSigned = !(v.finalScriptSig || v.finalScriptWitness);
      if (isNotSigned) {
        toSignInputs.push({
          index,
          publicKey: pubkey,
          address: accounts[0],
          sighashTypes: [bitcoin.Transaction.SIGHASH_ALL],
        });
      } else {
        console.log("已经签署");
      }
    });
    const signedPsbtHex = await unisat?.signPsbt(psbt1.toHex(), {
      autoFinalized: true,
      toSignInputs,
    });
    if (signedPsbtHex) {
      const signedPsbt = Psbt.fromHex(signedPsbtHex);
      console.log(signedPsbt);
      unisat?.pushPsbt(signedPsbt.toHex());
    }
  };
  return (
    <div className="connect-wallet gap-3 flex flex-col">
      <button className="btn block" onClick={() => sendBitcoin()}>
        sendBitcoin
      </button>
      <button className="btn block" onClick={() => sendBitcoin2()}>
        第二个人签名
      </button>
    </div>
  );
};
export default Test;
