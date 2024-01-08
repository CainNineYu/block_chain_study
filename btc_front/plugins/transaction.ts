import { Address, Tx, Signer, Tap } from "@cmdcode/tapscript";

export interface UtxoInfo {
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  txid: string;
  vout: number;
  value: number;
}
export const estimateTxSize = (inputs: number, outputs: number) => {
  return inputs * 148 + outputs * 34 + 10 + inputs;
};
export const selectUtxos = (
  utxos: UtxoInfo[],
  amount: number,
  feeRate: number,
) => {
  let sum = 0;
  const selected: UtxoInfo[] = [];
  for (const utxo of utxos) {
    const spendAmount =
      amount + estimateTxSize(selected.length + 1, 2) * feeRate;
    selected.push(utxo);
    sum += utxo.value;
    if (sum >= spendAmount) {
      break;
    }
  }
  if (sum < amount + estimateTxSize(selected.length + 1, 2) * feeRate) {
    throw new Error("Insufficient balance");
  }

  return selected;
};

export const createTx = (
  utxos: UtxoInfo[],
  amount: number,
  feeRate: number,
  toAddress: string,
  changeAddress: string,
) => {
  const safeUtxos = utxos.filter((utxo) => utxo.value > 1000);
  const selected = selectUtxos(safeUtxos, amount, feeRate);
  console.log(selected);
  const inputs = selected.map((utxo) => ({
    txid: utxo.txid,
    vout: utxo.vout,
    value: utxo.value,
    address: changeAddress,
  }));
  const remainedValue = Math.floor(
    selected.reduce((sum, utxo) => sum + utxo.value, 0) -
      amount -
      estimateTxSize(selected.length, 2) * feeRate,
  );

  console.log(remainedValue);
  const txdata = Tx.create({
    vin: inputs.map((input) => ({
      txid: input.txid,
      vout: input.vout,
      prevout: {
        value: input.value,
        scriptPubKey: Address.toScriptPubKey(changeAddress),
      },
    })),
    vout: [
      {
        // We are locking up 99_000 sats (minus 1000 sats for fees.)
        value: amount,
        // We are locking up funds to this address.
        scriptPubKey: Address.toScriptPubKey(toAddress),
      },
      {
        value:
          selected.reduce((sum, utxo) => sum + utxo.value, 0) -
          amount -
          estimateTxSize(selected.length, 2) * feeRate,
        scriptPubKey: Address.toScriptPubKey(changeAddress),
      },
    ],
  });
  // const [tseckey] = Tap.getSecKey(priv);

  // for (let i = 0; i < inputs.length; i++) {
  //   console.log("signing input", i);
  //   const sig = Signer.taproot.sign(tseckey, txdata, i);
  //   txdata.vin[i].witness = [sig];
  // }

  // const txhex = Tx.encode(txdata).hex;
  // console.log(txhex);

  return txdata;
};
