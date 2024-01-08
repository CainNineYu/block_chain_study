import { Wallet } from "@/components/unisat/ConnectWallet";
import { Dispatch, SetStateAction, createContext } from "react";
export const CarveContext = createContext<{
  wallet: Wallet | null;
  setWallet: Dispatch<SetStateAction<Wallet | null>>;
}>({
  wallet: null,
  setWallet: () => {},
});
