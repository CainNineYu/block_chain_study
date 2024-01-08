import UnisatInstalled from "@/hooks/unisat/useUnisatInstance";
import { envNetwork } from "@/plugins/config";
import { useEffect, useState } from "react";
import useNetwork from "./useNetWork";

const useGetAccounts = () => {
  const unisat = UnisatInstalled();
  const unisatNetwork = useNetwork();
  const [accounts, setAccounts] = useState<string[]>([]);
  const getAccounts = async () => {
    if (unisat) {
      if (envNetwork === unisatNetwork) {
        const result = await unisat.getAccounts();
        setAccounts(result);
      } else {
        setAccounts([]);
      }
    }
  };
  const handlerAccounts = (accounts_result: Array<string>) => {
    setAccounts(accounts_result);
  };
  useEffect(() => {
    getAccounts();
    unisat?.on("accountsChanged", handlerAccounts);
    return () => {
      unisat?.removeListener("accountsChanged", handlerAccounts);
    };
  }, [unisat, unisatNetwork]);
  return { accounts, setAccounts };
};
export default useGetAccounts;
