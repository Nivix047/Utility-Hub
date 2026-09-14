import {it,expect} from 'vitest';
import {loadRecords,persistRecords,storageKey} from './renewalStorage';
import {makeRecord} from './producerRecords';
function storage(){const values=new Map<string,string>();return {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,v:string)=>{values.set(key,v);},removeItem:(key:string)=>{values.delete(key);}};}
const records=[makeRecord({lastName:'Smith',firstName:'Jane',policyNumber:'P1',effDate:'2026-09-13',producer:'Alex',renewal:'1100',expiring:'1000'})];
it('migrates tab records and keeps them when a new tab opens',()=>{const local=storage(),session=storage();session.setItem(storageKey,JSON.stringify(records));const migrated=loadRecords(local,session);expect(migrated).toEqual(records);persistRecords(migrated,local,session);expect(session.getItem(storageKey)).toBeNull();expect(loadRecords(local,storage())).toEqual(records);});
it('clearing persists and does not resurrect stale tab records',()=>{const local=storage(),session=storage();persistRecords([],local,session);session.setItem(storageKey,JSON.stringify(records));expect(loadRecords(local,session)).toEqual([]);});
it('failed persistent writes retain the original tab records',()=>{const session=storage();session.setItem(storageKey,JSON.stringify(records));expect(()=>persistRecords(records,{setItem:()=>{throw new Error('quota');}},session)).toThrow();expect(loadRecords(storage(),session)).toEqual(records);});
