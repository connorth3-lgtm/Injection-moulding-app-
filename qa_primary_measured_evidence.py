from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
INDEX = ROOT / 'data' / 'primary-measured-evidence-registry-v1.json'
OVERLAY = ROOT / 'data' / 'evidence-promotion-overlay-v2.json'
REPORT = ROOT / 'primary-measured-evidence-report.json'

DOI_RE = re.compile(r'^10\.\d{4,9}/\S+$', re.I)
ALLOWED_TIERS = {'A', 'B'}
ALLOWED_RAW = {'public-open', 'not-public-confirmed', 'available-on-request'}
FORBIDDEN_COUNT_TYPES = {
    'review', 'systematic-review', 'simulation-only', 'synthetic-only',
    'conference-abstract-without-measured-methods', 'unverified-third-party-mirror',
    'duplicate-publication-of-same-experiment'
}
EXPECTED_STAGED = {
    'fibre-breakage-retained-length','runner-gate-multicavity-imbalance','hot-runner-actual-behaviour',
    'liquid-silicone-rubber','fluid-assisted-moulding','moisture-drying-degradation',
    'recyclate-process-variability','surface-replication-release','injection-compression-precision-optics',
}


def need(ok, msg):
    if not ok: raise AssertionError(msg)

def load(path):
    need(path.exists(), f'missing registry dependency: {path.relative_to(ROOT).as_posix()}')
    return json.loads(path.read_text(encoding='utf-8'))

index=load(INDEX); overlay=load(OVERLAY)
need(index.get('schema')==1,'unsupported primary measured evidence schema')
policy=index.get('credibilityPolicy',{})
need(policy.get('predictionIsNotCausation') is True,'prediction/causation boundary missing')
need(policy.get('universalProcessRecipesAllowed') is False,'universal recipe boundary missing')
need(policy.get('sameExperimentPaperAndDatasetCountOnce') is True,'paper/dataset experiment deduplication rule missing')
need(policy.get('minimumRedundancyPerStagedMechanism')==3,'staged mechanism redundancy rule drifted')
need(set(policy.get('excludedFromCount',[]))==FORBIDDEN_COUNT_TYPES,'excluded evidence-type policy drifted')

packs=index.get('packs',[])
need(len(packs)>=6,'primary measured pack history unexpectedly contracted')
entries=[]; pack_counts={}
for p in packs:
    path=ROOT/p['path']; pack=load(path)
    need(pack.get('schema')==1,f'{p["path"]}: unsupported pack schema')
    rows=pack.get('entries')
    need(isinstance(rows,list),f'{p["path"]}: entries must be a list')
    need(len(rows)==p.get('entries'),f'{p["path"]}: manifest count does not match pack')
    pack_counts[p['path']]=len(rows); entries.extend(rows)

summary=index.get('summary',{})
expected_total=sum(pack_counts.values())
need(len(entries)==expected_total,'primary measured pack aggregation drifted')
need(summary.get('publisherVerifiedPeerReviewedPrimaryMeasured')==expected_total,'summary primary measured total drifted')
need(summary.get('uniqueDois')==expected_total,'summary unique DOI count drifted')

dois=[]; experiments=[]; tier_counts={'A':0,'B':0}
for i,e in enumerate(entries,1):
    prefix=f'entry {i} ({e.get("title","untitled")})'
    doi=str(e.get('doi','')).strip()
    need(DOI_RE.fullmatch(doi) is not None,f'{prefix}: valid DOI missing')
    need(bool(str(e.get('title','')).strip()),f'{prefix}: title missing')
    need(isinstance(e.get('year'),int) and 1900<=e['year']<=2100,f'{prefix}: year invalid')
    need(bool(str(e.get('journal','')).strip()),f'{prefix}: journal missing')
    need(str(e.get('publisherUrl','')).strip().startswith('https://'),f'{prefix}: publisher URL must use HTTPS')
    tier=e.get('tier'); need(tier in ALLOWED_TIERS,f'{prefix}: unsupported credibility tier {tier}'); tier_counts[tier]+=1
    tags=e.get('tags'); need(isinstance(tags,list) and tags and all(str(x).strip() for x in tags),f'{prefix}: mechanism tags missing')
    exp=str(e.get('experiment','')).strip(); overlap=str(e.get('overlap','')).strip()
    need(exp and overlap,f'{prefix}: experiment/overlap identity missing'); experiments.append(exp)
    for field in ['machine','material','tool','scale','causal']:
        need(bool(str(e.get(field,'')).strip()),f'{prefix}: {field} context missing')
    for field in ['signals','outcomes']:
        vals=e.get(field); need(isinstance(vals,list) and vals and all(str(x).strip() for x in vals),f'{prefix}: {field} missing')
    raw=e.get('raw'); need(isinstance(raw,dict) and raw.get('status') in ALLOWED_RAW,f'{prefix}: raw-data status missing/unsupported')
    if raw.get('status')=='public-open': need(str(raw.get('location','')).startswith('https://'),f'{prefix}: public-open raw data need source location')
    need(len(str(e.get('limitation','')).strip())>=80,f'{prefix}: limitation too weak')
    searchable=' '.join([str(e.get('causal','')),*map(str,tags)]).lower()
    for forbidden in ['simulation-only','synthetic-only','review-only']:
        need(forbidden not in searchable,f'{prefix}: forbidden evidence type counted: {forbidden}')
    dois.append(doi.lower())

need(len(dois)==len(set(dois)),'duplicate DOI counted as independent primary measured evidence')
need(len(experiments)==len(set(experiments)),'duplicate experiment identity counted as independent primary measured study')
need(summary.get('tierA')==tier_counts['A'] and summary.get('tierB')==tier_counts['B'],'manifest tier summary drifted')
need(sum(tier_counts.values())==expected_total,'credibility tier total drifted')

