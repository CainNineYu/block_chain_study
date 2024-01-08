import { useEffect, useState } from "react";
import UnisatInstalled, { NetWork } from "@/hooks/unisat/useUnisatInstance";

const useNetwork = () => {
  const unisat = UnisatInstalled();
  const [network, setNetwork] = useState<NetWork | undefined>();
  const getNetwork = async () => {
    const res = await unisat?.getNetwork();
    setNetwork(res);
  };
  const handlerNetWork = (net: NetWork) => {
    setNetwork(net);
  };
  useEffect(() => {
    getNetwork();
    unisat?.on("networkChanged", handlerNetWork);
    return () => {
      unisat?.removeListener("networkChanged", handlerNetWork);
    };
  }, [unisat]);
  return network;
};
export default useNetwork;
