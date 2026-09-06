import test from 'node:test';
import assert from 'node:assert/strict';
import {findTmdbIdentity, identitySearchTarget} from '../lib/tmdb-identity.mjs';
const drama = {slug:'live',title:'Live',query:'Live 2018 Korean drama police',native:'라이브',year:2018};
const result = {id:123,name:'Live',original_name:'라이브',first_air_date:'2018-03-10',origin_country:['KR']};
const stub = (mapping, calls=[]) => async (path,params) => {calls.push({path,...params}); return mapping[params.query] ?? {results:[]};};
test('verbose query miss falls back to exact canonical title with API year filter',async()=>{
 const calls=[]; assert.equal(await findTmdbIdentity(drama,stub({'Live':{results:[result]}},calls)),123);
 assert.equal(calls[0].query,drama.query); assert.ok(calls.some(c=>c.query==='Live'));
 assert.ok(calls.every(c=>c.first_air_date_year==='2018'));
});
test('native-title fallback handles changed English names',async()=>{
 assert.equal(await findTmdbIdentity(drama,stub({'라이브':{results:[{...result,name:'Different English Name'}]}})),123);
});
test('duplicate same-ID hits across fallback queries are not ambiguous',async()=>{
 assert.equal(await findTmdbIdentity(drama,stub({'Live':{results:[result,result]},'라이브':{results:[result]}})),123);
});
test('different exact IDs across fallback queries remain ambiguous',async()=>{
 assert.equal(await findTmdbIdentity(drama,stub({'Live':{results:[result]},'라이브':{results:[{...result,id:124}]}})),null);
});
test('wrong year, non-Korean origin and approximate titles stay rejected',async()=>{
 for(const bad of [{...result,first_air_date:'2017-01-01'},{...result,origin_country:['US']},{...result,name:'Live Again',original_name:'Other'}]) {
  assert.equal(await findTmdbIdentity(drama,stub({'Live':{results:[bad]}})),null);
 }
});
test('season lookup uses explicit parent title and series premiere year',async()=>{
 const base={slug:'series',title:'Series',native:'시리즈',year:2021};
 const child={slug:'series-2',title:'Series Season 2',year:2023,seriesYear:2021,season:2,seasonOf:'series'};
 const calls=[]; assert.equal(await findTmdbIdentity(child,stub({'Series':{results:[{id:777,name:'Series',first_air_date:'2021-01-01',origin_country:['KR']}]}},calls),[base,child]),777);
 assert.equal(calls[0].first_air_date_year,'2021'); assert.equal(child.year,2023); assert.equal(child.season,2);
});
test('missing or year-conflicting parent does not silently change identity',()=>{
 const child={slug:'series-2',title:'Series Season 2',year:2023,seriesYear:2021,season:2,seasonOf:'series'};
 assert.equal(identitySearchTarget(child,[]),child);
 assert.equal(identitySearchTarget(child,[{slug:'series',title:'Wrong',year:1999}]),child);
});
test('explicit TMDB IDs do not search',async()=>{
 assert.equal(await findTmdbIdentity({...drama,tmdb_id:456},async()=>{throw Error('Unexpected request');}),456);
});
test('failed or malformed search results return unresolved, not guessed IDs',async()=>{
 for(const response of [null,{}, {results:{}},{results:[null,{...result,id:-1},{...result,id:'123'}]}]) {
  assert.equal(await findTmdbIdentity(drama,async()=>response),null);
 }
});
test('successful original query avoids extra fallback requests',async()=>{
 const calls=[]; assert.equal(await findTmdbIdentity(drama,stub({[drama.query]:{results:[result]}},calls)),123); assert.equal(calls.length,1);
});
