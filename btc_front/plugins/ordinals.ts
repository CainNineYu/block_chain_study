import {
  initEccLib,
  networks,
  payments,
  opcodes,
  script,
  Psbt,
  Transaction,
} from "bitcoinjs-lib";
import { witnessStackToScriptWitness } from "bitcoinjs-lib/src/psbt/psbtutils";

import ECPairFactory from "ecpair";

// import assert from "minimalistic-assert";
import ecc from "@bitcoinerlab/secp256k1";
initEccLib(ecc);

const encoder = new TextEncoder();
const network = networks.bitcoin;
interface Inscription {
  contentType: Buffer;
  content: Buffer;
}
export interface CommitTxResult {
  txId: string;
  sendUtxoIndex: number;
  sendAmount: number;
  txHex: string;
}
export const ECPair = ECPairFactory(ecc);

const createInscriptionScript = ({
                                   xOnlyPublicKey,
                                   inscription,
                                 }: {
  xOnlyPublicKey: Buffer;
  inscription: Inscription;
}) => {
  assert(xOnlyPublicKey instanceof Buffer, `xOnlyPublicKey must be a Buffer`);
  assert(inscription, `inscription is required`);
  assert(
      inscription.content instanceof Buffer,
      `inscription.content must be a Buffer`,
  );
  assert(
      inscription.contentType instanceof Buffer,
      `inscription.content must be a Buffer`,
  );
  const protocolId = Buffer.from(encoder.encode("ord"));
  console.log(xOnlyPublicKey, "xOnlyPublicKey");
  return [
    xOnlyPublicKey,
    opcodes.OP_CHECKSIG,
    opcodes.OP_0,
    opcodes.OP_IF,
    protocolId,
    1,
    1,
    // 1, // ISSUE, Buffer.from([1]) is replaced to 05 rather asMinimalOP than 0101 here https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/script.js#L53
    // this may not be an issue but it generates a different script address. Unsure if ordinals indexer detect 05 as the content type separator
    inscription.contentType,
    opcodes.OP_0,
    inscription.content,
    opcodes.OP_ENDIF,
  ];
};

export const toXOnly = (pubkey: Buffer) => {
  return pubkey.subarray(1, 33);
};

export function createTextInscription(
    tick: string,
    amt: number,
    op: "mint" | "deploy" | "transfer" = "mint",
): Inscription {
  const contentType = Buffer.from(encoder.encode("text/plain;charset=utf-8"));
  const content = Buffer.from(
      encoder.encode(
          `{"p":"brc-20","op":${op},"tick":"${tick}","amt":"${Math.floor(amt)}"}`,
      ),
  );
  return { contentType, content };
}

export const createCommitTxData = ({
                                     publicKey,
                                     inscription,
                                   }: {
  publicKey: Buffer;
  inscription: Inscription;
}) => {
  assert(publicKey, "encodePublic is required");
  assert(inscription, "inscription is required");
  const xOnlyPublicKey = toXOnly(publicKey);
  const inscriptionScript = createInscriptionScript({
    xOnlyPublicKey,
    inscription,
  });

  const outputScript = script.compile(inscriptionScript);

  const scriptTree = {
    output: outputScript,
    redeemVersion: 192,
  };
  console.log(payments);
  const scriptTaproot = payments.p2tr({
    internalPubkey: xOnlyPublicKey,
    scriptTree,
    redeem: scriptTree,
    network,
  });

  const tapleaf = scriptTaproot.hash?.toString("hex");
  const revealAddress = scriptTaproot.address;
  const tpubkey = scriptTaproot.pubkey?.toString("hex");
  const cblock =
      scriptTaproot.witness?.[scriptTaproot.witness.length - 1].toString("hex");

  return {
    script: inscriptionScript,
    tapleaf,
    tpubkey,
    cblock,
    revealAddress,
    scriptTaproot,
    outputScript,
  };
};
export const createRevealTx = async ({
                                       commitTxData,
                                       commitTxResults,
                                       toAddress,
                                       amount,
                                       publicKey,
                                     }: {
  commitTxData: ReturnType<typeof createCommitTxData>;
  commitTxResults: CommitTxResult[];
  toAddress: string;
  amount: number;
  publicKey: Buffer;
}) => {
  assert(commitTxData, `commitTxData is required`);
  assert(commitTxResults, `commitTxResult is required`);
  assert(toAddress, `toAddress is required`);
  assert(typeof amount === "number", `amount must be a number`);
  const { cblock, scriptTaproot, outputScript } = commitTxData;
  const tapLeafScript = {
    leafVersion: scriptTaproot.redeemVersion!,
    script: outputScript,
    controlBlock: Buffer.from(cblock || "", "hex"),
  };
  const mintScript = payments.p2tr({
    pubkey: toXOnly(publicKey),
    leafVersion: 0,
    controlBlocks: [
      script.compile([
        opcodes.OP_RETURN,
        Buffer.from("ordinal", "utf8"),
        Buffer.from("42", "utf8"),
      ]),
    ],
  });
  const psbt = new Psbt({ network });
  console.log(scriptTaproot.output);
  for (const commitTxResult of commitTxResults) {
    psbt.addInput({
      hash: commitTxResult.txId,
      index: commitTxResult.sendUtxoIndex,
      witnessUtxo: {
        value: commitTxResult.sendAmount,
        script: scriptTaproot.output!,
      },
      tapLeafScript: [tapLeafScript],
    });
  }
  psbt.addOutput({
    value: amount,
    address: toAddress,
  });
  return psbt.toHex();
  // const psbtBase64 = psbt.toHex(); // 导出 Psbt 数据为 Base64 字符串
  // return psbtBase64;
  // console.log(psbtBase64); // 打印 Psbt 数据，以便在 Unisat 钱包中使用

  // We have to construct our witness script in a custom finalizer
  // const customFinalizer = (_inputIndex: number, input: any) => {
  //   console.log(input);
  //   const witness: Buffer[] = [outputScript, tapLeafScript.controlBlock];

  //   return {
  //     finalScriptWitness: witnessStackToScriptWitness(witness),
  //   };
  // };
  // psbt.finalizeInput(0, customFinalizer);
  // const tx = psbt.extractTransaction();
  // const psbtHex = psbt.toHex();
  // console.log(psbtHex, "psbtHex");
  // const rawTx = tx.toBuffer().toString("hex");
  // const txId = tx.getId();

  // const virtualSize = tx.virtualSize();

  // return {
  //   txId,
  //   rawTx,
  //   inscriptionId: `${txId}i0`,
  //   virtualSize,
  //   psbtHex,
  //   psbt,
  // };
};
