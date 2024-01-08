"use client";

import { useEffect, useState } from "react";
export type NetWork = "livenet" | "testnet";
type EventType = "accountsChanged" | "networkChanged";
type EventHandler = (...args: any[]) => void;

export interface UnisatType {
  on: (event: EventType, handler: EventHandler) => void;
  removeListener: (event: EventType, handler: EventHandler) => void;
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getNetwork: () => Promise<NetWork>;
  switchNetwork: (network: NetWork) => Promise<string>;
  getPublicKey: () => Promise<string>;
  getBalance: () => Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  /**
   * 往来账户的铭文
   * @returns
   */
  getInscriptions: (
    cursor?: number,
    size?: number,
  ) => Promise<{
    total: number; //总数
    list: {
      inscriptionId: string; //铭文的id
      inscriptionNumber: string; //铭文的编号
      address: string; //铭文地址
      outputValue: string; //铭文的输出
      content: string; //题词的内容网址
      contentLength: string; //铭文的内容长度
      contentType: number; //铭文的内容类型
      preview: number; //预览链接
      timestamp: number; //铭文的阻塞时间
      offset: number; //铭文的偏移量
      genesisTransaction: string; //创世交易txid
      location: string; //当前位置的txid和vout
    }[];
  }>;
  /**
   * 发送比特币
   * @param toAddress //接收地址
   * @param satoshis // 1 satoshi = 0.00000001 BTC
   * @param param2
   * @returns
   */
  sendBitcoin: (
    toAddress: string,
    satoshis: number,
    { feeRate }?: { feeRate?: number },
  ) => Promise<string>;
  /**
   * 发送铭文
   * @param address 接收方地址
   * @param inscriptionId 铭文的id
   * @param param2
   * @returns
   */
  sendInscription: (
    address: string,
    inscriptionId: string,
    { feeRate }?: { feeRate?: number },
  ) => Promise<{
    txid: string;
  }>;
  /**
   * 推送
   * @param param0
   * @returns txid
   */
  pushTx: (rawtx: string) => Promise<string>;
  signPsbt: (
    psbtHex: string,
    {
      autoFinalized,
      toSignInputs,
    }: {
      autoFinalized?: boolean; //签名后是否完成PSBT，默认true
      toSignInputs?: {
        index: number;
        address: string;
        publicKey: string;
      }[]; //需要签名的输入，默认全部
    },
  ) => Promise<string>;
  pushPsbt: (psbtHex: string) => Promise<string>;
}
const UnisatInstance = () => {
  const [unisat, setUnisat] = useState<UnisatType | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (typeof window.unisat !== "undefined") {
        setUnisat(window.unisat);
      } else {
        setUnisat(null);
      }
    }
  }, []);
  return unisat;
};
export default UnisatInstance;
