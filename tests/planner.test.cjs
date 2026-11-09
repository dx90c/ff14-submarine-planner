const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const code = html.split('  <script>')[1].split('</script>')[0];
new vm.Script(code);
const context = vm.createContext({Vue: {}});
vm.runInContext(code.slice(0, code.indexOf('    createApp({')), context);
function run(expression) { return JSON.parse(JSON.stringify(vm.runInContext(expression, context))); }
const shark = "{hull:'1_hull',stern:'1_stern',bow:'1_bow',bridge:'1_bridge'}";
const modified = "{hull:'4p_hull',stern:'1p_stern',bow:'2p_bow',bridge:'4p_bridge'}";

test('rank 1 shark fits starting capacity with no artificial bonuses', () => {
  assert.deepEqual(run(`calculateBuildStats(${shark}, 1)`),
    {surv:30,retr:110,spd:110,range:70,favor:70,cost:20,capacity:20,equipmentRank:1});
});
test('rank 90 modified 4124 uses correct part attributes and rank bonuses', () => {
  assert.deepEqual(run(`calculateBuildStats(${modified}, 90)`),
    {surv:195,retr:135,spd:200,range:115,favor:180,cost:80,capacity:80,equipmentRank:50});
});
test('changing rank changes bonuses and capacity; invalid rank is clamped', () => {
  assert.equal(run(`calculateBuildStats(${shark}, 90).surv`), 85);
  assert.equal(run(`calculateBuildStats(${shark}, 145).surv`), 140);
  assert.equal(run(`calculateBuildStats(${shark}, 0).capacity`), 20);
  assert.equal(run('normalizeRankValue(999)'), 145);
  assert.equal(run('normalizeRankValue(NaN)'), 1);
});
test('rank, equipment rank and capacity each prevent false positive status', () => {
  assert.equal(run(`analyzeSectorGap(calculateBuildStats(${modified},1),1,${modified},{reqRank:10}).isQualified`),false);
  assert.deepEqual(run(`analyzeSectorGap(calculateBuildStats(${modified},1),1,${modified},{reqRank:10}).issues.map(i=>i.type)`),['rank','equipment','capacity']);
  assert.equal(run(`analyzeSectorGap(calculateBuildStats(${shark},1),1,${shark},{reqRank:1}).isQualified`),true);
  assert.equal(run(`analyzeSectorGap(calculateBuildStats(${modified},49),49,${modified},{reqRank:1}).isQualified`),false);
});
test('survey distance is never used as a surveillance or route threshold', () => {
  assert.equal(run('SECTORS.length'),143);
  assert.equal(run('SECTORS.every(s=>Number.isFinite(s.surveyDistance) && !("reqRange" in s) && !("reqSurv" in s))'),true);
});
test('save loading validates schema, slots, IDs and rank', () => {
  const saved = {version:1,playerRank:999,currentBuild:{hull:'2_hull',stern:'1_hull'},activeSeaId:'bogus',
    unlockedSectorIds:['m1_A','bogus','m1_A'],inspectingSectorId:'bogus',showAllMapLabels:'true'};
  const result = run(`readSavedState({getItem:()=>${JSON.stringify(JSON.stringify(saved))}})`);
  assert.equal(result.playerRank,145);
  assert.deepEqual(result.currentBuild,{hull:'2_hull'});
  assert.deepEqual(result.unlockedSectorIds,['m1_A']);
  assert.equal(result.activeSeaId,'sea_1');
  assert.equal(result.inspectingSectorId,null);
  assert.equal(result.showAllMapLabels,false);
});
test('missing save is valid; broken and future saves are caught by caller', () => {
  assert.equal(run('readSavedState({getItem:()=>null})'), null);
  assert.throws(()=>run('readSavedState({getItem:()=>"broken"})'));
  assert.throws(()=>run('readSavedState({getItem:()=>\'{"version":99}\'})'));
  assert.throws(()=>run('readSavedState({getItem(){throw new Error("denied")}})'));
});
test('all preconditions exist and ancestor chains are acyclic', () => {
  assert.equal(run(`SECTORS.every(s=>{
    const seen=new Set([s.id]);let id=s.unlockedBy;
    while(id){if(seen.has(id)||!sectorMap.has(id))return false;seen.add(id);id=sectorMap.get(id).unlockedBy;}
    return true;
  })`),true);
});
test('all parts/ranks match recorded game data snapshot', () => {
  function csv(name) {
    const [header,...lines]=fs.readFileSync(path.join(__dirname,'../data/',name),'utf8').trim().split(/\r?\n/);
    const keys=header.split(',');
    return lines.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[keys[i],Number(v)])));
  }
  const classes={'1':3,'2':2,'3':1,'4':4,'5':5,'1+':8,'2+':7,'3+':6,'4+':9,'5+':10};
  const slots={hull:0,stern:1,bow:2,bridge:3};
  const rows=csv('SubmarinePart.csv');
  for(const part of run('SUB_PARTS')) {
    const row=rows.find(r=>r.Class===classes[part.code]&&r.Slot===slots[part.slot]);
    for(const [key,field] of Object.entries({cost:'Components',minRank:'Rank',surv:'Surveillance',retr:'Retrieval',spd:'Speed',range:'Range',favor:'Favor'}))
      assert.equal(part[key],row[field],`${part.id} ${key}`);
  }
  const ranks=run('RANK_DATA');
  for(const row of csv('SubmarineRank.csv').filter(r=>r.Capacity>0)) {
    for(const [key,field] of Object.entries({capacity:'Capacity',surv:'SurveillanceBonus',retr:'RetrievalBonus',spd:'SpeedBonus',range:'RangeBonus',favor:'FavorBonus'}))
      assert.equal(ranks[row['#']][key],row[field],`rank ${row['#']} ${key}`);
  }
});