by_doi={e['doi'].lower():e for e in entries}
candidates=index.get('promotionCandidates',[])
need(len(candidates)==9,'expected nine staged promotion candidates')
need(summary.get('promotionCandidatesStagedNotApplied')==9,'promotion-candidate summary drifted')
need(summary.get('stagedMechanismsWithRedundantEvidence')==9,'redundant-evidence summary drifted')
seen=set(); redundancy={}
for c in candidates:
    mid=str(c.get('mechanismId','')).strip(); need(mid and mid not in seen,f'duplicate/missing promotion candidate: {mid}'); seen.add(mid)
    need(c.get('status')=='eligible-candidate-not-applied',f'{mid}: qualification snapshot must remain pre-promotion')
    q=c.get('qualifyingDois'); need(isinstance(q,list) and len(q)==2,f'{mid}: exactly two qualifying DOI references required')
    qn=[str(x).lower() for x in q]; need(len(qn)==len(set(qn)) and all(x in by_doi for x in qn),f'{mid}: qualifying DOI set invalid')
    a,b=(by_doi[x] for x in qn); need(a['experiment']!=b['experiment'] and a['overlap']!=b['overlap'],f'{mid}: duplicate experiment/overlap counted toward promotion')
    support=c.get('supportingDois'); need(isinstance(support,list) and support,f'{mid}: independent backup study required')
    sn=[str(x).lower() for x in support]; need(len(sn)==len(set(sn)) and not(set(qn)&set(sn)) and all(x in by_doi for x in sn),f'{mid}: backup DOI set invalid')
    refs=[by_doi[x] for x in qn+sn]; exps=[x['experiment'] for x in refs]; ovs=[x['overlap'] for x in refs]
    need(len(set(exps))>=policy['minimumRedundancyPerStagedMechanism'],f'{mid}: insufficient independent experiments')
    need(len(exps)==len(set(exps)) and len(ovs)==len(set(ovs)),f'{mid}: duplicated experiment/overlap in promotion evidence')
    redundancy[mid]=len(refs)
    rationale=str(c.get('independenceRationale','')).strip().lower()
    need(len(rationale)>=160 and ('experiment' in rationale or 'programme' in rationale) and ('duplicate' in rationale or 're-analys' in rationale),f'{mid}: independence rationale too weak')
    claim=str(c.get('boundedClaim','')).strip().lower(); need(len(claim)>=120 and 'do not promote' in claim and 'universal' in claim,f'{mid}: bounded claim too weak')
need(seen==EXPECTED_STAGED,'staged mechanism set drifted')

coverage=load(ROOT/'data/evidence-coverage-v1.json'); coverage_by_id={m.get('id'):m for m in coverage.get('mechanisms',[])}
for c in candidates:
    mid=c['mechanismId']; need(mid in coverage_by_id and coverage_by_id[mid].get('promoted') is False and coverage_by_id[mid].get('status')!='promoted',f'{mid}: historical v1 registry was rewritten')

need(overlay.get('schema')==1 and overlay.get('baseRegistry')=='data/evidence-coverage-v1.json','formal promotion overlay drifted')
promotions=overlay.get('promotions',[]); need(len(promotions)==9,'expected nine explicit formal promotions')
overlay_by_mid={x.get('mechanismId'):x for x in promotions}; need(set(overlay_by_mid)==EXPECTED_STAGED,'formal overlay mechanism set drifted')
for c in candidates:
    mid=c['mechanismId']; item=overlay_by_mid[mid]
    need(str(item.get('dossier','')).startswith('data/mechanism-promotion-evidence/') and (ROOT/item['dossier']).exists(),f'{mid}: formal promotion dossier missing')
    oq=item.get('qualifyingSources'); need(isinstance(oq,list) and len(oq)==2,f'{mid}: formal promotion DOI pair invalid')
    od=[str(x.get('id','')).removeprefix('doi:').lower() for x in oq]
    need(od==[str(x).lower() for x in c['qualifyingDois']],f'{mid}: formal promotion pair differs from qualification snapshot')
    need(all(x.get('role')=='primary-measured-study' and x.get('verification')=='publisher-verified' for x in oq),f'{mid}: formal promotion source is not publisher-verified primary measured')
ov=overlay.get('summary',{}); need(ov.get('basePromoted')==3 and ov.get('overlayPromoted')==9 and ov.get('resolvedPromoted')==12 and ov.get('resolvedProvisional')==0 and ov.get('resolvedGaps')==0,'formal promotion overlay summary drifted')

report={'schema':2,'source':INDEX.relative_to(ROOT).as_posix(),'packCounts':pack_counts,'countedPrimaryMeasuredStudies':len(entries),'uniqueDois':len(set(dois)),'uniqueExperimentIdentities':len(set(experiments)),'tierCounts':tier_counts,'publicRawOrCompanionTierA':tier_counts['A'],'stagedPromotionCandidates':len(candidates),'redundantEvidenceCounts':redundancy,'minimumRedundancyPerStagedMechanism':policy['minimumRedundancyPerStagedMechanism'],'automaticLearnerStatusChanges':0,'formalOverlayPromotions':9,'resolvedPromotedMechanisms':12,'duplicateDois':0,'duplicateExperimentIdentities':0,'result':'pass'}
REPORT.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(f"MouldMaster primary measured evidence QA passed ({len(entries)} unique peer-reviewed primary measured studies; {tier_counts['A']} Tier A / {tier_counts['B']} Tier B; 9 qualified mechanisms with independent backup evidence; 9 explicit formal promotions)")
