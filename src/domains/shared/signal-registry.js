/* MouldMaster canonical process-signal dictionary — 2026.09.04.1 */
(function(){
'use strict';
if(window.MM_SIGNAL_REGISTRY)return;
const VERSION='2026.09.04.1';
const DEFINITIONS=[
 ['shot_index','Shot sequence','index','sequence','derived',['shot','cycle_index']],
 ['fill_time_s','Fill time','s','time','actual',['fill_time','injection_time','filling_time']],
 ['transfer_position_mm','Transfer position','mm','position','actual',['vp_transfer_position','v_p_position','switchover_position']],
 ['transfer_pressure_mpa','Transfer pressure','MPa','pressure','actual',['transfer_pressure','vp_pressure']],
 ['injection_pressure_actual','Injection pressure actual',null,'pressure','actual',['machine_pressure_mpa','peak_injection_pressure','injection_pressure_actual','injection_pressure']],
 ['injection_pressure_target','Injection pressure target',null,'pressure','command',['injection_pressure_target','pressure_setpoint']],
 ['cavity_pressure','Cavity pressure',null,'pressure','actual',['peak_cavity_pressure_mpa','cavity_pressure_mpa','cavity_pressure']],
 ['cushion_mm','Cushion','mm','position','actual',['cushion','cushion_position']],
 ['recovery_time_s','Recovery time','s','time','actual',['recovery_time','plasticising_time','plasticizing_time']],
 ['cycle_time_s','Cycle time','s','time','actual',['cycle_time']],
 ['screw_velocity_actual','Screw/injection velocity actual',null,'velocity','actual',['injection_velocity','injection_speed_actual','screw_velocity']],
 ['screw_volume_actual','Screw volume actual','cm3','volume','actual',['melt_volume','screw_volume']],
 ['tcu_supply_c','TCU supply temperature','degC','temperature','actual',['cooling_supply_c','water_supply_c']],
 ['tcu_return_c','TCU return temperature','degC','temperature','actual',['cooling_return_c','water_return_c']],
 ['tcu_flow_lpm','TCU flow','L/min','flow','actual',['cooling_flow_lpm','water_flow_lpm']],
 ['resin_moisture_ppm','Resin moisture','ppm','material-state','actual',['material_moisture_ppm','moisture_ppm']],
 ['dryer_dew_point_c','Dryer dew point','degC','material-state','actual',['dew_point_c','dryer_dewpoint_c']],
 ['drying_time_h','Drying time','h','material-state','history',['dry_time_h']],
 ['regrind_fraction_pct','Regrind fraction','%','material-state','declared',['regrind_pct']],
 ['hot_runner_actual_c','Hot-runner actual temperature','degC','temperature','actual',['hot_runner_temp_actual','hotrunner_actual_c']],
 ['part_mass_g','Part mass','g','quality','actual',['part_weight_g','weight_g']],
 ['dimension_value','Dimension value',null,'quality','actual',['dimension','measured_dimension']],
 ['quality_result','Quality result',null,'quality','categorical',['quality','pass_fail']],
 ['defect_alias','Defect category',null,'quality','categorical',['defect_code','defect']],
 ['maintenance_event_code','Maintenance event',null,'intervention','categorical',['maintenance_code']],
 ['process_change_code','Process change',null,'intervention','categorical',['change_code']],
 ['intervention_code','Intervention',null,'intervention','categorical',['intervention']],
 ['clamp_force_actual','Clamp force actual',null,'force','actual',['clamp_force','tiebar_force']],
 ['melt_temperature_actual','Melt temperature actual','degC','temperature','actual',['melt_temp','melt_temperature']],
 ['mould_surface_temperature','Mould surface temperature','degC','temperature','actual',['mould_temp_c','mold_temp_c']],
 ['energy_per_cycle_kwh','Energy per cycle','kWh','energy','actual',['energy_kwh','cycle_energy_kwh']]
];
function norm(v){return String(v??'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')}
const byId=new Map(),aliases=new Map();
for(const [id,label,unit,quantity,role,aliasList] of DEFINITIONS){const record=Object.freeze({id,label,unit,quantity,role,aliases:[id,...aliasList]});byId.set(id,record);for(const a of record.aliases)aliases.set(norm(a),id);try{window.MM_DATA_SPINE?.register('process-signal',id,{label,unit,quantity,role})}catch(_){}}
function get(id){return byId.get(norm(id))||null}
function resolve(name,{unit=null,role=null}={}){const raw=norm(name),id=aliases.get(raw)||raw,known=byId.get(id)||null;if(!known)return {status:'unresolved',sourceName:String(name||''),canonicalId:null,unit:unit||null,role:role||'unknown_source_semantics',reason:'No source-backed canonical mapping is registered.'};if(unit&&known.unit&&norm(unit)!==norm(known.unit))return {status:'review-required',sourceName:String(name||''),canonicalId:known.id,unit,role:role||known.role,reason:`Source unit ${unit} differs from canonical ${known.unit}.`};if(role&&known.role&&role!==known.role)return {status:'review-required',sourceName:String(name||''),canonicalId:known.id,unit:unit||known.unit,role,reason:`Source role ${role} differs from canonical ${known.role}.`};return {status:'resolved',sourceName:String(name||''),canonicalId:known.id,unit:unit||known.unit,role:role||known.role,quantity:known.quantity}}
function normalizeHeaders(headers){return (headers||[]).map(h=>resolve(h))}
function list(){return [...byId.values()]}
window.MM_SIGNAL_REGISTRY=Object.freeze({version:VERSION,get,resolve,normalizeHeaders,list,boundary:'Mappings distinguish measured actuals, commands, derived/categorical fields and unresolved semantics. Unknown units or roles fail to review-required rather than being inferred.'});
})();
