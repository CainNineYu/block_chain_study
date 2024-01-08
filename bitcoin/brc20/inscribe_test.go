package brc20

import (
	"encoding/json"
	"log"
	"testing"

	"github.com/btcsuite/btcd/chaincfg"
)

func TestInscribe(t *testing.T) {
	network := &chaincfg.TestNet3Params

	commitTxPrevOutputList := make([]*PrevOutput, 0)
	commitTxPrevOutputList = append(commitTxPrevOutputList, &PrevOutput{
		TxId:       "3a0f3587b299b200af61b3b1465d37e70d9bd9cb18429fb0a445d2a7140355da",
		VOut:       0,
		Amount:     546,
		Address:    "tb1p5gjmksejyp69ujdecuu8gsydkw4zzr2mu5s8wvrsc3tan4mdhdqqtm9430",
		PrivateKey: "cTBhYKv1HJQHAJ8yo5Rx4Dxw5o5PExqazrkZJZBy8iEvuJBFM8MQ", //WIF key
	})
	commitTxPrevOutputList = append(commitTxPrevOutputList, &PrevOutput{
		TxId:       "6f3361e871a4bf7d7da05eb095478a0ac41af1d8285ff8d65880af81a1fcfc78",
		VOut:       2,
		Amount:     6794,
		Address:    "tb1p5gjmksejyp69ujdecuu8gsydkw4zzr2mu5s8wvrsc3tan4mdhdqqtm9430",
		PrivateKey: "cTBhYKv1HJQHAJ8yo5Rx4Dxw5o5PExqazrkZJZBy8iEvuJBFM8MQ",
	})
	inscriptionDataList := make([]InscriptionData, 0)
	inscriptionDataList = append(inscriptionDataList, InscriptionData{
		ContentType: "text/plain;charset=utf-8",
		//Body:        []byte(`{"p":"brc-20","op":"deploy","tick":"adwa","max":"21000000","lim":"1000"}`),
		Body:       []byte(`{"p":"brc-20","op":"transfer","tick":"adwa","amt":"700"}`),
		RevealAddr: "tb1p5gjmksejyp69ujdecuu8gsydkw4zzr2mu5s8wvrsc3tan4mdhdqqtm9430",
	})
	inscriptionDataList = append(inscriptionDataList, InscriptionData{
		ContentType: "text/plain;charset=utf-8",
		//Body:        []byte(`{"p":"brc-20","op":"deploy","tick":"adwa","max":"21000000","lim":"1000"}`),
		Body:       []byte(`{"p":"brc-20","op":"transfer","tick":"adwa","amt":"100"}`),
		RevealAddr: "tb1pkzx9f08rag2q5u8u56r0xajmf49lsgx357s007t354xqk9pwnaaqectt7h",
	})
	request := &InscriptionRequest{
		CommitTxPrevOutputList: commitTxPrevOutputList,
		CommitFeeRate:          2,
		RevealFeeRate:          2,
		RevealOutValue:         546,
		InscriptionDataList:    inscriptionDataList,
		//ChangeAddress:          "2N32Bcj9s62zVZVasmiXndDRv1x7nuDDdrE",
		ChangeAddress: "tb1p5gjmksejyp69ujdecuu8gsydkw4zzr2mu5s8wvrsc3tan4mdhdqqtm9430",
	}

	requestBytes, _ := json.Marshal(request)
	log.Println(string(requestBytes))

	txs, _ := Inscribe(network, request)

	txsBytes, _ := json.Marshal(txs)
	t.Log(string(txsBytes))
}
