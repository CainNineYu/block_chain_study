import { useEffect, useState } from "react";
import UnisatInstalled from "@/hooks/unisat/useUnisatInstance";
import useGetAccounts from "./useGetAccounts";

const useBalance = () => {
  const unisat = UnisatInstalled();
  const { accounts } = useGetAccounts();
  const [banlans, setBalance] = useState<
    | {
        confirmed: number;
        unconfirmed: number;
        total: number;
      }
    | undefined
  >(undefined);
  const getBalance = async () => {
    const res = await unisat?.getBalance();
    setBalance(res);
  };
  useEffect(() => {
    getBalance();
  }, [unisat, accounts]);
  return banlans;
};
export default useBalance;
