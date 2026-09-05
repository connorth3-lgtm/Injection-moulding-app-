#!/usr/bin/env python3
"""Extract compact, unreviewed GTNB measured-learning authoring candidates.

Only injection-moulding records are selected using the source-documented I/INY machine
prefix rule already used by the governed benchmark. Raw workbook rows and product names
are never emitted. The outputs are numeric source-order representations for later review,
not promoted learner cases.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import tempfile
from collections import Counter, defaultdict
from pathlib import Path

from openpyxl import load_workbook

from prove_mendeley_open_sources import SOURCES, public_files, resolve_file, download_first

OUT=Path('measured-source-proof/gtnb-unreviewed-learning-candidates.json')
EXPECTED_ROWS=4502
HEADER_MAP={
    'Maquina':'machine',
    'Nombre_producto':'product',
    'Peso_producto_gramos':'Product_Weight',
    'Peso_prom_bruto':'Avg_Gross_Weight',
    'Consumo_PP_kilos':'PP_Consumption',
    'Consumo_pigmento_kilos':'Pigment_Consumption',
    'Kilos_colada':'Flash_kg',
    'Kilos_defectuosos':'Defective_kg',
    '%Colada':'%Flash',
    '%Defectuosos':'%Defective',
    '%Reproceso':'%Reprocess',
    'Presion_inyeccion_bares':'Injection_Pressure',
    'Presion_retencion_bares':'Retention_Pressure',
    'Temp_mat_fundido':'Melt_Temp',
    'Temp_molde_centigrados':'Mold_Temp',
    'Tiempo_ciclo':'Cycle_Time',
    'Tiempo_enfriamiento_inyeccion_seg':'Cooling_Time_Injection',
    'Tiempo_expulsion_inyeccion_seg':'Ejection_Time_Injection',
    'Tiempo_retencion_inyeccion_seg':'Retention_Time_Injection',
    'Velocidad_de_Inyección_mm/s':'Injection_Speed',
}
CHANNEL_META={
    'Product_Weight':('recorded-product-unit-weight','g'),
    'Avg_Gross_Weight':('recorded-average-gross-weight','g'),
    'PP_Consumption':('recorded-polypropylene-consumption','kg'),
    'Pigment_Consumption':('recorded-pigment-consumption','kg'),
    'Flash_kg':('recorded-flash-mass','kg'),
    'Defective_kg':('recorded-defective-product-mass','kg'),
    '%Flash':('recorded-flash-percentage','%'),
    '%Defective':('recorded-defective-percentage','%'),
    '%Reprocess':('recorded-reprocess-percentage','%'),
    'Injection_Pressure':('recorded-injection-pressure','bar'),
    'Retention_Pressure':('recorded-holding-pressure','bar'),
    'Melt_Temp':('recorded-melt-temperature','degC'),
    'Mold_Temp':('recorded-mould-temperature','degC'),
    'Cycle_Time':('recorded-cycle-time','s'),
    'Cooling_Time_Injection':('recorded-injection-cooling-time','s'),
    'Ejection_Time_Injection':('recorded-injection-ejection-time','s'),
    'Retention_Time_Injection':('recorded-holding-time','s'),
    'Injection_Speed':('recorded-injection-speed','mm/s'),
}


def canonical_sha(value):
    raw=json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode('utf-8')
    return 'sha256:'+hashlib.sha256(raw).hexdigest()


def finite(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(float(v))


def source_spec():
    return next(s for s in SOURCES if s['datasetId']=='mendeley-gtnb4j7bfx-v1')


def download_verified():
    source=source_spec(); file_id,name,expected_sha=source['files'][0]
    _,meta=public_files(source['shortId'],source['version'])
    _,_,urls=resolve_file(meta,file_id,name,source['shortId'],source['version'])
    td=tempfile.TemporaryDirectory(); path=Path(td.name)/name
    download_first(urls,path)
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    if digest!=expected_sha:
        td.cleanup(); raise RuntimeError(f'GTNB SHA mismatch: {digest}')
    return path,td,'sha256:'+digest


def uniform_sample(rows, limit=400):
    if len(rows)<=limit: return rows
    idx=sorted({round(i*(len(rows)-1)/(limit-1)) for i in range(limit)})
    return [rows[i] for i in idx]


def signal(channel, rows):
    semantic,unit=CHANNEL_META[channel]
    points=[r for r in rows if finite(r[channel])]
    xs=[float(r['_sourceRow']) for r in points]; ys=[float(r[channel]) for r in points]
    if len(xs)<2: raise RuntimeError(f'{channel}: insufficient numeric values')
    rep={'xSemantic':'observation-index','xUnit':'index','xDirection':'increasing','reductionMethod':'deterministic-source-row-selection-no-interpolation','originalPointCount':len(rows),'x':xs,'y':ys}
    return {'id':channel.lower().replace('%','pct-'),'label':channel.replace('_',' '),'sourceChannel':channel,'semantic':semantic,'unit':unit,'representation':rep,'representationFingerprint':canonical_sha(rep)}


def candidate(cid, rows, channels, suggested, selection, source_fp):
    sigs=[signal(ch,rows) for ch in channels]
    return {'candidateId':cid,'datasetId':'mendeley-gtnb4j7bfx-v1','sourceArtifact':'modelo.xlsx','sourceFingerprint':source_fp,'sourceScope':selection,'signals':sigs,'candidateFingerprint':canonical_sha(sigs),'suggestedCatalogueCases':suggested,'evidenceBoundary':'Historical public injection-production records only. Record order is not asserted to be shot-resolved; process fields are not relabelled as actual versus commanded values; associations do not establish root cause.'}


def main():
    path,td,fp=download_verified()
    try:
        wb=load_workbook(path,read_only=True,data_only=False)
        if 'nicky' not in wb.sheetnames: raise RuntimeError('GTNB nicky worksheet missing')
        ws=wb['nicky']
        actual=[ws.cell(1,c).value for c in range(1,34)]
        expected=list(HEADER_MAP)
        missing=[h for h in expected if h not in actual]
        if missing: raise RuntimeError(f'GTNB header drift: {missing}')
        col={h:actual.index(h)+1 for h in expected}
        rows=[]
        groups=defaultdict(list)
        for r in range(2,ws.max_row+1):
            machine=str(ws.cell(r,col['Maquina']).value or '').strip().upper()
            if not (re.fullmatch(r'I(?:-|_)?\d+',machine) or machine.startswith('INY')):
                continue
            row={'_sourceRow':r,'_machine':machine,'_product':str(ws.cell(r,col['Nombre_producto']).value or '')}
            for source_header,canonical in HEADER_MAP.items():
                if canonical in {'machine','product'}: continue
                v=ws.cell(r,col[source_header]).value
                if isinstance(v,(int,float)) and not isinstance(v,bool): row[canonical]=float(v)
                else: row[canonical]=None
            rows.append(row); groups[(row['_machine'],row['_product'])].append(row)
        if len(rows)!=EXPECTED_ROWS: raise RuntimeError(f'GTNB injection-row count drift: {len(rows)}')
        largest_key,largest_rows=max(groups.items(),key=lambda kv:(len(kv[1]),kv[0][0],kv[0][1]))
        group_alias='sha256:'+hashlib.sha256(('\u241f'.join(largest_key)).encode('utf-8')).hexdigest()
        group_rows=uniform_sample(largest_rows,400)
        all_rows=uniform_sample(rows,400)
        middle_start=max(0,(len(rows)-400)//2); middle_rows=rows[middle_start:middle_start+400]
        candidates=[
            candidate('GTNB-LARGEST-PRODUCT-GROUP-01',group_rows,['Product_Weight','Cycle_Time','Injection_Pressure','Melt_Temp'],['MLM-004','MLM-007','MLM-019','MLM-067'],{'selection':'largest injection machine/product group by delivered record count','groupAlias':group_alias,'groupSourceRecordCount':len(largest_rows),'displayedRecords':len(group_rows)},fp),
            candidate('GTNB-QUALITY-ASSOCIATION-01',all_rows,['Injection_Pressure','Retention_Pressure','Mold_Temp','Flash_kg','Defective_kg','%Flash','%Defective'],['MLM-038','MLM-040'],{'selection':'uniform deterministic sample across all delivered injection records','sourceInjectionRecords':len(rows),'displayedRecords':len(all_rows)},fp),
            candidate('GTNB-MIDDLE-PROCESS-WINDOW-01',middle_rows,['Cycle_Time','Cooling_Time_Injection','Ejection_Time_Injection','Retention_Time_Injection','Injection_Speed','Product_Weight'],['MLM-019','MLM-038','MLM-067'],{'selection':'contiguous middle 400 injection records in delivered source order','injectionOrdinalStart':middle_start,'injectionOrdinalEndExclusive':middle_start+len(middle_rows)},fp),
        ]
        result={'schemaVersion':1,'status':'unreviewed-source-derived-candidates','promotionEligible':False,'candidateCount':len(candidates),'candidates':candidates,'boundary':'Authoring evidence only. Product and machine identifiers are not emitted; the largest group is represented only by a one-way hash alias. Independent engineering review and case-specific binding remain mandatory.'}
        OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
        print(json.dumps({'status':result['status'],'candidateCount':len(candidates),'candidateIds':[c['candidateId'] for c in candidates]},separators=(',',':')))
    finally: td.cleanup()
    return 0

if __name__=='__main__': raise SystemExit(main())
