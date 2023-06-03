
import axios from 'axios';
import { configVars } from './config.js';

export const transactions = {
  createTable: async (token) => {
    await axios({
      method: 'post',
      url: configVars.ddl,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'biscuit': `${configVars.biscuit}`,
        'Content-Type': 'application/json'
      },
      data: {
        "sqlText": `CREATE TABLE ${SCHEMA_PAYMENTS} (
      ID  VARCHAR  PRIMARY KEY,
      USER_ID    VARCHAR,
      STORE_ID    VARCHAR,
      AMOUNT    INT,
      CATEGORY  VARCHAR
  ) WITH \"public_key=${PUBLIC_BISCUIT},access_type=public_write\"`
      }
    })
      .then(res => {
        console.log("exito")
      })
      .catch(err => {
        console.log(err.response.status)
        console.log(err.response.data)
      })
  },
  insert: async (token, data) => {
    const res = await axios({
      method: 'post',
      url: configVars.dml,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'biscuit': `${configVars.biscuit}`,
        'Content-Type': 'application/json'
      },
      data: {
        "resourceId": `${configVars.schemaPayments}`,
        "sqlText": `INSERT INTO ${configVars.schemaPayments} VALUES ('${data.id}', '${data.userId}','${data.storeId}',${data.amount},'${data.category}')`
      }
    })
    return res.data
  },
  getAll: async (token) => {
    const res = await axios({
      method: 'post',
      url: configVars.dql,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'biscuit': `${configVars.biscuit}`,
        'Content-Type': 'application/json'
      },
      data: {
        "resourceId": `${configVars.schemaPayments}`,
        "sqlText": `SELECT * FROM ${configVars.schemaPayments}`
      }
    })
    return res.data
  },
  delete: async (token, id) => {
    const res = await axios({
      method: 'post',
      url: configVars.dml,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'biscuit': `${configVars.biscuit}`,
        'Content-Type': 'application/json'
      },
      data: {
        "resourceId": `${configVars.schemaPayments}`,
        "sqlText": `DELETE FROM ${configVars.schemaPayments} WHERE ID='${id}'`
      }
    })
    return res.data
  }
}
