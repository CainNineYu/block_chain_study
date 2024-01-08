"use client";

import { CarveContext } from "@/app/Context";
import useGetAccounts from "@/hooks/unisat/useGetAccounts";
import UnisatInstance from "@/hooks/unisat/useUnisatInstance";
import { envNetwork } from "@/plugins/config";
import { forwardRef, useContext, useEffect, useImperativeHandle } from "react";
export interface Wallet {
  requestAccounts: () => Promise<string[] | undefined>;
}
const ConnectWallet = forwardRef<Wallet>((_, ref) => {
  const unisat = UnisatInstance();
  const { setWallet } = useContext(CarveContext);
  const { accounts, setAccounts } = useGetAccounts();
  const requestAccounts = async () => {
    if (accounts.length) {
      console.log("already connected");
      return accounts;
    }
    try {
      const getAccounts = await unisat?.requestAccounts();
      const unisatNetwork = await unisat?.getNetwork();
      if (envNetwork !== unisatNetwork) {
        try {
          await unisat?.switchNetwork("testnet");
        } catch (error) {
          console.log(error);
        }
      }
      if (getAccounts) {
        setAccounts(getAccounts);
      }
      return getAccounts;
    } catch (error) {
      console.log(error);
      return [];
    }
  };
  useImperativeHandle(
    ref,
    () => ({
      requestAccounts,
    }),
    [accounts, unisat],
  );
  useEffect(() => {
    setWallet({
      requestAccounts,
    });
  }, [accounts, unisat]);
  return (
    <button className="btn w-[131px] h-9 min-h-9 relative border-w border-2 border-[#3C6AFF] text-block rounded-none whitespace-nowrap bg-transparent hover:border-[#3C6AFF] hover:bg-transparent">
      {unisat ? (
        <div
          className="absolute top-0 z-10 flex items-center justify-center w-full h-full"
          onClick={() => requestAccounts()}
        >
          {accounts.length
            ? accounts[0].slice(0, 6) + "..." + accounts[0].slice(-4)
            : "Connect wallet"}
        </div>
      ) : (
        <a href="https://hk.unisat.io/">Install Unisat Wallet</a>
      )}
      <div className="block absolute w-full h-full border-[#30FFEC] border-2 top-1 left-1 border-t-0 border-l-0 " />
      <div className="block absolute w-full h-full border-[#FF5A00] border-4 top-2 left-2 border-t-0 border-l-0 " />
    </button>
  );
});
ConnectWallet.displayName = "ConnectWallet";
export default ConnectWallet;
