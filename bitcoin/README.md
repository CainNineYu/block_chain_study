# BTC

## Ordinals Inscription
Step：
1.Prepare ordinals inscription content and available UTXOs.
2.Building commit_tx and reveal_tx transactions.
3.Finding uninscribed outpoint as satpoint.
4.Build the reveal script and write the contents of the inscription into it, which will use the secp256k1 key pair that you created yourself.
5.Building the taproot spend script and generating tweaked key,then add the reveal script to the leaf of the script.
6.Calculate the cost of the reveal transaction.
7.Building commit transaction.
8.Building reveal transactions with commit transactions.
9.Perform volume checks on reveal transactions.
10.Compute the signature hash.
11.Push the signature hash into the witness data.
12.Sign the commit_tx with your wallet and send the commit_tx and reveal_tx to the Bitcoin network.

## Ref.
1.https://medium.com/@quentangle/%E6%BA%90%E7%A0%81%E8%AE%B2%E8%A7%A3-ordinals-inscription%E9%93%B8%E9%80%A0%E8%BF%87%E7%A8%8B%E8%A7%A3%E6%9E%90-2bc37bb7f67b

2.https://github.com/okx/BRC20-goSDK

3.https://github.com/okx/go-wallet-sdk/


