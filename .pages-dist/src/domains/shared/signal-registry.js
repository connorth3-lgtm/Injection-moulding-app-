/* MouldMaster canonical process-signal semantic adapter — 2026.09.04.2 */
(function(){
'use strict';
if(window.MM_SIGNAL_REGISTRY)return;
const VERSION='2026.09.04.2';
/* This adapter aligns cross-domain IDs to process-data-semantic-registry.json. It does not replace that registry. */
const DEFINITIONS=[
 ['shot_index','Shot sequence',null,'structural','not-applicable','high',null,['shot','cycle_index']],
 ['fill_time_s','Fill time','s','derived','actual','medium','confirm-source-semantics',['fill_time','injection_time','filling_time']],
 ['transfer_position_mm','Transfer position','mm','derived','actual','medium','confirm-source-semantics',['vp_transfer_position','v_p_position','switchover_position']],
 ['transfer_pressure_mpa','Transfer pressure','MPa','derived','actual','medium','confirm-source-semantics',['transfer_pressure','vp_pressure']],
 ['peak_cavity_pressure_mpa','Peak cavity pressure','MPa','derived','actual','medium','confirm-source-semantics',['cavity_pressure_peak_mpa']],
 ['cushion_mm','Cushion','mm','derived','actual','medium','confirm-source-semantics',['cushion','cushion_position']],
 ['recovery_time_s','Recovery time','s','derived','actual','medium','confirm-source-semantics',['recovery_time','plasticising_time','plasticizing_time']],
 ['cycle_time_s','Cycle time','s','derived','actual','medium','confirm-source-semantics',['cycle_time']],
 ['part_mass_g','Part mass','g','quality','actual','medium','confirm-source-semantics',['part_weight_g','weight_g']],
 ['dimension_value','Dimension value',null,'quality','actual','medium','unit-from-companion-column',['measured_dimension']],
 ['quality_result','Quality result',null,'state','not-applicable','medium',null,['pass_fail']],
 ['defect_code','Defect category',null,'state','not-applicable','medium',null,['defect_alias']],
 ['supply_temp_c','Coolant supply temperature','°C','actual','actual','medium','confirm-source-semantics',['tcu_supply_c','cooling_supply_c','water_supply_c']],
 ['return_temp_c','Coolant return temperature','°C','actual','actual','medium','confirm-source-semantics',['tcu_return_c','cooling_return_c','water_return_c']],
 ['flow_lmin','Coolant flow','L/min','actual','actual','medium','confirm-source-semantics',['tcu_flow_lpm','cooling_flow_lpm','water_flow_lpm']],
 ['injection_pressure_actual','Injection pressure actual',null,'actual','actual','low','unit-must-be-confirmed',['machine_pressure_mpa','peak_injection_pressure']],
 ['injection_pressure_target','Injection pressure target',null,'command','command','low','unit-must-be-confirmed',['pressure_setpoint']],
 ['cavity_pressure','Cavity pressure',null,'actual','actual','low','unit-must-be-confirmed',['cavity_pressure_mpa']],
 ['screw_velocity_actual','Screw/injection velocity actual',null,'actual','actual','low','unit-must-be-confirmed',['injection_velocity','injection_speed_actual','screw_velocity']],
 ['screw_volume_actual','Screw/melt volume actual','cm3','actual','actual','medium','confirm-source-semantics',['melt_volume','screw_volume']],
 ['resin_moisture_ppm','Resin moisture','ppm','actual','actual','medium','confirm-source-semantics',['material_moisture_ppm','moisture_ppm']],
 ['dryer_dew_point_c','Dryer dew point','°C','actual','actual','medium','confirm-source-semantics',['dew_point_c','dryer_dewpoint_c']],
 ['drying_time_h','Drying time','h','derived','actual','medium','confirm-source-semantics',['dry_time_h']],
 ['regrind_fraction_pct','Regrind fraction','%','state','not-applicable','medium','confirm-source-semantics',['regrind_pct']],
 ['hot_runner_actual_c','Hot-runner actual temperature','°C','actual','actual','medium','confirm-source-semantics',['hot_runner_temp_actual','hotrunner_actual_c']],
 ['maintenance_event_code','Maintenance event',null,'state','not-applicable','medium',null,['maintenance_code']],
 ['process_change_code','Process change',null,'state','not-applicable','medium',null,['change_code']],
 ['intervention_code','Intervention',null,'state','not-applicable','medium',null,['intervention']],
 ['clamp_force_actual','Clamp force actual',null,'actual','actual','low','unit-must-be-confirmed',['clamp_force','tiebar_force']],
 ['melt_temperature_actual','Melt temperature actual','°C','actual','actual','medium','confirm-source-semantics',['melt_temp','melt_temperature']],
 ['mould_surface_temperature','Mould surface temperature','°C','actual','actual','medium','confirm-source-semantics',['mould_temp_c','mold_temp_c']],
 ['energy_per_cycle_kwh','Energy per cycle','kWh','derived','actual','medium','confirm-source-semantics',['energy_kwh','cycle_energy_kwh']]
];
function norm(v){return String(v??'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
function normUnit(v){return String(v??'').trim().toLowerCase().replace('degc','°c').replace('cm³','cm3')}
const byId=new Map(),aliases=new Map();
for(const [id,label,unit,role,actualness,confidence,status,aliasList] of DEFINITIONS){const record=Object.freeze({id,label,unit,role,actualness,confidence,status,aliases:[id,...aliasList]});byId.set(id,record);for(const a of record.aliases)aliases.set(norm(a),id);try{window.MM_DATA_SPINE?.register('process-signal',id,{label,unit,role,actualness,confidence,status})}catch(_){}}
function get(id){return byId.get(aliases.get(norm(id))||norm(id))||null}
function resolve(name,{unit=null,role=null,confirmed=false}={}){
 const raw=norm(name),id=aliases.get(raw)||raw,known=byId.get(id)||null;
 if(!known)return {status:'unresolved',sourceName:String(name||''),canonicalId:null,unit:unit||null,role:role||'unknown_source_semantics',actualness:'unresolved',reason:'No source-backed canonical mapping is registered.'};
 const out={sourceName:String(name||''),canonicalId:known.id,unit:unit||known.unit,role:role||known.role,actualness:known.actualness,confidence:known.confidence,registryStatus:known.status||null};
 if(unit&&known.unit&&normUnit(unit)!==normUnit(known.unit))return {...out,status:'review-required',reason:`Source unit ${unit} differs from canonical ${known.unit}.`};
 if(role&&known.role&&role!==known.role)return {...out,status:'review-required',reason:`Source role ${role} differs from canonical ${known.role}.`};
 if(known.status==='unit-must-be-confirmed'&&!unit)return {...out,status:'review-required',reason:'Authoritative engineering unit is unresolved for this source channel.'};
 if(known.status==='unit-from-companion-column'&&!unit)return {...out,status:'review-required',reason:'Engineering unit must be supplied from the companion unit field.'};
 if(known.status==='confirm-source-semantics'&&!confirmed)return {...out,status:'review-required',reason:'Column name is a semantic suggestion; confirm the source meaning before treating it as engineering evidence.'};
 return {...out,status:'resolved',reason:confirmed?'Source semantics explicitly confirmed for this observation.':'Canonical semantic definition is complete.'};
}
function normalizeHeaders(headers,options={}){return (headers||[]).map(h=>resolve(h,options[h]||{}))}
function list(){return [...byId.values()]}
window.MM_SIGNAL_REGISTRY=Object.freeze({version:VERSION,get,resolve,normalizeHeaders,list,canonicalSource:'process-data-semantic-registry.json',boundary:'This is a cross-domain adapter over the canonical local process semantic model. Unknown, unit-incomplete, role-conflicting or source-unconfirmed channels remain unresolved/review-required rather than being inferred into measured evidence.'});
})();
