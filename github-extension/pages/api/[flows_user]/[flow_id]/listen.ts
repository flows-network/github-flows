import type { NextApiRequest, NextApiResponse } from "next"
import { redis } from "@/lib/upstash";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    const { flows_user, flow_id, address } = req.query;

    if (!flows_user || !flow_id || !address) {
        return res.status(400).send("Bad request");
    }

    if (typeof flow_id == "string") {
        let flows_user_in = await redis.hget(`${address}:ch:trigger`, flow_id);
        if (!flows_user_in) {
            await redis.hset(`${address}:ch:trigger`, { [flow_id]: flows_user });
        }
    }

    return res.status(200).json({
        "status": "pending",
        "monitorId": "ec2_ue1_c_prod_bn_monitor_eth_goerli_1",
        "monitorVersion": "0.117.1",
        "pendingTimeStamp": "2023-01-19T05:04:38.782Z",
        "pendingBlockNumber": 8336598,
        "hash": "0xe39c510d76e5811d526355ef7a85bbb3ba79f0c735a048d61f9bba8b8c59f1cd",
        "from": "0x1291351b8Aa33FdC64Ac77C8302Db523d5B43AeF",
        "to": "0xC8a8f0C656D21bd619FB06904626255af19663ff",
        "value": "0",
        "gas": 21000,
        "nonce": 40,
        "blockHash": null,
        "blockNumber": null,
        "v": "0x1",
        "r": "0x39fcab9a97034327f643c9ab684c5cf961a4432faa135f427cfd48ed5aadfa7",
        "s": "0x4c7908431a4059d46b6bbb31d4c4fd2713b399181d6677314bd26381a6b1dd7d",
        "input": "0x",
        "type": 2,
        "maxFeePerGas": "1500000017",
        "maxFeePerGasGwei": 1.5,
        "maxPriorityFeePerGas": "1500000000",
        "maxPriorityFeePerGasGwei": 1.5,
        "transactionIndex": null,
        "asset": "ETH",
        "watchedAddress": "0xC8a8f0C656D21bd619FB06904626255af19663ff",
        "direction": "incoming",
        "counterparty": "0x1291351b8Aa33FdC64Ac77C8302Db523d5B43AeF",
        "serverVersion": "0.158.1",
        "eventCode": "txPool",
        "timeStamp": "2023-01-19T05:04:38.782Z",
        "dispatchTimestamp": "2023-01-19T05:04:38.825Z",
        "system": "ethereum",
        "network": "goerli"
    });
}
