import type { NextApiRequest, NextApiResponse } from "next";
import { redis } from "@/lib/upstash";
import { pool } from "@/lib/pg";

const fn = async (_req: NextApiRequest, res: NextApiResponse) => {
  let cursor = 0;
  let key;
  try {
    let dbsize = await redis.dbsize();
    console.log('dbsize is ', dbsize);
    while (true) {
      const [c, keys] = await redis.scan(cursor);
      if (c == 0) {
        break;
      }
      cursor = c;
      console.log('cursor ', cursor);

      for (key of keys) {
        if (key.endsWith(':trigger')) {
          const reg = /^github:([^:\/]+)\/([^:\/]+):.*$/;
          let m = key.match(reg);
          if (m && m.length === 3) {
            const owner = m[1];
            const repo = m[2];

            const data = await redis.hgetall(key);
            for (let flowId in data) {
              const v = data[flowId] as {flows_user: string, events: string[]};
              await pool.query(`
                INSERT INTO listener (flows_user, flow_id, github_owner, github_repo, handler_fn, events)
                VALUES ($1, $2, $3, $4, $5, $6)
              `, [v['flows_user'], flowId, owner, repo, null, v['events']]);
            }
          } else {
            console.log('----------------');
            console.log('Invalid key: ', key)
          }
        } else if (key.endsWith(':access_token')) {
          const reg = /^github:([^:]+):.*$/;
          let m = key.match(reg);
          if (m && m.length === 2) {
            const flowsUser = m[1];
            const data = await redis.hgetall(key);
            for (let login in data) {
              await pool.query(`
                INSERT INTO login_oauthor (flows_user, github_login, github_access_token)
                VALUES ($1, $2, $3)
              `, [flowsUser, login, data[login]]);
            }
          } else {
            console.log('----------------');
            console.log('Invalid key: ', key)
          }
        } else if (!key.endsWith(':listen')) {
          console.log(key);
        }
      }
    }
  } catch (e) {
    console.log('====================');
    console.error(e);
    console.log('Error occured: ', key);
  }
  res.end();
}

export default fn;
