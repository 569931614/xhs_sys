
/**
 * 由 Fantastic-admin 提供技术支持
 * Powered by Fantastic-admin
 * https://fantastic-admin.github.io
 */

import{V as t}from"./index-CnisIzlN.js";const z={getCozeList:e=>t.get("/coze",{params:e}),addCoze:e=>t.post("/coze",e),updateCoze:(e,o)=>t.patch(`/coze/${e}`,o),deleteCoze:e=>t.delete(`/coze/${e}`),getCozeDetail:e=>t.get(`/coze/${e}`)};export{z as a};
