/* GENERATED FILE — DO NOT EDIT DIRECTLY.
 * Built by tools/build_runtime_packs.py from reviewed classic-script parts.
 * Concatenation preserves the exact historical execution order; no code is transformed.
 * Pack: evidence-runtime-pack.js
 */

/* >>> reference-data.js */
/* MouldMaster Reference Data Pack — 2026.08.24.1 */
(function(){
'use strict';

const DATA={
  version:'2026.08.24.1',
  note:'Reference data are learning aids, not universal production setpoints. Verify the exact resin grade, supplier data, machine and mould documentation, approved site procedures, and applicable safety requirements before making production changes.',
  materials:[
    {name:'Polypropylene (PP)',family:'Semi-crystalline polyolefin',traits:['low density','good chemical resistance','fatigue resistance','significant mould shrinkage'],watch:['thermal balance and cooling strongly affect shrinkage/warpage','grade stiffness and impact performance vary widely','some filled grades are abrasive'],verify:'Exact grade datasheet, filler/reinforcement level, shrinkage guidance and approved processing window.'},
    {name:'High-density polyethylene (HDPE)',family:'Semi-crystalline polyolefin',traits:['tough','chemical resistant','low moisture uptake','high shrinkage compared with many amorphous polymers'],watch:['warpage can reflect uneven cooling and orientation','long flow paths can magnify pressure loss','density and molecular-weight distribution affect behaviour'],verify:'Grade-specific rheology, shrinkage and dimensional expectations.'},
    {name:'ABS',family:'Amorphous styrenic',traits:['good impact balance','good surface appearance','dimensionally more predictable than high-shrink crystalline resins'],watch:['moisture/contamination can affect appearance','overheating or excessive residence can discolour material','surface finish is sensitive to flow and venting'],verify:'Supplier drying guidance where applicable, colour/additive limits and thermal history.'},
    {name:'Polycarbonate (PC)',family:'Amorphous engineering thermoplastic',traits:['high toughness','good dimensional stability','transparent grades available'],watch:['moisture-sensitive grades require controlled handling','high melt viscosity can increase pressure demand','thermal degradation can cause colour/appearance changes'],verify:'Grade-specific drying/moisture target, residence-time limits and mould-temperature guidance.'},
    {name:'PA6 / PA66 (Nylon)',family:'Semi-crystalline polyamide',traits:['strong','wear resistant','reinforced grades common','properties strongly influenced by absorbed moisture'],watch:['moisture before moulding can cause degradation or appearance issues','post-mould moisture conditioning changes dimensions/properties','glass-filled grades increase wear and anisotropy'],verify:'Exact polymer/grade, reinforcement, drying method, moisture specification and conditioning requirements.'},
    {name:'PBT',family:'Semi-crystalline polyester',traits:['good electrical properties','good chemical resistance','dimensionally useful in reinforced grades'],watch:['hydrolysis risk when processed with excessive moisture','glass-filled grades can show orientation-driven warpage','surface quality depends on fill/venting/thermal balance'],verify:'Supplier moisture/drying specification, reinforcement level and dimensional data.'},
    {name:'PET',family:'Semi-crystalline polyester',traits:['good strength','barrier applications common','crystallisation behaviour depends on grade and thermal history'],watch:['moisture control is critical for molecular-weight retention','crystallisation and cooling affect dimensions and appearance','recycled content can change viscosity/colour'],verify:'Intrinsic-viscosity/grade information, drying method, recycled-content rules and application-specific requirements.'},
    {name:'POM / Acetal',family:'Semi-crystalline engineering thermoplastic',traits:['low friction','good dimensional repeatability','good fatigue performance'],watch:['thermal abuse can cause decomposition','incompatible contamination is a serious processing concern','shrinkage and orientation still require balanced cooling'],verify:'Supplier safety/processing guidance, contamination controls and grade-specific shrinkage.'},
    {name:'PMMA / Acrylic',family:'Amorphous acrylic',traits:['high optical clarity','good weatherability','good surface quality'],watch:['surface defects and flow marks are highly visible','moisture can affect appearance in some grades','scratch sensitivity requires handling control'],verify:'Optical-grade handling, drying if specified, surface requirements and contamination controls.'},
    {name:'TPU',family:'Thermoplastic elastomer',traits:['elastic','abrasion resistant','wide hardness range'],watch:['many grades are moisture sensitive','soft grades can feed/recover differently from rigid pellets','release and ejection can dominate cycle stability'],verify:'Hardness, chemistry family, moisture requirement, release guidance and approved residence limits.'},
    {name:'PPS',family:'High-temperature semi-crystalline engineering polymer',traits:['chemical resistant','dimensionally stable in reinforced grades','high-temperature capability'],watch:['filled grades are often abrasive','tooling and machine wear controls matter','venting and thermal management remain important'],verify:'Reinforcement, corrosion/wear requirements, supplier processing envelope and part-performance specification.'},
    {name:'PEEK',family:'High-performance semi-crystalline polymer',traits:['high-temperature capability','chemical resistance','high mechanical performance'],watch:['requires equipment and tooling suitable for high processing temperatures','crystallinity strongly affects properties','material cost makes purge/startup discipline important'],verify:'Grade-specific supplier processing instructions, machine capability, tooling temperature capability and validated quality plan.'},
    {name:'Polystyrene (PS)',family:'Amorphous styrenic',traits:['easy-flowing grades common','good dimensional stability','clear general-purpose grades available'],watch:['brittleness can make ejection/design features critical','overheating can cause degradation and odour','weld lines and stress concentration can reduce strength'],verify:'Exact grade, impact modification, food/contact status where relevant and supplier processing guidance.'},
    {name:'HIPS',family:'Impact-modified polystyrene',traits:['tougher than general-purpose PS','good processability','opaque'],watch:['rubber modification changes stiffness and appearance','regrind level may affect colour and impact performance','surface gloss may vary with thermal history'],verify:'Grade-specific impact, colour, regrind and dimensional requirements.'},
    {name:'ASA',family:'Weather-resistant styrenic',traits:['good weatherability','good surface appearance','impact-resistant grades available'],watch:['surface and colour consistency depend on material condition','some grades require drying','hot-runner residence should remain within supplier guidance'],verify:'Outdoor exposure requirement, colour, grade-specific drying and thermal limits.'},
    {name:'SAN',family:'Amorphous styrenic copolymer',traits:['clarity','chemical resistance better than PS in some environments','rigid'],watch:['brittleness and notch sensitivity can matter','chemical compatibility is application-specific','surface defects remain visible on clear parts'],verify:'Exact grade chemical-resistance data and mechanical requirements.'},
    {name:'TPE / TPR',family:'Thermoplastic elastomer family',traits:['rubber-like response','overmoulding grades common','wide hardness range'],watch:['bonding depends on substrate and exact chemistry','soft pellets can bridge/feed differently','release and texture can affect demoulding'],verify:'Chemistry family, substrate compatibility, hardness, bonding data and supplier handling guidance.'},
    {name:'LCP',family:'Liquid-crystal polymer',traits:['very high flow in thin sections','high-temperature performance','low flash propensity in suitable tooling but highly anisotropic'],watch:['strong molecular orientation affects dimensions/properties','very small gates and thin sections demand precise tooling','filled grades can be abrasive'],verify:'Flow direction, reinforcement, dimensional orientation and exact tooling guidance.'},
    {name:'PC/ABS',family:'Amorphous polymer blend',traits:['balance of PC toughness and ABS processability','good impact performance','common in housings'],watch:['moisture handling remains important','blend ratio/grade changes thermal and mechanical response','surface and colour can reveal degradation'],verify:'Exact supplier blend grade, drying, flame rating and application requirements.'},
    {name:'Recycled-content compounds',family:'Recycled or mass-balanced thermoplastic compounds',traits:['can reduce virgin-material demand','property range depends heavily on feedstock and formulation'],watch:['lot-to-lot viscosity, colour and contamination may vary','regulatory/contact claims require traceability','multiple heat histories can affect properties'],verify:'Supplier certificate, recycled-content definition, incoming QC, lot traceability and validated process window.'}
  ],
  defects:[
    {name:'Short shot',evidence:'Incomplete fill or unfilled extremities.',check:['fill pattern and flow restriction','actual fill time and pressure demand','material condition and thermal actuals','venting at end-of-fill locations'],avoid:'Do not assume injection speed alone is the cause.'},
    {name:'Flash',evidence:'Excess material at parting lines, inserts, vents or shutoffs.',check:['exact flash location','tool seating/parting-line condition','clamp performance and actual cavity pressure demand','local damage, wear or contamination'],avoid:'Do not use clamp force to hide a damaged shutoff without investigation.'},
    {name:'Sink marks',evidence:'Local surface depressions, often over thick sections or ribs.',check:['local section thickness','gate effectiveness and gate-seal evidence','packing response and part mass','local cooling balance'],avoid:'Do not extend hold time blindly after the gate has stopped transmitting useful pressure.'},
    {name:'Warpage',evidence:'Part shape departs from intended geometry after moulding.',check:['mould temperature balance','cooling circuit condition','orientation and fibre direction','packing balance and ejection condition'],avoid:'Treat warpage as a multi-factor dimensional response, not a single-setting defect.'},
    {name:'Burn / dieseling',evidence:'Dark, scorched or degraded area, often near trapped gas/end of fill.',check:['defect location relative to end of fill','vent condition and gas escape path','local fill velocity/compression of trapped air','material degradation evidence'],avoid:'Do not bypass guarding or open a running mould to inspect vents.'},
    {name:'Splay / silver streaks',evidence:'Silver or pale streaking on the surface.',check:['material moisture and handling history','contamination or volatiles','thermal degradation/residence evidence','decompression or air entrainment where relevant'],avoid:'Do not apply one generic drying recipe across resin families.'},
    {name:'Weld / knit line weakness',evidence:'Visible or weak line where flow fronts meet.',check:['flow-front location and geometry','venting at the meeting point','material/thermal condition','local pressure and orientation'],avoid:'Appearance alone does not prove mechanical acceptability.'},
    {name:'Jetting',evidence:'Snake-like or folded flow trace from a gate.',check:['gate direction and local geometry','initial flow-front behaviour','fill profile and local impingement','material viscosity/thermal condition'],avoid:'Do not change several fill variables at once; confirm the flow mechanism.'},
    {name:'Delamination',evidence:'Layer-like separation or flaking surface.',check:['material compatibility/contamination','masterbatch or additive compatibility','moisture/volatile history','excessive shear or degraded material evidence'],avoid:'Do not regrind suspect mixed material back into production until identity is controlled.'},
    {name:'Black specks',evidence:'Dark inclusions or degraded particles.',check:['purge history and dead spots','residence/thermal history','contamination routes','screw/barrel/nozzle/hot-runner condition'],avoid:'Do not simply increase temperature to clear degraded material.'},
    {name:'Voids / internal bubbles',evidence:'Internal cavities not open to the surface.',check:['section thickness and solidification pattern','packing effectiveness before gate seal','material volatiles/moisture evidence','part sectioning or non-destructive evidence'],avoid:'Do not confuse vacuum voids with gas bubbles without examining the mechanism.'},
    {name:'Gloss variation',evidence:'Uneven surface reflectivity across the part or between shots.',check:['mould surface and contamination','local mould temperature','flow-front speed/pressure at the surface','material/additive/colour consistency'],avoid:'Cosmetic variation can be local even when machine settings are global.'},
    {name:'Stringing / drool',evidence:'Material strings or leaks from nozzle/gate between cycles.',check:['nozzle/hot-runner thermal condition','material viscosity and degradation','decompression strategy if applicable','gate/nozzle shutoff condition'],avoid:'Do not compensate indefinitely for a leaking mechanical shutoff with process changes.'},
    {name:'Ejection marks / sticking',evidence:'Scuffing, whitening, pin marks, drag or difficult release.',check:['draft and texture','local cooling/part rigidity','ejector condition and alignment','packing level and release geometry'],avoid:'Robot force is not a substitute for safe, reliable part release.'},
    {name:'Flow marks',evidence:'Visible bands, halos or surface changes associated with flow-front history.',check:['location relative to gate/geometry changes','local mould surface temperature','fill-front speed changes','material thermal state'],avoid:'Do not classify every cosmetic band as the same mechanism.'},
    {name:'Record grooves / tiger stripes',evidence:'Alternating gloss or flow bands, often seen in some filled or elastomeric systems.',check:['material formulation','flow-front stability','wall thickness and gate geometry','fill profile evidence'],avoid:'Confirm the material/flow mechanism before making broad thermal changes.'},
    {name:'Gate blush',evidence:'Local whitening, haze or stress appearance around the gate.',check:['gate geometry and entry direction','local shear/velocity','material stress sensitivity','gate vestige and ejection interaction'],avoid:'Do not assume mould temperature alone controls a gate-local defect.'},
    {name:'Cold slug mark',evidence:'Comet-like or irregular mark linked to cooler material entering the cavity.',check:['nozzle condition','sprue/cold-slug provision','startup/purge sequence','hot-runner or nozzle thermal uniformity'],avoid:'Separate cold-material evidence from moisture or contamination streaks.'},
    {name:'Diesel cracking / vent erosion',evidence:'Tool damage or surface deterioration near repeated trapped-gas combustion zones.',check:['vent depth/condition to approved tool standard','end-of-fill location','gas generation/contamination','local fill-front compression'],avoid:'Do not keep producing through progressive tool damage.'},
    {name:'Dimensional drift',evidence:'Measured dimensions move over time while parts may still look acceptable.',check:['mould thermal balance','material lot/conditioning','packing and part-mass trends','measurement system and conditioning time'],avoid:'Never adjust a process from a single unverified measurement.'}
  ],
  signals:[
    {name:'Fill time',meaning:'Time required for the controlled filling phase.',use:'Trend repeatability and compare with pressure/transfer evidence.',drift:'A change can indicate viscosity, thermal, flow restriction, machine response or profile changes.'},
    {name:'Peak injection pressure',meaning:'Maximum pressure demand observed during filling.',use:'Compare pressure demand at similar fill conditions.',drift:'Higher demand can reflect colder/more viscous material, restriction, venting effects or changed flow rate.'},
    {name:'Transfer position',meaning:'Screw position at velocity-to-pressure transfer.',use:'Track shot delivery and consistency of the filled volume at transfer.',drift:'Movement can indicate delivery variation, check-ring behaviour or changed material compressibility.'},
    {name:'Cushion',meaning:'Material/screw position remaining after packing.',use:'Trend with part mass, transfer and pressure.',drift:'Variation can reveal unstable shot delivery or non-return-valve behaviour.'},
    {name:'Recovery time',meaning:'Time required to plasticise/meter the next shot.',use:'Trend feed, plasticising and cooling overlap.',drift:'Changes can point to feed, material, screw speed, back pressure or thermal condition.'},
    {name:'Screw recovery position',meaning:'Metered shot position before injection.',use:'Confirm shot-size repeatability.',drift:'Unexpected variation should be investigated before compensating elsewhere.'},
    {name:'Melt temperature actual',meaning:'Measured melt temperature using an approved method.',use:'Validate thermal state rather than assuming barrel setpoints equal melt condition.',drift:'Can reflect residence, shear, heater performance or measurement method.'},
    {name:'Mould-surface temperature',meaning:'Temperature at relevant cavity/core surfaces.',use:'Check thermal balance and repeatability.',drift:'Can affect fill, surface, shrinkage, warpage, ejection and cycle stability.'},
    {name:'Cooling-water supply/return',meaning:'Thermal-fluid temperatures entering/leaving a circuit.',use:'Use with flow information to diagnose cooling-system changes.',drift:'Temperature alone does not prove adequate flow or correct circuit connection.'},
    {name:'Part mass',meaning:'Mass of a defined part/shot sample.',use:'Simple response for filling/packing consistency when measurement is controlled.',drift:'Can correlate with transfer, packing, leakage, cavity balance or material variation.'},
    {name:'Cycle phase times',meaning:'Fill, hold, cooling, recovery and mould-motion durations.',use:'Identify which phase changed when total cycle time moves.',drift:'A stable total can still hide compensating phase changes.'},
    {name:'Clamp force actual',meaning:'Measured/estimated force used to keep the mould closed.',use:'Compare with validated mould/process requirements.',drift:'Must not be treated as a substitute for fixing flash-causing tooling damage.'},
    {name:'Cavity pressure',meaning:'Pressure measured inside the mould when cavity sensors are available.',use:'Connect machine events to local filling, transfer, packing and gate-seal behaviour.',drift:'Interpret by sensor location, calibration and the event being measured.'},
    {name:'Hydraulic / plastic pressure relationship',meaning:'Machine-specific relationship between hydraulic pressure and plastic pressure.',use:'Translate controller values only with the machine documentation and intensification ratio where applicable.',drift:'Never assume values transfer directly between different machine designs.'},
    {name:'Dryer dew point / air condition',meaning:'Condition of drying air for systems where it is relevant.',use:'Use alongside temperature, airflow, residence time and material moisture measurement.',drift:'A good displayed dew point alone does not prove dry resin at the hopper outlet.'},
    {name:'Reject pattern by cavity/time',meaning:'Where and when defects occur across cavities and production time.',use:'Separate local tooling causes from machine/material/system causes.',drift:'Patterns are often more diagnostic than the overall reject percentage.'},
    {name:'Injection velocity actual',meaning:'Measured screw/injection velocity during the fill profile.',use:'Confirm the machine follows the intended profile and compare across machines carefully.',drift:'Servo/hydraulic limits, pressure limitation or maintenance condition can prevent the commanded profile.'},
    {name:'Hold pressure actual',meaning:'Actual pressure response during packing/holding.',use:'Compare with cavity pressure, mass and gate-seal evidence.',drift:'Controller setpoint alone does not prove pressure was transmitted into the cavity.'},
    {name:'Screw torque / drive load',meaning:'Load required during screw recovery where the machine exposes it.',use:'Trend plasticising resistance and changes in feed/material behaviour.',drift:'Material condition, screw wear, feed restriction or temperature can change load.'},
    {name:'Mould-open / eject time',meaning:'Time spent in opening, ejection and closing motion.',use:'Separate mechanical handling losses from polymer cooling time.',drift:'Can reveal sticking, robot delays, lubrication issues or motion-profile changes.'},
    {name:'Hot-runner zone actuals',meaning:'Measured zone temperatures and controller output for a hot-runner system.',use:'Compare zones and trend heater/control abnormalities.',drift:'A displayed temperature may remain near setpoint while heater output or material residence indicates a fault.'},
    {name:'Cooling-circuit flow',meaning:'Measured coolant flow where instrumentation exists.',use:'Pair with supply/return temperature and circuit identification.',drift:'Blocked, reversed, air-locked or misconnected circuits can change thermal balance.'}
  ],
  tooling:[
    {name:'Gate',purpose:'Controls entry of melt into the cavity and strongly influences local shear, freeze-off and vestige.',inspect:['damage/wear','location and cross-section','gate balance between cavities','evidence of freeze or drool'],remember:'Gate behaviour is local; global process changes can hide a tooling problem.'},
    {name:'Runner system',purpose:'Carries melt from sprue/nozzle to one or more gates.',inspect:['branch balance','diameter transitions','cold-slug locations','hot-runner temperature consistency where applicable'],remember:'Unequal pressure loss can create cavity imbalance even with a stable machine.'},
    {name:'Vent',purpose:'Provides controlled escape for displaced air and process gases.',inspect:['end-of-fill location','contamination or blockage','damage/erosion','approved depth and land condition'],remember:'Vent dimensions are material/tool specific—use the approved tool standard rather than generic numbers.'},
    {name:'Parting line',purpose:'Interface between mould halves or components.',inspect:['damage','contamination','support/seating','flash pattern'],remember:'Local flash at a damaged parting line should not be solved by escalating clamp force.'},
    {name:'Ejector pins',purpose:'Apply controlled force to release the moulded part.',inspect:['alignment','wear/bending','marking pattern','return condition'],remember:'Ejection problems often combine part rigidity, draft, texture and tooling condition.'},
    {name:'Sleeve / blade ejector',purpose:'Provides ejection in geometries where standard pins are unsuitable.',inspect:['wear','alignment','lubrication policy','witness marks'],remember:'Thin ejector elements are vulnerable to damage and must be maintained to toolmaker specifications.'},
    {name:'Lifter',purpose:'Releases undercuts while contributing to part ejection.',inspect:['timing','wear/galling','angle and travel','part witness marks'],remember:'A sticking lifter can look like a process or robot problem.'},
    {name:'Slider / side action',purpose:'Forms side features and retracts before ejection.',inspect:['locking','timing','wear','lubrication and debris'],remember:'Interlocks and machine sequence must never be bypassed to compensate for a sticking side action.'},
    {name:'Core pin',purpose:'Forms internal holes or narrow features and conducts heat locally.',inspect:['bending','wear','cooling where fitted','flash or mismatch'],remember:'Thin cores can deflect under pressure and may create dimensional or concentricity problems.'},
    {name:'Cooling channel',purpose:'Removes heat from the mould and shapes the thermal field.',inspect:['circuit identification','flow','scale/blockage','supply/return connection'],remember:'Balanced temperature requires both suitable coolant condition and actual flow.'},
    {name:'Baffle / bubbler',purpose:'Directs coolant into narrow or deep tool regions.',inspect:['orientation','seal condition','flow restriction','corrosion/scale'],remember:'Incorrect assembly can reverse or severely reduce intended cooling.'},
    {name:'Sprue bushing',purpose:'Connects the machine nozzle to a cold-runner mould.',inspect:['nozzle seat','surface damage','pull/release condition','cold slug behaviour'],remember:'Poor nozzle-to-sprue contact can leak, drool or create unstable material entry.'},
    {name:'Hot-runner manifold',purpose:'Distributes molten polymer through heated channels.',inspect:['zone balance','leak evidence','heater/thermocouple behaviour','residence and dead spots'],remember:'A temperature reading alone does not prove melt condition everywhere in the manifold.'},
    {name:'Valve gate',purpose:'Mechanically opens/closes a hot-runner gate to control flow timing and vestige.',inspect:['pin timing','stroke','wear','actuation consistency'],remember:'Timing imbalance can create fill or weld-line differences between cavities.'},
    {name:'Mould support / pillars',purpose:'Resists deflection of mould plates under clamping and cavity pressure.',inspect:['damage','contact condition','plate deflection evidence','fastener condition'],remember:'Structural deflection can cause flash or dimensional variation even if nominal clamp force is adequate.'},
    {name:'Texture / surface finish',purpose:'Creates appearance, function or release characteristics.',inspect:['direction relative to draw','damage/polish','contamination','required draft'],remember:'A texture change can alter demoulding force and cosmetic response.'}
  ],
  machine:[
    {name:'Injection screw',role:'Plasticises, meters and injects polymer.',watch:['wear','material compatibility','recovery consistency','screw design relative to resin'],evidence:'Recovery time, shot repeatability, torque/load and melt quality.'},
    {name:'Barrel',role:'Contains the screw and heated polymer.',watch:['wear','heater condition','contamination/dead spots','residence volume'],evidence:'Melt condition, pressure capability, purge behaviour and dimensional wear records.'},
    {name:'Non-return valve / check ring',role:'Limits reverse flow during injection.',watch:['wear','contamination','repeatability','material-sensitive behaviour'],evidence:'Cushion, transfer position, part mass and pressure repeatability.'},
    {name:'Nozzle',role:'Connects injection unit to sprue or hot-runner inlet.',watch:['seat contact','leakage','heater/thermocouple','freeze/drool'],evidence:'Nozzle leakage, cold slugs, pressure loss and thermal readings.'},
    {name:'Hopper / feed throat',role:'Feeds pellets into the plasticising unit.',watch:['bridging','feed-throat cooling','contamination','material segregation'],evidence:'Recovery stability, feed interruptions and material condition.'},
    {name:'Heater zones',role:'Provide controlled barrel/nozzle heat.',watch:['heater output','thermocouple placement/failure','overshoot','zone interaction'],evidence:'Actual temperatures, controller output and measured melt temperature.'},
    {name:'Injection drive',role:'Moves the screw forward under velocity/pressure control.',watch:['pressure limitation','servo/hydraulic performance','maintenance condition','profile tracking'],evidence:'Velocity actuals, pressure actuals and fill-time repeatability.'},
    {name:'Screw-rotation drive',role:'Rotates the screw for plasticising/recovery.',watch:['torque/load','speed actual','oil/servo condition','mechanical wear'],evidence:'Recovery time, torque/load and shot preparation stability.'},
    {name:'Clamp unit',role:'Opens/closes the mould and resists cavity-opening force.',watch:['platen parallelism','tie-bar condition','force calibration','mould protection settings'],evidence:'Flash pattern, clamp-force actuals, mould movement and maintenance records.'},
    {name:'Mould protection / low-pressure close',role:'Detects obstruction before full clamp force.',watch:['approved setup','repeatability','sensor/position calibration','unauthorised bypass'],evidence:'Close profile and alarms; never defeat the safeguard to maintain production.'},
    {name:'Ejector system',role:'Drives mould ejector mechanism.',watch:['stroke','force/pressure','return confirmation','sequence interlocks'],evidence:'Ejection time, marks, sticking and sensor status.'},
    {name:'Core-pull circuit',role:'Actuates hydraulic/pneumatic/electric mould actions.',watch:['sequence','leaks','position confirmation','pressure/force'],evidence:'Cycle alarms, timing and actual position feedback.'},
    {name:'Machine controller',role:'Coordinates profiles, sequences, alarms and data acquisition.',watch:['recipe revision','units','permissions','software/configuration changes'],evidence:'Audit trail, setpoint vs actual trends and alarm history.'},
    {name:'Robot interface',role:'Coordinates machine and external automation safely.',watch:['handshake signals','safe states','sequence timing','guarding'],evidence:'I/O trace, robot alarms and safety-system status.'},
    {name:'Hydraulic system',role:'Provides controlled force/motion on hydraulic machines.',watch:['oil temperature','filter/contamination','leakage','pump/valve response'],evidence:'Pressure/velocity repeatability and maintenance data.'},
    {name:'All-electric servo system',role:'Uses servo drives for major machine axes.',watch:['drive alarms','position calibration','load/torque trends','mechanical transmission'],evidence:'Position/velocity/load traces and drive diagnostics.'}
  ],
  quality:[
    {name:'First-off approval',purpose:'Confirms startup parts meet defined requirements before routine production.',good:['defined sampling','approved measurement method','traceable material/tool/machine state','documented disposition'],risk:'A visual-only first-off can miss dimensional or functional drift.'},
    {name:'Control plan',purpose:'Defines what is controlled, measured, sampled and reacted to during production.',good:['clear characteristic ownership','reaction plan','measurement method','revision control'],risk:'A control plan that is not connected to actual process evidence becomes paperwork rather than control.'},
    {name:'Measurement system analysis',purpose:'Checks whether the measurement process is adequate for the decision.',good:['repeatability/reproducibility considered','fixtures/method controlled','resolution suitable','operators trained'],risk:'Process capability is meaningless if measurement variation dominates.'},
    {name:'Cp / Cpk',purpose:'Summarises short-term potential/performance relative to specification under assumptions.',good:['stable process','adequate measurement','appropriate distribution/context','sufficient representative data'],risk:'A single Cpk value is not proof of validation or long-term control.'},
    {name:'Pp / Ppk',purpose:'Describes overall performance using observed variation over the sampled period.',good:['time period defined','data representative','special causes understood','measurement adequate'],risk:'High performance indices can hide sampling that excluded real operating variation.'},
    {name:'SPC chart',purpose:'Separates common-cause variation from signals of process change.',good:['correct chart type','rational subgrouping','reaction rules','data collected consistently'],risk:'Control limits are not product specification limits.'},
    {name:'DOE',purpose:'Tests factor effects/interactions using a planned experimental structure.',good:['clear response','randomisation/blocking as needed','interaction strategy','measurement suitable'],risk:'One-factor-at-a-time or uncontrolled trial-and-error is not a designed experiment.'},
    {name:'Process window study',purpose:'Establishes evidence about acceptable operation across selected factors.',good:['quality responses defined','machine actuals recorded','factor ranges justified','boundaries confirmed'],risk:'A copied machine recipe is not a validated process window.'},
    {name:'Cavity balance study',purpose:'Compares fill/pack response across cavities.',good:['individual cavity identification','controlled shot progression or sensor data','mass/dimension evidence','repeatability'],risk:'Combined shot mass can hide one heavy and one light cavity.'},
    {name:'Gate-seal study',purpose:'Identifies when additional hold time no longer meaningfully changes the selected response.',good:['controlled hold-time steps','part mass/dimension response','thermal condition stable','appropriate cooling/conditioning'],risk:'Plateau evidence is application-specific; it is not a universal hold-time formula.'},
    {name:'Short-shot study',purpose:'Reveals filling pattern and cavity balance.',good:['safe approved procedure','incremental controlled shots','cavity mapping','photographic/weight evidence'],risk:'Never defeat guards or interlocks to observe filling.'},
    {name:'Process audit trail',purpose:'Records who changed what, when and why.',good:['recipe revision history','authorisation','reason for change','result/verification'],risk:'Unlogged adjustments destroy traceability and make troubleshooting much harder.'},
    {name:'Traceability',purpose:'Connects product to material, machine, mould, process and inspection evidence.',good:['lot/batch identity','time/cavity where required','recipe/revision','inspection record'],risk:'Traceability must match product risk and customer/regulatory requirements.'},
    {name:'Capability vs tolerance review',purpose:'Checks whether observed variation is compatible with engineering tolerance.',good:['datum/measurement method clear','distribution/stability reviewed','cavity/time effects separated','customer criteria used'],risk:'Do not tighten process controls around an unverified drawing or measurement method.'}
  ],
  safety:[
    {name:'Guard/interlock status',check:'All required guards and interlocks function as designed before production or troubleshooting.',why:'Access to clamp, ejector, screw, robot or other hazardous motion can cause severe injury.',never:'Never bypass, tape, defeat or code around a safeguard to maintain output.'},
    {name:'Isolation / lockout',check:'Use the site-approved hazardous-energy isolation procedure before entering or servicing hazardous zones.',why:'Stored hydraulic, pneumatic, electrical, thermal and gravitational energy may remain after stop.',never:'A stop button or open guard is not automatically an energy-isolation procedure.'},
    {name:'Hot surfaces / molten polymer',check:'Treat nozzle, barrel, hot runner, purge material and recently ejected parts as potential burn hazards.',why:'Molten polymer can eject unexpectedly and remains hot after appearance changes.',never:'Do not stand in line with purge/nozzle discharge or handle hot purge without approved controls.'},
    {name:'High-pressure polymer',check:'Follow machine/tool procedures before opening any pressurised melt path.',why:'Trapped melt pressure can release suddenly from nozzle, hot runner or blocked passages.',never:'Do not loosen a nozzle, heater band or hot-runner component to relieve pressure casually.'},
    {name:'Mould movement',check:'Confirm safe state before work between platens or around moving mould actions.',why:'Clamp and core-pull systems can generate crushing forces.',never:'Never rely on software state alone where formal mechanical/energy isolation is required.'},
    {name:'Robot / automation cell',check:'Treat machine, robot, conveyor and auxiliaries as one integrated safety system.',why:'Unexpected restart or independent axis motion can occur during fault recovery.',never:'Do not cross guarding because one device appears stopped.'},
    {name:'Purge and material change',check:'Use the resin supplier and site-approved purge/changeover procedure.',why:'Some polymers are chemically incompatible or can decompose dangerously when mixed/overheated.',never:'Do not improvise high-temperature purging for an unknown or incompatible material combination.'},
    {name:'Compressed air',check:'Use only approved methods for cleaning/cooling and protect against projected particles.',why:'Compressed air can inject debris, spread contamination or create flying particles.',never:'Do not use compressed air on skin or as an informal personal-cleaning method.'},
    {name:'Lifting moulds',check:'Use rated lifting points, lifting equipment and site procedures.',why:'Moulds are heavy, concentrated loads with severe crush potential.',never:'Do not assume eyebolts, straps or fork positions are suitable without rating/inspection.'},
    {name:'Chemical handling',check:'Follow SDS/site requirements for cleaners, release agents, additives and maintenance chemicals.',why:'Flammability, inhalation, skin and compatibility risks vary by product.',never:'Do not mix chemicals or use unlabelled containers.'},
    {name:'Granulator / regrind equipment',check:'Guard and isolate size-reduction equipment before clearing jams or maintenance.',why:'Rotating blades and stored inertia create severe hazards.',never:'Do not reach through feed openings or defeat interlocks.'},
    {name:'Fume / decomposition response',check:'Stop and follow emergency/site ventilation procedures if unusual smoke, odour or decomposition is suspected.',why:'Overheated polymers can release hazardous decomposition products.',never:'Do not lean over a hopper/nozzle to identify fumes by smell.'}
  ],
  troubleshooting:[
    {name:'Only one cavity changes',pattern:'One cavity becomes light, flashed, short or dimensionally different while others remain stable.',first:['inspect the affected branch/gate/vent/cooling/ejection','compare cavity-specific mass/pressure/appearance','check recent local tool work'],avoid:'Global machine changes before ruling out local tooling causes.'},
    {name:'All cavities change together',pattern:'Every cavity shifts at roughly the same time.',first:['check material lot/condition','machine actuals and thermal state','common hot-runner/cooling supply','recent recipe or machine change'],avoid:'Starting with one cavity-specific tool adjustment.'},
    {name:'Drift after water-line work',pattern:'Dimensions, cycle or release changes immediately after hoses/circuits were disturbed.',first:['verify circuit identity and connection','confirm actual flow and supply/return temperatures','compare mould-surface temperature'],avoid:'Changing pack/fill settings before checking the changed thermal system.'},
    {name:'Fill time rises slowly',pattern:'Saved recipe is constant but fill time/pressure demand drifts over time.',first:['compare actual melt/mould thermal conditions','material handling and lot','injection velocity actual','flow restriction/venting'],avoid:'Forcing fill time back with speed before finding why actual response changed.'},
    {name:'Cushion and part mass vary together',pattern:'Shot delivery evidence and product mass move together.',first:['check non-return valve consistency','recovery/feed stability','transfer position','material feed condition'],avoid:'Using more hold pressure to mask unstable shot delivery.'},
    {name:'Recovery becomes erratic',pattern:'Recovery time or screw load becomes unstable while cooling time is unchanged.',first:['material feed/bridging','dryer/hopper condition','screw/back-pressure actuals','temperature and drive load'],avoid:'Changing mould cooling to solve a plasticising problem.'},
    {name:'Burn at end of fill',pattern:'Dark/burned defect repeatedly appears at the last filling region.',first:['confirm fill-front location','inspect approved vent condition','check trapped-gas route','review local fill-front speed'],avoid:'Assuming polymer degradation without examining gas escape.'},
    {name:'Flash after tool maintenance',pattern:'Local flash begins immediately after mould work.',first:['parting-line/shutoff seating','insert/slide assembly','debris or damage','mould support/contact'],avoid:'Increasing clamp force before checking assembly.'},
    {name:'Sticking after texture change',pattern:'Ejection force/marks rise after surface texture or polish modification.',first:['draft vs texture direction','local cooling/part rigidity','ejector balance','surface condition'],avoid:'Increasing robot pull force as the primary solution.'},
    {name:'Splay after humid exposure',pattern:'Streaks appear after material was exposed or handling changed.',first:['verify grade moisture requirement','dryer operation','material exposure/history','approved moisture test'],avoid:'Changing injection settings before checking material condition.'},
    {name:'Black specks after long stop',pattern:'Dark contamination appears after restart or extended residence.',first:['review shutdown/startup/purge procedure','residence and hot spots','nozzle/hot-runner dead spots','contamination sources'],avoid:'Raising temperatures indiscriminately.'},
    {name:'Dimension changes by shift',pattern:'Measurements differ between operators/shifts more than expected.',first:['measurement method/fixture','conditioning time','machine warm-up state','material and environmental differences'],avoid:'Calling it process drift before checking the measurement system.'},
    {name:'Cycle time increases but fill is stable',pattern:'Total cycle rises while filling evidence remains repeatable.',first:['split total cycle into cooling/recovery/mould/robot phases','inspect sticking/ejection','check recovery overlap and auxiliary delays'],avoid:'Optimising injection speed when the lost time is elsewhere.'},
    {name:'Pressure spikes with similar fill time',pattern:'Peak pressure becomes erratic although fill time remains near target.',first:['flow restriction or gate condition','check-ring events','velocity profile actual','sensor/controller event timing'],avoid:'Judging process stability from fill time alone.'},
    {name:'Hot-runner cavity imbalance',pattern:'A group of cavities associated with one manifold branch changes together.',first:['zone actual/output','valve-gate timing if fitted','branch leak/restriction evidence','cavity-specific mass/pressure'],avoid:'Treating grouped cavities as random rejects.'},
    {name:'Weld line moved',pattern:'Weld/knit location shifts from the validated position.',first:['fill balance and gate timing','venting','material thermal condition','cavity/runner restriction'],avoid:'Assessing only appearance; location can alter structural performance.'},
    {name:'Part mass plateaus during hold study',pattern:'Increasing hold time no longer changes mass under stable conditions.',first:['confirm repeatability and cooling','correlate dimensions/pressure if relevant','document gate-seal evidence'],avoid:'Assuming more hold time always adds useful packing.'},
    {name:'Dryer display looks normal but splay persists',pattern:'Dryer temperature/dew-point display is normal, yet moisture symptoms remain.',first:['measure material moisture with approved method','check airflow and residence','look for leaks/bypass','inspect post-dryer exposure'],avoid:'Treating one dryer display value as proof of dry material.'},
    {name:'New material lot changes pressure',pattern:'Pressure/fill response changes at a documented material-lot change.',first:['confirm exact grade/lot','compare supplier COA where available','check moisture/conditioning','run controlled process comparison'],avoid:'Automatically editing the master recipe without evidence and approval.'},
    {name:'Rejects cluster after startup',pattern:'Quality is poor for early cycles then stabilises.',first:['mould and melt thermal stabilisation','purge/material transition','hot-runner balance','startup procedure compliance'],avoid:'Building permanent settings around a transient startup condition.'}
  ],
  glossary:[
    ['Back pressure','Resistance applied during screw recovery to influence plasticising and melt preparation.'],
    ['Cavity balance','Similarity of filling/packing response between cavities in a multi-cavity mould.'],
    ['Cavity pressure','Pressure measured within the mould cavity using a suitable sensor.'],
    ['Check ring / non-return valve','Screw-tip device intended to limit reverse melt flow during injection.'],
    ['Clamp force','Force keeping mould halves closed against cavity pressure.'],
    ['Cooling time','Defined cycle interval allocated to solidification before opening/ejection.'],
    ['Cushion','Screw position/material reserve remaining after the packing phase.'],
    ['Decompression','Controlled screw movement used on some processes to reduce nozzle pressure after recovery.'],
    ['DOE','Design of experiments: structured method for estimating factor effects and interactions.'],
    ['Draft','Taper that assists release of a moulded feature from the tool.'],
    ['Fill time','Elapsed time for the controlled cavity-filling phase.'],
    ['Fountain flow','Typical advancing flow pattern where material near the centre moves forward and turns toward the mould wall.'],
    ['Gate freeze / gate seal','Point at which useful pressure transmission through the gate has effectively stopped.'],
    ['Hold / pack','Pressure-controlled phase used after transfer to compensate shrinkage while pressure can still be transmitted.'],
    ['Hot runner','Heated runner system intended to keep polymer molten between machine nozzle and gate.'],
    ['MFR / MVR','Standardised melt-flow test results measured under specified conditions; not a complete moulding rheology curve.'],
    ['Mould shrinkage','Dimensional reduction from mould dimensions to the conditioned moulded part, dependent on material/process/geometry.'],
    ['Orientation','Directional arrangement of polymer chains or fibres created by flow and deformation.'],
    ['Parting line','Interface where mould halves or components separate.'],
    ['Plastic pressure','Pressure on the polymer side of the injection unit; machine conversion from hydraulic values is machine-specific.'],
    ['Residence time','Time material spends in the heated processing system; actual distribution is broader than one simple calculated value.'],
    ['Regrind','Previously processed material mechanically reduced for possible controlled reuse.'],
    ['Shear rate','Rate of deformation in flowing material; strongly influences apparent viscosity of polymer melts.'],
    ['Shear thinning','Decrease in apparent viscosity as shear rate increases, typical of many thermoplastic melts.'],
    ['Shot size','Metered volume/position prepared for injection; controller representation is machine-specific.'],
    ['Sink mark','Local surface depression associated with differential volumetric shrinkage and insufficient local compensation.'],
    ['Transfer','Change from velocity-controlled filling to pressure-controlled packing/holding.'],
    ['Venting','Designed escape path for displaced air/gas from the mould cavity.'],
    ['Viscosity','Resistance to flow; polymer melt viscosity depends on shear rate, temperature, pressure and material history.'],
    ['Warpage','Departure of a moulded part from intended shape due to non-uniform shrinkage, orientation, stress or thermal history.'],
    ['Weld / knit line','Region formed where two advancing flow fronts meet.'],
    ['Amorphous polymer','Polymer morphology without long-range crystalline order; moulding shrinkage and optical behaviour often differ from semi-crystalline materials.'],
    ['Semi-crystalline polymer','Polymer that forms ordered crystalline regions as it cools; cooling history can strongly affect shrinkage and properties.'],
    ['Anisotropy','Properties or dimensions that differ with direction, often due to flow orientation or fibre reinforcement.'],
    ['Cavity-to-cavity variation','Differences between cavities caused by local flow, cooling, tooling or sensor conditions.'],
    ['Intensification ratio','Machine-specific relationship used on some hydraulic machines to relate hydraulic and plastic pressure.'],
    ['Rational subgroup','SPC grouping chosen so within-group variation represents short-term/common conditions.'],
    ['Special cause','Variation signal associated with a specific change or event rather than routine common-cause variation.'],
    ['Common cause','Background variation inherent in the current process system.'],
    ['Thermal balance','Distribution and stability of heat removal/addition throughout mould and material system.'],
    ['Tool-safe / mould protection','Controlled low-force/low-pressure closing strategy intended to detect obstruction before full clamp force.'],
    ['Valve gate','Actuated hot-runner gate pin used to control gate opening/closing and flow timing.'],
    ['Cold slug','Relatively cool polymer portion that may enter the runner/cavity and create a visible or flow disturbance.'],
    ['Conditioning','Defined post-mould environmental exposure before measurement or use, important for some polymers such as polyamides.'],
    ['COA','Certificate of Analysis: supplier lot-level test/identity information where provided.'],
    ['Reaction plan','Predefined response when a process or quality control detects an out-of-control/out-of-specification condition.']
  ]
};

window.MM_REFERENCE_DATA=DATA;

function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));}
function textOf(v){if(Array.isArray(v))return v.map(textOf).join(' ');if(v&&typeof v==='object')return Object.values(v).map(textOf).join(' ');return String(v??'');}
function searchable(item){return textOf(item).toLowerCase();}
function list(items){return `<ul>${(items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;}
function ensureUI(){
  if(!document.body||document.getElementById('mmrd-open'))return;
  const style=document.createElement('style');
  style.textContent=`
  #mmrd-open{position:fixed;left:14px;bottom:14px;z-index:2147483000;border:1px solid #41658d;background:#10233d;color:#eef7ff;border-radius:999px;padding:10px 14px;font:700 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer}
  #mmrd-open:focus-visible,.mmrd button:focus-visible,.mmrd input:focus-visible{outline:3px solid #72e6cd;outline-offset:2px}
  .mmrd{position:fixed;inset:0;z-index:2147483001;background:rgba(2,8,18,.84);display:none;align-items:center;justify-content:center;padding:14px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#eef7ff}
  .mmrd[data-open="1"]{display:flex}.mmrd-panel{width:min(1100px,100%);max-height:min(90vh,940px);overflow:hidden;background:#0e1a2c;border:1px solid #304866;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.55);display:flex;flex-direction:column}
  .mmrd-head{padding:18px 18px 12px;border-bottom:1px solid #253a54}.mmrd-title{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}.mmrd-title h2{margin:0;font-size:22px}.mmrd-title p{margin:5px 0 0;color:#a9bdd6;font-size:13px;line-height:1.45}.mmrd-close{border:1px solid #49627e;background:#172941;color:#fff;border-radius:9px;padding:8px 11px;cursor:pointer}
  .mmrd-tools{display:grid;grid-template-columns:minmax(180px,1fr);gap:10px;margin-top:13px}.mmrd-search{width:100%;border:1px solid #3a5471;background:#081423;color:#fff;border-radius:10px;padding:10px 12px}.mmrd-tabs{display:flex;gap:6px;flex-wrap:wrap}.mmrd-tabs button{border:1px solid #3a5471;background:#13243a;color:#dceaff;border-radius:9px;padding:8px 10px;cursor:pointer}.mmrd-tabs button[aria-selected="true"]{background:#1f4d58;border-color:#55d6be;color:#fff}
  .mmrd-body{overflow:auto;padding:14px 18px 20px}.mmrd-count{font-size:12px;color:#9fb5cf;margin:0 0 10px}.mmrd-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}.mmrd-card{border:1px solid #2b405b;background:#111f32;border-radius:12px;padding:13px}.mmrd-card h3{font-size:15px;margin:0 0 7px}.mmrd-card p{margin:5px 0;color:#c8d7e8;font-size:13px;line-height:1.45}.mmrd-card b{color:#fff}.mmrd-card ul{margin:5px 0 0;padding-left:18px;color:#c8d7e8;font-size:13px;line-height:1.45}.mmrd-note{margin:0 0 12px;padding:10px 12px;border-left:3px solid #55d6be;background:#10283a;color:#dcebf7;font-size:12px;line-height:1.5}.mmrd-empty{padding:24px;text-align:center;color:#9fb5cf}
  @media(max-width:650px){.mmrd{padding:0}.mmrd-panel{height:100%;max-height:none;border-radius:0;border:0}.mmrd-head{padding-top:max(14px,env(safe-area-inset-top))}.mmrd-body{padding-bottom:max(18px,env(safe-area-inset-bottom))}.mmrd-tabs{overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}.mmrd-tabs button{white-space:nowrap}}
  @media(prefers-reduced-motion:reduce){.mmrd *{scroll-behavior:auto!important}}
  `;
  document.head.appendChild(style);

  const open=document.createElement('button');
  open.id='mmrd-open';open.type='button';open.textContent='Reference Data';open.setAttribute('aria-haspopup','dialog');
  const modal=document.createElement('div');
  modal.className='mmrd';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','MouldMaster reference data');modal.dataset.open='0';
  modal.innerHTML=`<section class="mmrd-panel"><div class="mmrd-head"><div class="mmrd-title"><div><h2>Reference Data</h2><p>Search materials, defects, process signals, tooling, machines, quality, safety and troubleshooting.</p></div><button class="mmrd-close" type="button" aria-label="Close reference data">Close</button></div><div class="mmrd-tools"><input class="mmrd-search" type="search" placeholder="Search reference data…" aria-label="Search reference data"><div class="mmrd-tabs" role="tablist"></div></div></div><div class="mmrd-body"><p class="mmrd-note">${esc(DATA.note)}</p><p class="mmrd-count"></p><div class="mmrd-grid"></div></div></section>`;
  document.body.append(open,modal);

  const tabs=[['materials','Materials'],['defects','Defects'],['signals','Process signals'],['tooling','Tooling'],['machine','Machine'],['quality','Quality'],['safety','Safety'],['troubleshooting','Troubleshooting'],['glossary','Glossary']];
  let active='materials';
  const tabsBox=modal.querySelector('.mmrd-tabs'),search=modal.querySelector('.mmrd-search'),grid=modal.querySelector('.mmrd-grid'),count=modal.querySelector('.mmrd-count');
  for(const [key,label] of tabs){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.key=key;b.setAttribute('role','tab');b.addEventListener('click',()=>{active=key;for(const x of tabsBox.children)x.setAttribute('aria-selected',String(x===b));render();});tabsBox.appendChild(b)}
  tabsBox.firstElementChild.setAttribute('aria-selected','true');

  function card(item){
    if(active==='materials')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p><b>Family:</b> ${esc(item.family)}</p><p><b>Traits:</b> ${esc(item.traits.join(', '))}</p><p><b>Watch:</b></p>${list(item.watch)}<p><b>Verify:</b> ${esc(item.verify)}</p></article>`;
    if(active==='defects')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p>${esc(item.evidence)}</p><p><b>Check:</b></p>${list(item.check)}<p><b>Avoid:</b> ${esc(item.avoid)}</p></article>`;
    if(active==='signals')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p><b>Meaning:</b> ${esc(item.meaning)}</p><p><b>Use:</b> ${esc(item.use)}</p><p><b>Drift:</b> ${esc(item.drift)}</p></article>`;
    if(active==='tooling')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p><b>Purpose:</b> ${esc(item.purpose)}</p><p><b>Inspect:</b></p>${list(item.inspect)}<p><b>Remember:</b> ${esc(item.remember)}</p></article>`;
    if(active==='machine')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p><b>Role:</b> ${esc(item.role)}</p><p><b>Watch:</b></p>${list(item.watch)}<p><b>Evidence:</b> ${esc(item.evidence)}</p></article>`;
    if(active==='quality')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p><b>Purpose:</b> ${esc(item.purpose)}</p><p><b>Good evidence:</b></p>${list(item.good)}<p><b>Risk:</b> ${esc(item.risk)}</p></article>`;
    if(active==='safety')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p><b>Check:</b> ${esc(item.check)}</p><p><b>Why:</b> ${esc(item.why)}</p><p><b>Never:</b> ${esc(item.never)}</p></article>`;
    if(active==='troubleshooting')return `<article class="mmrd-card"><h3>${esc(item.name)}</h3><p>${esc(item.pattern)}</p><p><b>Check first:</b></p>${list(item.first)}<p><b>Avoid:</b> ${esc(item.avoid)}</p></article>`;
    return `<article class="mmrd-card"><h3>${esc(item[0])}</h3><p>${esc(item[1])}</p></article>`;
  }
  function render(){
    const q=search.value.trim().toLowerCase();
    const all=DATA[active];
    const rows=all.filter(item=>!q||searchable(item).includes(q));
    count.textContent=`${rows.length} of ${all.length} ${tabs.find(x=>x[0]===active)[1].toLowerCase()}`;
    grid.innerHTML=rows.length?rows.map(card).join(''):'<div class="mmrd-empty">No matching reference data.</div>';
  }
  search.addEventListener('input',render);
  const close=()=>{modal.dataset.open='0';open.focus();};
  open.addEventListener('click',()=>{modal.dataset.open='1';render();setTimeout(()=>search.focus(),0)});
  modal.querySelector('.mmrd-close').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.dataset.open==='1')close()});
  render();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUI,{once:true});else ensureUI();
})();
/* <<< reference-data.js */

/* >>> reference-deep-dive.js */
/* MouldMaster deep-dive reference expansion — researched 2026-08-24 */
(function(){
'use strict';
const D=window.MM_REFERENCE_DATA;
const S=window.MM_SOURCE_LIBRARY;
if(!D||!S)throw new Error('MouldMaster reference base must load before deep-dive data');
const add=(key,rows)=>{D[key]=[...(D[key]||[]),...rows]};
const sources=(key,rows)=>{S[key]=[...(S[key]||[]),...rows]};

add('materials',[
 {name:'PVC-U / rigid PVC',family:'Amorphous vinyl thermoplastic',traits:['rigid','chemical resistant in many environments','widely compounded'],watch:['thermal stability is formulation-sensitive','processing history and residence matter','stabiliser, filler and impact-modifier package can change behaviour'],verify:'Exact compound, stabiliser system, application restrictions and supplier processing guidance.'},
 {name:'PVC-P / flexible PVC',family:'Plasticised vinyl thermoplastic',traits:['flexible','wide hardness range','properties strongly formulation-dependent'],watch:['plasticiser/additive package controls behaviour','thermal history can affect colour and volatiles','material compatibility must be checked for the intended application'],verify:'Exact compound formulation, regulatory/contact requirements and supplier processing limits.'},
 {name:'PA12',family:'Semi-crystalline polyamide',traits:['lower moisture uptake than PA6/PA66','good toughness','chemical resistance in many applications'],watch:['still requires grade-specific moisture control','conditioning changes dimensions/properties','reinforcement increases anisotropy'],verify:'Exact grade, moisture specification, reinforcement and post-mould conditioning requirement.'},
 {name:'PPA',family:'High-temperature semi-crystalline polyamide',traits:['high stiffness at elevated temperature','reinforced grades common','good dimensional capability when controlled'],watch:['moisture-sensitive processing','high glass loading can increase wear and directional shrinkage','thermal capability depends on exact chemistry'],verify:'Supplier drying/moisture target, glass/mineral content and validated thermal process window.'},
 {name:'PA46',family:'High-temperature semi-crystalline polyamide',traits:['fast crystallisation','high heat resistance','reinforced electrical/electronic uses common'],watch:['moisture before processing can damage polymer','rapid crystallisation changes mould-temperature sensitivity','glass-filled grades can warp directionally'],verify:'Grade-specific moisture, mould temperature, reinforcement and dimensional guidance.'},
 {name:'PC/PBT',family:'Engineering polymer blend',traits:['balance of impact, chemical resistance and dimensional behaviour','automotive/electrical applications common'],watch:['blend grade strongly controls properties','moisture handling is important','phase balance means one family-level recipe is inappropriate'],verify:'Exact supplier grade, drying, impact/chemical requirement and certification status.'},
 {name:'PPSU / PSU / PESU',family:'High-temperature amorphous sulfone polymers',traits:['high heat capability','tough grades available','hydrolysis/chemical performance depends on chemistry'],watch:['high processing temperatures demand capable equipment','moisture and residence can affect quality','stress/chemical compatibility is application-specific'],verify:'Exact polymer family/grade, drying, machine temperature capability and end-use qualification.'},
 {name:'PEI',family:'High-temperature amorphous engineering polymer',traits:['high heat resistance','stiff','transparent amber grades common'],watch:['requires high-temperature-capable equipment','moisture control may be specified','residual stress and chemical exposure can affect performance'],verify:'Supplier processing guide, moisture requirement, stress/chemical compatibility and product qualification.'},
 {name:'PVDF',family:'Semi-crystalline fluoropolymer',traits:['chemical resistance','weatherability','specialised electrical/fluid uses'],watch:['processing equipment/material compatibility matters','crystallinity affects dimensions/properties','supplier safety guidance must control purge and temperature limits'],verify:'Exact PVDF grade, application certification and processing-equipment compatibility.'},
 {name:'FEP / PFA',family:'Melt-processable fluoropolymers',traits:['very high chemical resistance','high-temperature service capability','low surface energy'],watch:['specialised high-temperature processing equipment may be required','decomposition hazards demand strict thermal control and ventilation','standard moulding assumptions may not transfer'],verify:'Supplier processing/safety documentation and equipment suitability before use.'},
 {name:'PLA',family:'Bio-based aliphatic polyester',traits:['bio-based feedstock commonly available','stiff grades common','industrial-compostability claims depend on exact product/certification'],watch:['hydrolysis/moisture can reduce molecular weight during processing','heat resistance varies widely by grade and crystallinity','bio-based does not automatically mean compostable or lower-impact'],verify:'Exact grade, moisture target, heat-treatment/crystallisation needs and certified environmental claims.'},
 {name:'PHA family',family:'Bio-derived polyester family',traits:['some grades are biodegradable under defined conditions','property range varies widely'],watch:['thermal stability and process window can be narrow','environmental claims require defined test/certification context','supplier formulation drives performance'],verify:'Exact polymer/compound, processing guide and independently supported environmental claim.'},
 {name:'EVA',family:'Ethylene-vinyl acetate copolymer',traits:['flexible','impact-modifying/soft applications common','properties vary strongly with vinyl-acetate content'],watch:['soft grades can feed differently','thermal sensitivity depends on grade/additives','adhesion/seal behaviour is formulation-specific'],verify:'VA content/grade, additives, application requirements and supplier process guidance.'},
 {name:'Ionomer',family:'Ionic copolymer',traits:['tough','good clarity in some grades','special sealing/impact applications'],watch:['ionic chemistry changes rheology and moisture response','grade selection is application-specific','contamination can strongly affect appearance'],verify:'Exact resin chemistry, supplier handling guidance and end-use requirements.'},
 {name:'Long-fibre thermoplastic (LFT)',family:'Fibre-reinforced thermoplastic composite',traits:['high stiffness/strength potential','long retained fibres improve structural response'],watch:['screw/gate geometry can shorten fibres','orientation strongly affects anisotropy','fibre length distribution changes with processing history'],verify:'Matrix, fibre type/content, retained-fibre expectations and validated mechanical test plan.'}
]);

add('defects',[
 {name:'Plate-out / deposit',evidence:'Residue accumulates on cavity, vent, gate or hot-runner surfaces and may transfer to parts.',check:['additive/masterbatch volatility','material degradation or contamination','venting and local temperature history','cleaning interval and deposit location'],avoid:'Do not treat every deposit as mould-release residue without material evidence.'},
 {name:'Hesitation mark',evidence:'Flow-front pause near a sudden thickness/branch change leaves a visible line or poor fill.',check:['wall-thickness transition','flow-front sequence','gate location and competing paths','local thermal state'],avoid:'Do not increase global speed before confirming the geometry-driven hesitation mechanism.'},
 {name:'Racetrack flow',evidence:'Flow preferentially follows a thicker or lower-resistance path and bypasses adjacent regions.',check:['thickness distribution','rib/boss network','gate location','short-shot pattern'],avoid:'A cosmetic weld-line fix may move another flow-related risk elsewhere.'},
 {name:'Overpacking',evidence:'Excessive local density/stress, difficult ejection, flash or dimensional shift is associated with continued pressure transmission.',check:['gate-seal evidence','part mass and dimensions','cavity pressure where available','ejection load and local geometry'],avoid:'Do not equate more hold pressure/time with better quality.'},
 {name:'Underpacking',evidence:'Local shrinkage, sink, voiding or low mass indicates insufficient useful pressure transmission before gate seal.',check:['gate effectiveness','transfer and hold actuals','part mass trend','section thickness and cooling'],avoid:'Do not assume hold pressure is the only limitation; gate or flow restriction may dominate.'},
 {name:'Stress whitening',evidence:'White or hazy stressed regions appear at clips, ejectors, gates or flexed features.',check:['local strain/ejection load','moulded-in stress','material toughness/conditioning','feature radius and assembly load'],avoid:'Appearance changes can indicate mechanical damage even when dimensions pass.'},
 {name:'Environmental stress cracking',evidence:'Cracking develops after exposure to chemicals, cleaners, oils or stressed assembly conditions.',check:['exact resin/chemical compatibility','residual/moulded-in stress','assembly strain','exposure temperature/time'],avoid:'Do not infer chemical compatibility from polymer family name alone.'},
 {name:'Gate cracking',evidence:'Cracks initiate at or near the gate after moulding, degating or service load.',check:['gate geometry/vestige','local orientation and residual stress','degating method','material notch sensitivity'],avoid:'Do not accept a hidden gate crack solely because initial cosmetics look acceptable.'},
 {name:'Fibre read-through',evidence:'Fibre pattern or waviness is visible on reinforced-part surfaces.',check:['skin-layer formation','mould surface temperature','fill-front behaviour','fibre length/content and surface requirement'],avoid:'Do not promise Class-A appearance from a structural filled grade without validation.'},
 {name:'Colour streaking',evidence:'Colour is non-uniform along flow paths or between cycles.',check:['masterbatch dispersion','feed mixing and dosing','purge/contamination history','thermal/shear history'],avoid:'Do not mask poor mixing with excessive back pressure without checking material limits.'},
 {name:'Brittle part after moulding',evidence:'Unexpected cracking or low impact performance occurs despite acceptable appearance.',check:['material identity and degradation','moisture/hydrolysis history','weld-line location','conditioning and test method'],avoid:'Visual acceptance is not proof of retained mechanical properties.'},
 {name:'Post-mould dimensional growth',evidence:'Dimensions change after ejection during conditioning, crystallisation, moisture uptake or stress relaxation.',check:['measurement time after moulding','material morphology','humidity/conditioning','annealing or secondary crystallisation'],avoid:'Do not compare dimensions measured at different conditioning states as if equivalent.'}
]);

add('signals',[
 {name:'Injection velocity actual',meaning:'Measured screw/ram velocity during the filling profile.',use:'Confirm the machine executed the commanded profile and identify pressure-limited or load-limited behaviour.',drift:'Commanded velocity can remain constant while actual velocity falls under a pressure/force limit.'},
 {name:'Pressure at transfer',meaning:'Injection/plastic pressure at the velocity-to-pressure transfer event.',use:'Trend filling resistance at a consistent transfer strategy.',drift:'Movement can reflect viscosity, restriction, machine response or transfer-position changes.'},
 {name:'Hold pressure actual',meaning:'Measured pressure response during packing/holding.',use:'Compare commanded and delivered packing behaviour with cavity/part response.',drift:'Machine limits, hydraulic/servo response or gate sealing can change delivered pressure effectiveness.'},
 {name:'Screw torque / drive load',meaning:'Load required to rotate the screw during plasticising.',use:'Trend material feeding, viscosity, back pressure and screw/barrel condition.',drift:'A rise can reflect feed changes, colder material, excessive back pressure or mechanical wear.'},
 {name:'Heater output / duty cycle',meaning:'Controller output required to maintain barrel/nozzle/hot-runner temperature.',use:'Identify abnormal heat loss, failed heaters, sensor issues or process shear contribution.',drift:'Equal temperature actuals with very different heater output can still signal a system change.'},
 {name:'Hot-runner zone actual/output',meaning:'Temperature and controller output for each manifold/nozzle zone.',use:'Compare grouped-cavity defects with branch/zone behaviour.',drift:'A temperature display alone may miss a failing heater, sensor placement issue or thermal short.'},
 {name:'Cooling-circuit flow',meaning:'Measured coolant flow through a defined mould circuit.',use:'Confirm a circuit is connected, open and hydraulically similar to the validated condition.',drift:'Equal supply temperature does not prove equal heat removal when flow changes.'},
 {name:'Temperature-control-unit pressure',meaning:'Supply/return pressure information from a mould temperature-control system.',use:'Support diagnosis of blocked, leaking or incorrectly connected circuits.',drift:'Pressure should be interpreted with flow and circuit layout rather than as a standalone quality metric.'},
 {name:'Energy per cycle',meaning:'Electrical or hydraulic energy associated with one production cycle when available.',use:'Trend machine/process efficiency and detect abnormal auxiliary/heating/load changes.',drift:'Energy variation can reveal thermal, mechanical or cycle-phase changes even when total cycle time is stable.'},
 {name:'Robot/handling cycle time',meaning:'Elapsed time for part removal and downstream handling.',use:'Separate automation delays from moulding-process delays.',drift:'A rising total cycle may come from handling rather than cooling or injection.'},
 {name:'Cavity-pressure peak/time-to-peak',meaning:'Peak cavity pressure and when it occurs relative to fill/transfer.',use:'Compare local cavity filling/packing behaviour across cavities and cycles.',drift:'Location and timing changes can indicate balance, gate, viscosity or transfer changes.'},
 {name:'Cavity-pressure integral',meaning:'Integrated pressure-over-time metric used by some monitoring systems.',use:'Summarise filling/packing energy-like response for correlation studies.',drift:'Useful only when sensor location, zeroing, sampling and validated correlation are controlled.'}
]);

add('tooling',[
 {name:'Sprue bushing',purpose:'Transfers melt from machine nozzle into the cold-runner or manifold system.',inspect:['nozzle seat/contact','bore damage or wear','cold-slug behaviour','alignment'],remember:'Poor nozzle/sprue alignment can create leakage, restriction and startup instability.'},
 {name:'Support pillars / support plate',purpose:'Resist mould deflection under clamp and cavity pressure.',inspect:['contact and preload condition','cracking/fretting','backing-plate deflection evidence','local flash pattern'],remember:'Apparent process flash can originate from structural mould deflection.'},
 {name:'Taper interlocks / side locks',purpose:'Improve repeatable alignment of mould halves or moving inserts.',inspect:['wear/fretting','lubrication per tool standard','seating marks','alignment after maintenance'],remember:'Alignment wear can create local flash, mismatch and insert damage.'},
 {name:'Slide / side action',purpose:'Forms undercuts or side features through controlled lateral motion.',inspect:['wear plates/gibs','timing and locking','lubrication','sensor confirmation where fitted'],remember:'A slide fault is both a tooling-quality issue and potentially a machine-protection/safety issue.'},
 {name:'Lifter',purpose:'Combines ejection with lateral movement to release an undercut.',inspect:['wear/binding','angle and travel','part drag marks','return confirmation'],remember:'Extra ejection force can hide a binding lifter until damage occurs.'},
 {name:'Bubbler / baffle cooling',purpose:'Directs coolant into narrow cores or deep features.',inspect:['flow restriction','orientation/assembly','corrosion/scale','supply/return identification'],remember:'A circuit can show temperature but still have poor local heat transfer if flow is restricted.'},
 {name:'Conformal cooling',purpose:'Uses cooling passages shaped closer to cavity geometry, often via additive tooling methods.',inspect:['flow balance','water quality','leak integrity','thermal validation'],remember:'Complex cooling should be validated with measured thermal/quality evidence rather than assumed superior.'},
 {name:'Thermal pin / high-conductivity insert',purpose:'Moves heat from difficult local regions toward a cooling path.',inspect:['contact condition','insert damage','local temperature response','material compatibility'],remember:'Local thermal devices change the heat-flow path and can alter shrinkage/warpage.'},
 {name:'Valve-gate actuator',purpose:'Opens/closes a hot-runner gate to control timing and vestige.',inspect:['pin stroke/timing','seal leakage','actuator pressure/drive','wear at gate'],remember:'Timing differences can create cavity imbalance even when manifold temperatures match.'},
 {name:'Cavity pressure sensor installation',purpose:'Measures local pressure response in the mould.',inspect:['sensor location','preload/installation','zero/calibration method','cable/connectors'],remember:'A sensor measures its specific location; comparisons require consistent installation and interpretation.'},
 {name:'Replaceable wear insert',purpose:'Concentrates expected wear into a serviceable component.',inspect:['fit/seating','edge wear','hardness/coating condition','parting-line match'],remember:'Replacing an insert can change local geometry and requires dimensional/process confirmation.'},
 {name:'Unscrewing mechanism',purpose:'Releases moulded threads using mechanical or servo/hydraulic rotation.',inspect:['timing','thread engagement','lubrication','torque/load trend'],remember:'Part temperature and shrinkage strongly affect unscrewing load.'},
 {name:'Stack mould',purpose:'Uses multiple parting planes to increase cavity count/output per clamp cycle.',inspect:['flow balance between levels','clamp/platen loading','cooling balance','ejection/robot access'],remember:'More cavities increase the importance of cavity-level identification and balanced evidence.'},
 {name:'Mould thermal expansion allowance',purpose:'Accounts for dimensional growth of steel/components between cold setup and operating temperature.',inspect:['operating temperature','shutoff/contact changes','hot-runner growth','alignment across warm-up'],remember:'A mould can behave differently cold and hot even when machine settings are unchanged.'}
]);

add('machine',[
 {name:'Injection-unit utilisation',role:'Relates required shot to the usable capacity/range of the injection unit.',watch:['material density/compressibility','required cushion','residence implications','machine manufacturer recommendations'],evidence:'Machine sizing should be based on the actual material/process and validated operating range, not barrel nameplate volume alone.'},
 {name:'Screw L/D ratio',role:'Describes screw working length relative to diameter and influences plasticising/residence characteristics.',watch:['resin family','mixing requirement','thermal history','machine-specific screw design'],evidence:'L/D is one descriptor; screw geometry and material compatibility matter more than a single ratio.'},
 {name:'Screw compression ratio',role:'Describes channel-depth change through screw zones for a specific screw design.',watch:['material melting behaviour','shear sensitivity','fibre/additive damage','supplier/machine guidance'],evidence:'Do not transfer a preferred compression ratio across unrelated polymers and screw designs.'},
 {name:'Screw peripheral speed',role:'Represents surface speed associated with screw rotation and diameter.',watch:['material shear sensitivity','glass/fibre damage','recovery time','melt-temperature evidence'],evidence:'RPM is not machine-independent because screw diameter changes surface speed.'},
 {name:'Plasticising capacity',role:'Machine ability to prepare the next shot within the available cycle.',watch:['recovery overlap','material bulk density','screw design','drive load'],evidence:'A process can be cooling-limited or plasticising-limited depending on the mould/material/machine combination.'},
 {name:'Pressure-limited filling',role:'Condition where available pressure/force prevents the commanded velocity profile from being achieved.',watch:['actual velocity','pressure-limit status','fill time','peak pressure'],evidence:'If velocity actual falls under the pressure ceiling, changing the velocity setpoint may not change the physical fill rate.'},
 {name:'Platen parallelism / tie-bar loading',role:'Mechanical alignment/load distribution supporting uniform mould closure.',watch:['local flash','mould wear','tie-bar strain/load where available','maintenance history'],evidence:'Uneven mechanical loading can look like a process-window problem.'},
 {name:'Hydraulic oil temperature',role:'Affects hydraulic viscosity and machine response on hydraulic systems.',watch:['warm-up state','velocity/pressure repeatability','cooler performance','maintenance limits'],evidence:'Compare machine response at a consistent approved oil-temperature state.'},
 {name:'Servo drive load',role:'Indicates torque/force demand on electric machine axes.',watch:['injection load','screw recovery load','mould movement friction','trend alarms'],evidence:'Drive load is machine-specific but useful as a change-detection signal.'},
 {name:'Nozzle contact force/alignment',role:'Maintains sealed connection between machine nozzle and mould sprue/manifold inlet.',watch:['leakage/drool','sprue wear','mould movement','seat marks'],evidence:'Poor contact can create material leakage and misleading pressure behaviour.'},
 {name:'Mould-protection profile',role:'Uses controlled closing force/pressure/speed to detect obstructions before full clamp.',watch:['validated position window','part/runner retention','sensor condition','tool changes'],evidence:'Mould protection should protect tooling; it is not a replacement for guarding or isolation.'},
 {name:'Controller sampling / data rate',role:'Determines how quickly process signals are captured and stored.',watch:['fast events near transfer','sensor bandwidth','trend aliasing','data-export resolution'],evidence:'Two systems can report different peaks if their sampling/filtering differs.'}
]);

add('quality',[
 {name:'Measurement-system resolution',purpose:'Checks whether the instrument can meaningfully resolve the tolerance/process variation being studied.',good:['resolution suited to requirement','calibration status','repeatable fixture/method','documented units'],risk:'High decimal display precision does not automatically mean high measurement capability.'},
 {name:'Gage R&R concept',purpose:'Separates repeatability and reproducibility components of measurement variation.',good:['representative parts/range','appropriate appraisers where relevant','defined method','study design matched to use'],risk:'A poor measurement system can make a stable moulding process look unstable.'},
 {name:'Measurement bias',purpose:'Evaluates systematic difference from a suitable reference.',good:['traceable/reference value','defined operating range','repeat measurements','documented method'],risk:'Repeatable measurements can still be consistently wrong.'},
 {name:'Measurement linearity',purpose:'Checks whether measurement bias changes across the measurement range.',good:['references across range','stable method','adequate repetitions','appropriate analysis'],risk:'Calibration at one point does not prove equal accuracy over the whole range.'},
 {name:'Measurement stability',purpose:'Checks whether measurement performance changes over time.',good:['reference artefact/sample','time-based monitoring','environment control','maintenance/calibration records'],risk:'A drifting gauge can mimic process drift.'},
 {name:'Attribute agreement',purpose:'Evaluates consistency of pass/fail or categorical inspection decisions.',good:['clear defect standards','representative samples','blind/randomised assessment where practical','repeat trials'],risk:'A visual inspection standard can have large appraiser variation even without instruments.'},
 {name:'Control chart',purpose:'Uses time-ordered data to distinguish routine variation from signals of special causes.',good:['appropriate chart type','rational subgrouping','stable measurement','reaction rules defined'],risk:'Control limits are not the same thing as engineering specification limits.'},
 {name:'Rational subgrouping',purpose:'Groups observations so within-subgroup variation reflects short-term process behaviour.',good:['time/cavity logic documented','sampling matches process physics','subgroup identity retained','chart rationale recorded'],risk:'Pooling cavities or long time intervals can hide meaningful structure.'},
 {name:'Non-normal capability review',purpose:'Handles capability data that do not reasonably follow the assumed distribution/model.',good:['distribution/stability checked','transformation/model justified','customer method followed','raw data retained'],risk:'Forcing every dataset into a normal Cpk calculation can be misleading.'},
 {name:'Cavity-specific capability',purpose:'Evaluates each mould cavity when cavity-to-cavity offsets are meaningful.',good:['cavity traceability','adequate samples per cavity','stable process','measurement capable'],risk:'Pooling cavities can create a distribution that does not represent any individual cavity.'},
 {name:'First-piece / startup approval',purpose:'Confirms defined requirements after setup, restart or change before normal production release.',good:['defined characteristics','approved measurement method','material/tool/process identity','documented release'],risk:'One good part does not prove long-term capability.'},
 {name:'Control plan',purpose:'Defines what is controlled, measured, sampled and how to react to abnormal conditions.',good:['linked product/process risks','clear frequencies/methods','reaction plan','ownership'],risk:'A control plan that is not updated after process/tool changes becomes historical paperwork.'},
 {name:'PFMEA linkage',purpose:'Connects process failure modes and controls to risk-based prevention/detection thinking.',good:['actual process steps','current controls','lessons from defects','action ownership'],risk:'FMEA scoring alone does not reduce risk; implemented controls and verification do.'},
 {name:'Process validation lifecycle',purpose:'Builds evidence that a process is capable of consistently delivering its intended result across development, qualification and ongoing monitoring.',good:['requirements defined','risk-based studies','documented parameters/responses','continued verification'],risk:'Validation is not a one-time signature on a single successful run.'},
 {name:'IQ/OQ/PQ terminology',purpose:'Common regulated-industry framework for installation, operational and performance qualification where required by the applicable quality system.',good:['scope defined by governing procedure','traceable requirements','approved protocols','deviations resolved'],risk:'The terms are sector/company dependent; do not invent qualification requirements where they do not apply.'},
 {name:'Change control',purpose:'Ensures material, mould, machine, software and process changes are assessed before release.',good:['reason and scope','risk assessment','validation/verification impact','approvals and traceability'],risk:'A small undocumented change can invalidate previous evidence.'}
]);

add('safety',[
 {name:'Risk assessment before modification',check:'Assess hazards and risk reduction before changing machine, mould, automation, guarding or control logic.',why:'A modification can create new crushing, ejection, thermal, electrical or unexpected-start hazards.',never:'Do not treat a production improvement as exempt from machinery risk assessment.'},
 {name:'Safety-related control functions',check:'Use the applicable machinery standard and validated safety architecture for interlocks, stops and protective functions.',why:'Safety functions require defined performance and validation beyond ordinary process PLC logic.',never:'Do not implement a safety function only as an unvalidated standard software condition.'},
 {name:'Emergency stop',check:'Keep emergency-stop functions available, identifiable and maintained according to the applicable machine/cell design.',why:'Emergency stop is a complementary protective measure, not normal isolation or a substitute for guarding.',never:'Do not use E-stop as the routine energy-isolation method for servicing.'},
 {name:'Robot integration',check:'Assess the robot, end effector, moulding machine and peripheral equipment as one integrated application/cell.',why:'Hazards arise from combined reach, stored energy, automatic restart and transferred parts.',never:'Do not assume the robot manufacturer alone has validated the safety of the complete cell.'},
 {name:'End-of-arm tooling',check:'Inspect EOAT attachment, vacuum/grip sensing, payload and fail-safe behaviour per the integrated-cell design.',why:'Dropped parts or detached tooling can create impact/crush hazards and tooling damage.',never:'Do not defeat part-present or grip confirmation merely to keep the cell cycling.'},
 {name:'Hot-runner electrical service',check:'Isolate and verify electrical/thermal hazards before servicing heaters, thermocouples, connectors or controllers.',why:'Hot-runner systems combine line voltage, high temperature and potentially pressurised polymer.',never:'Do not troubleshoot exposed live heater circuits unless the approved electrical procedure specifically requires and controls it.'},
 {name:'Hydraulic stored energy',check:'Control accumulators, cylinders and suspended/moving components during maintenance.',why:'Pressure can remain after pumps stop and can move cores, clamps or ejectors unexpectedly.',never:'A zero gauge reading at one point does not automatically prove all stored energy is released.'},
 {name:'Pneumatic stored energy',check:'Isolate, dump and secure pneumatic circuits used for valves, cores, robots or grippers.',why:'Trapped air can produce sudden motion after electrical power is removed.',never:'Do not disconnect a pressurised line as an informal isolation method.'},
 {name:'Material decomposition incompatibility',check:'Follow resin-supplier purge/changeover rules when changing polymer families.',why:'Some material combinations or excessive temperatures can generate corrosive or hazardous decomposition products.',never:'Do not mix unknown purge material with a heat-sensitive or incompatible resin system.'},
 {name:'Granulate dust / housekeeping',check:'Control pellets, regrind and dust according to site fire, slip, inhalation and combustible-dust assessment.',why:'Spilled pellets cause slips and fine polymer dust can create additional hazards depending on material/process.',never:'Do not assume all polymer dust is inert merely because pellets are normally solid.'},
 {name:'Mould lifting and securing',check:'Use rated lifting points, handling devices and machine mounting methods for the mould mass and centre of gravity.',why:'A mould or insert can create severe crush hazards during transport and installation.',never:'Do not stand under a suspended mould or rely on unverified lifting threads.'},
 {name:'Safe restart after intervention',check:'Use the approved restart procedure after guards, maintenance, jam clearing or cell entry.',why:'People, tools or parts can remain in hazardous zones and automatic equipment may resume unexpectedly.',never:'Do not restore automatic mode until the controlled area is confirmed clear and safeguards are functional.'}
]);

add('troubleshooting',[
 {name:'Actual injection velocity falls at the same point each shot',pattern:'The controller commands velocity but the actual profile drops while pressure reaches its limit.',first:['check pressure-limit status','compare material/mould thermal state','inspect flow restriction','verify transfer strategy'],avoid:'Raising the velocity setpoint when the machine is already pressure-limited.'},
 {name:'One hot-runner zone needs much more output',pattern:'Temperature actual matches target but one zone uses unusually high heater output.',first:['heater resistance/condition','thermocouple placement','thermal contact or heat loss','manifold/nozzle leakage evidence'],avoid:'Calling the zone healthy because temperature actual alone is on setpoint.'},
 {name:'Cooling flow drops but supply temperature is unchanged',pattern:'Thermal quality drifts while the chiller/TCU supply temperature display appears normal.',first:['measure circuit flow','check valves/hoses/filter','inspect scale/blockage','compare return temperature'],avoid:'Assuming cooling is unchanged from one temperature reading.'},
 {name:'Cavity-pressure peak moves later',pattern:'Peak cavity pressure occurs later in the cycle than the validated baseline.',first:['fill balance/viscosity','transfer timing','gate restriction','actual injection velocity'],avoid:'Interpreting peak magnitude without its timing.'},
 {name:'Parts pass dimension immediately but fail later',pattern:'Dimensions change during storage or conditioning.',first:['measurement timing','material moisture uptake','post-mould crystallisation/stress relaxation','environmental conditions'],avoid:'Treating immediate post-ejection dimensions as the final conditioned state.'},
 {name:'Impact strength drops while tensile looks acceptable',pattern:'Parts/material show brittle impact behaviour without an obvious tensile change.',first:['notch/weld-line sensitivity','material degradation','conditioning','test specimen/method'],avoid:'Assuming one mechanical test describes all failure modes.'},
 {name:'Fibre-filled part warps after gate change',pattern:'Changing gate/location or fill pattern shifts warpage direction.',first:['fibre orientation','flow-front pattern','packing balance','cooling symmetry'],avoid:'Treating filled-material shrinkage as isotropic.'},
 {name:'Robot delay appears as moulding cycle loss',pattern:'Total cycle increases but fill, hold, cooling and recovery remain stable.',first:['robot timestamps','part-release timing','conveyor/downstream interlocks','EOAT sensor response'],avoid:'Reducing cooling time to compensate for an automation delay.'},
 {name:'Regrind percentage change shifts viscosity',pattern:'Pressure, fill or appearance changes after regrind blend ratio changes.',first:['actual blend ratio','regrind heat/history and contamination','particle size/feed consistency','controlled comparison to approved material'],avoid:'Assuming regrind behaves identically to virgin material indefinitely.'},
 {name:'Material moisture test and dryer display disagree',pattern:'Measured pellet water content is high despite apparently normal dryer conditions.',first:['sample location/time','airflow and residence','hopper leaks/bypass','instrument method/calibration'],avoid:'Rejecting the moisture test solely because the dryer display looks normal.'},
 {name:'Cpk changes after cavities are pooled',pattern:'Combined capability looks worse or oddly shaped compared with individual cavities.',first:['plot cavity-specific distributions','check cavity offsets','review subgrouping','retain cavity identity'],avoid:'Using one pooled normal-distribution assumption when cavities have different means.'},
 {name:'Gauge readings drift through the day',pattern:'Part dimensions appear to drift across shifts but reference artefact readings also move.',first:['measurement stability','temperature/environment','fixture condition','calibration/reference checks'],avoid:'Adjusting the moulding process to compensate for a drifting measurement system.'},
 {name:'Startup black specks follow a material change',pattern:'Contamination appears after switching polymer families or colours.',first:['approved purge/changeover sequence','dead spots/nozzle/hot runner','material incompatibility','residence history'],avoid:'Escalating temperature without knowing compatibility/decomposition limits.'},
 {name:'Environmental crack appears only after cleaning',pattern:'Parts are acceptable after moulding but crack after exposure to a cleaner or fluid.',first:['chemical compatibility data','moulded-in/assembly stress','exposure concentration/time/temperature','material grade identity'],avoid:'Treating the problem as purely a moulding cosmetic defect.'}
]);

add('glossary',[
 ['Apparent viscosity','Flow resistance inferred under specified shear/temperature conditions; polymer melts are commonly non-Newtonian.'],
 ['Pressure-limited fill','Filling condition in which available machine pressure/force prevents the commanded velocity from being achieved.'],
 ['Velocity-to-pressure transfer','Controlled transition from filling by velocity command to packing/holding by pressure command.'],
 ['Water content','Amount of water present in a plastic sample at the time of measurement; distinct from equilibrium water absorption.'],
 ['Water absorption','Moisture uptake of a material under defined environmental exposure; not the same test as pellet water content.'],
 ['HDT','Heat deflection temperature measured under a specified load/test method; not a universal maximum service temperature.'],
 ['Vicat softening temperature','Standardised temperature at which a thermoplastic reaches a defined penetration response under specified load/heating conditions.'],
 ['Tensile modulus','Slope-based stiffness measure obtained from a defined tensile test method and specimen condition.'],
 ['Flexural modulus','Stiffness measure obtained under defined bending-test conditions.'],
 ['Charpy impact','Pendulum impact test configuration used to compare impact behaviour of defined plastic specimens.'],
 ['Izod impact','Pendulum impact test configuration with defined specimen/notch conditions.'],
 ['Moulding shrinkage test','Standardised measurement of dimensional change of moulded test specimens relative to the mould under defined conditions.'],
 ['Post-mould shrinkage','Dimensional change occurring after the initial moulding-shrinkage measurement under defined conditioning/time.'],
 ['Fibre attrition','Reduction in reinforcement fibre length during feeding, plasticising, flow or reprocessing.'],
 ['Skin-core structure','Through-thickness morphology/orientation variation created by cooling and flow history.'],
 ['Crystallinity','Fraction/degree of ordered crystalline structure in a semi-crystalline polymer, affecting shrinkage and properties.'],
 ['Glass-transition temperature (Tg)','Temperature region associated with major mobility change in amorphous polymer regions; exact measurement depends on method.'],
 ['Melting temperature/range','Thermal transition associated with melting crystalline regions; test method and grade matter.'],
 ['Thermal degradation','Chemical deterioration caused by excessive temperature, residence, shear, oxygen or incompatible material conditions.'],
 ['Hydrolysis','Molecular-chain degradation involving water, important for moisture-sensitive condensation polymers.'],
 ['Plate-out','Accumulation of additives, degradation products or contaminants on processing/tool surfaces.'],
 ['Racetrack flow','Preferential melt flow through lower-resistance/thicker paths, potentially creating hesitation elsewhere.'],
 ['Hesitation','Temporary slowing of a flow front when melt preferentially fills another path or region.'],
 ['Pressure integral','Time integral of a pressure signal used in some monitoring/correlation approaches.'],
 ['Sampling rate','Frequency at which a controller or data system records a changing signal.'],
 ['OPC UA','Industrial interoperability framework used by EUROMAP companion specifications for plastics/rubber machinery data exchange.'],
 ['MES','Manufacturing Execution System used to coordinate/record manufacturing operations and production data.'],
 ['LCA','Life cycle assessment: structured evaluation of environmental aspects/impacts across a defined product-system life cycle.'],
 ['Recycled content claim','Environmental claim about recycled material content that requires a defined methodology and evidence.'],
 ['Mechanical recycling','Reprocessing route that recovers plastic material mainly through physical/mechanical operations without intentionally changing polymer chemistry.'],
 ['Change control','Documented assessment, approval, implementation and verification of a change that may affect product/process evidence.'],
 ['Continued process verification','Ongoing use of production/process data to confirm a validated process remains in a state of control where the applicable quality system requires it.']
]);

sources('testing',[
 ['ISO 294-4:2018','Determination of moulding and post-moulding shrinkage of injection-moulded thermoplastic test specimens; confirmed current in 2024.','https://www.iso.org/standard/70413.html'],
 ['ISO 15512:2019','Methods for determining water content of plastics; a replacement edition is under development in 2026.','https://www.iso.org/standard/73834.html'],
 ['ISO 62:2008','Determination of water absorption under defined exposure; distinct from pellet water-content testing.','https://www.iso.org/standard/41672.html'],
 ['ISO 527-2:2025','Tensile test conditions for moulding and extrusion plastics.','https://www.iso.org/standard/527-2'],
 ['ISO 178:2019','Flexural properties of rigid and semi-rigid plastics; a revision is under development in 2026.','https://www.iso.org/standard/70513.html'],
 ['ISO 179-1:2026','Current non-instrumented Charpy impact test for plastics.','https://www.iso.org/standard/91071.html'],
 ['ISO 180:2023','Current Izod impact-strength test method for plastics.','https://www.iso.org/standard/84394.html'],
 ['ISO 75-2:2013','Temperature of deflection under load for plastics and ebonite; confirmed current in 2025.','https://www.iso.org/standard/55653.html'],
 ['ISO 306:2022','Vicat softening temperature for thermoplastics; revision work is active in 2026.','https://www.iso.org/standard/82176.html'],
 ['ISO 1183-1:2025','Current density methods for non-cellular plastics.','https://www.iso.org/standard/85977.html']
]);

sources('safety systems',[
 ['ISO 12100:2010','Machinery risk assessment and risk-reduction principles; current but under revision in 2026.','https://www.iso.org/standard/51528.html'],
 ['ISO 13849-1:2023','Design/integration principles for safety-related parts of machinery control systems.','https://www.iso.org/standard/73481.html'],
 ['ISO 13850:2015','Emergency-stop function principles for machinery; emergency stop is complementary protection, not isolation.','https://www.iso.org/standard/59970.html'],
 ['ISO 10218-1:2025','Current safety requirements for industrial robots.','https://www.iso.org/standard/73933.html'],
 ['ISO 10218-2:2025','Current safety requirements for industrial robot applications and robot cells.','https://www.iso.org/standard/73934.html']
]);

sources('automation',[
 ['EUROMAP 77','OPC UA data exchange between injection moulding machines and MES; Release 1.01.','https://euromap.org/euromap77'],
 ['EUROMAP 82.1','OPC UA interface for temperature-control devices; Release 1.01.','https://www.euromap.org/en/euromap82-1/'],
 ['EUROMAP OPC UA overview','Current overview of released and developing plastics/rubber machinery companion specifications.','https://www.euromap.org/i40/OPCUA'],
 ['EUROMAP technical recommendations','Includes injection-machine peripheral, robot, hot-runner and external-safety-device interface recommendations.','https://www.euromap.org/technical-issues/technical-recommendations']
]);

sources('sustainability',[
 ['ISO 14021:2026','Current requirements/guidance for self-declared environmental claims, replacing the 2016 edition.','https://www.iso.org/standard/14021'],
 ['ISO 14040:2006','Life-cycle-assessment principles and framework; confirmed current with Amendment 1:2020.','https://www.iso.org/standard/37456.html'],
 ['ISO 14044:2006','Life-cycle-assessment requirements and guidelines with published amendments.','https://www.iso.org/standard/38498.html'],
 ['ISO 15270:2008','Plastics recovery/recycling guidance; still published but being replaced by a multi-part series.','https://www.iso.org/standard/45089.html']
]);

sources('validation',[
 ['NIST/SEMATECH Engineering Statistics Handbook','Statistical engineering reference for measurement, SPC, capability and experimental design.','https://www.itl.nist.gov/div898/handbook/'],
 ['FDA — Process Validation: General Principles and Practices','Lifecycle process-validation principles for regulated drug/biological manufacturing; useful as a validation-framework reference where applicable.','https://www.fda.gov/regulatory-information/search-fda-guidance-documents/process-validation-general-principles-and-practices'],
 ['ISO 13485:2016','Medical-device quality-management requirements; confirmed current in 2025.','https://www.iso.org/standard/59752.html'],
 ['ISO 9001:2015','Current published general QMS requirements as of 24 Aug 2026; replacement edition is under publication for September 2026.','https://www.iso.org/standard/62085.html']
]);

window.MM_DEEP_DIVE_REFERENCE={version:'2026-08-24',note:'Deep-dive additions remain general educational evidence. Supplier grade data, validated machine/mould documentation, approved procedures, applicable law and product-specific quality requirements control production decisions.'};
})();
/* <<< reference-deep-dive.js */

/* >>> reference-research-extension.js */
/* MouldMaster research extension — plugin-backed literature pass 2026-08-24 */
(function(){
'use strict';
const D=window.MM_REFERENCE_DATA;
const S=window.MM_SOURCE_LIBRARY;
if(!D||!S)throw new Error('MouldMaster reference base must load before research extension');
const add=(key,rows)=>{D[key]=[...(D[key]||[]),...rows]};
const sources=(key,rows)=>{S[key]=[...(S[key]||[]),...rows]};

add('materials',[
 {name:'Post-consumer recycled polypropylene (PCR-PP)',family:'Secondary semi-crystalline polyolefin feedstock',traits:['rheology can vary by source and blend','contamination and molecular-weight distribution can differ from virgin resin','mechanical properties can remain useful when feedstock is controlled'],watch:['lot-to-lot viscosity','odour/colour/contamination','fracture behaviour','blend ratio and reprocessing history'],verify:'Approved recyclate specification, incoming rheology/property checks, blend traceability and validated process window.'},
 {name:'Post-consumer recycled HDPE (PCR-HDPE)',family:'Secondary semi-crystalline polyolefin feedstock',traits:['processability depends on source and molecular-weight distribution','secondary feedstock can support circularity','flow and mechanical response may differ from virgin HDPE'],watch:['viscosity variation','contamination','warpage/shrinkage response','mechanical-property retention'],verify:'Supplier lot evidence, rheology, density/composition and product-specific qualification.'},
 {name:'Reprocessed PETG',family:'Amorphous glycol-modified polyester',traits:['can retain useful processability through controlled reprocessing','clear appearance makes degradation visible','molecular scission can accumulate'],watch:['yellowing/darkening','impact and elongation loss','molar-mass reduction','moisture and thermal history'],verify:'Number of approved reprocessing cycles, material-property evidence and exact grade history.'},
 {name:'Mineral-filled polypropylene',family:'Semi-crystalline filled polyolefin',traits:['increased stiffness and dimensional control possible','lower cost or density trade-offs depend on filler','shrinkage becomes formulation-dependent'],watch:['filler dispersion','abrasive wear','surface appearance','anisotropy and local sink'],verify:'Filler type/content, density, shrinkage and product mechanical requirements.'},
 {name:'Glass-fibre reinforced polypropylene',family:'Semi-crystalline fibre composite',traits:['higher stiffness/strength than unfilled PP','strong flow-direction effects','fibre length influences performance'],watch:['fibre attrition','gate/orientation effects','warpage','screw/barrel/tool wear'],verify:'Fibre content/length distribution, orientation-sensitive test plan and approved regrind limit.'},
 {name:'Glass-fibre reinforced polyamide',family:'Semi-crystalline fibre composite',traits:['high structural capability','moisture-conditioned properties matter','anisotropy can dominate dimensional response'],watch:['dry-as-moulded versus conditioned properties','fibre orientation','hydrolysis during processing','wear'],verify:'Conditioning state, moisture target, fibre content and directional mechanical data.'},
 {name:'Carbon-fibre reinforced thermoplastic',family:'Conductive structural composite',traits:['high stiffness-to-weight potential','electrical/thermal behaviour may change','strong fibre orientation effects'],watch:['fibre attrition','conductivity variation','tool wear','anisotropic shrinkage'],verify:'Matrix, fibre fraction/length, electrical/mechanical requirement and validated tooling/process.'},
 {name:'Flame-retardant thermoplastic grade',family:'Additive or inherently flame-resistant compound',traits:['designed for specified flammability performance','processing stability depends on chemistry','electrical/electronic applications common'],watch:['thermal degradation','additive plate-out','colour change','certification can be grade/thickness specific'],verify:'Exact listed grade, thickness, colour/additive restrictions and supplier processing guidance.'},
 {name:'Conductive / static-dissipative compound',family:'Filled functional thermoplastic',traits:['electrical resistance engineered by additive network','percolation behaviour can be sensitive to flow/orientation','mechanical properties differ from neat resin'],watch:['filler dispersion','gate/orientation dependence','measurement method','lot consistency'],verify:'Specified resistance test, conditioning, filler system and approved process range.'},
 {name:'Laser-markable compound',family:'Functional additive thermoplastic',traits:['contains additives tailored to laser response','mark contrast depends on resin/additive/laser interaction'],watch:['colour lot consistency','thermal degradation','regrind/additive dilution','marking parameters'],verify:'Exact compound and validated marking/quality specification rather than polymer-family assumptions.'},
 {name:'Medical-device moulding grade',family:'Application-qualified thermoplastic grade',traits:['may include controlled formulation and traceability expectations','biocompatibility evidence is product/grade specific'],watch:['change notification','lot traceability','contamination','validated processing and cleaning'],verify:'Applicable regulatory/QMS requirements, supplier change-control status and product validation.'},
 {name:'Food-contact moulding grade',family:'Application-qualified thermoplastic grade',traits:['contact status depends on jurisdiction, grade and conditions of use','colourants/additives can alter compliance'],watch:['supplier declarations','regrind restrictions','contamination','temperature/contact conditions'],verify:'Current compliance documentation for the exact resin, additive package and intended food-contact use.'}
]);

add('defects',[
 {name:'Pressure-curve anomaly without visible defect',evidence:'Cavity-pressure shape changes from the validated baseline while sampled parts still appear acceptable.',check:['curve timing and local features','part mass/dimensions','sensor zero/calibration','material/machine change history'],avoid:'Do not ignore repeatable process-signal changes simply because appearance has not yet shifted.'},
 {name:'Cavity imbalance under secondary feedstock',evidence:'Cavity-to-cavity pressure or mass spread grows when recyclate source/blend changes.',check:['rheology and blend identity','runner/gate balance','cavity pressure curves','cavity-specific part data'],avoid:'Do not average all cavities into one number before locating the imbalance.'},
 {name:'Thermal-gradient warpage',evidence:'Part distortion aligns with persistent hot/cold mould regions or asymmetric cooling.',check:['surface-temperature map','cooling flow by circuit','ejection temperature','cooling-channel layout'],avoid:'Do not correct a thermal asymmetry only with packing changes.'},
 {name:'Conformal-cooling hotspot',evidence:'A supposedly improved cooling insert still shows a local hot region or delayed ejection.',check:['actual channel flow','manufacturing blockage/roughness','channel-to-surface geometry','thermal contact and insert integrity'],avoid:'Do not assume a conformal channel performs as simulated without commissioning measurements.'},
 {name:'Sensor-induced witness / surface mark',evidence:'A local mark appears at or around an in-cavity sensor location.',check:['sensor flushness/preload','surface finish','local pressure concentration','installation condition'],avoid:'Do not sacrifice sensor installation quality for data collection.'},
 {name:'Regrind-related colour drift',evidence:'Colour or gloss changes with regrind or recycled-content level.',check:['heat history','contamination','blend ratio','masterbatch/additive dilution'],avoid:'Do not assume colour change is cosmetic if it may indicate degradation.'},
 {name:'Recycled-feedstock fracture change',evidence:'Tensile stiffness/strength may remain acceptable while elongation or impact/fracture behaviour shifts.',check:['appropriate impact/elongation testing','lot/reprocessing history','notches/weld lines','conditioning'],avoid:'Do not qualify recyclate from tensile strength alone.'},
 {name:'Model-predicted reject disagreement',evidence:'A monitoring model predicts reject/accept differently from measured part quality.',check:['sensor calibration','model input range','measurement-system quality','training-data coverage and model drift'],avoid:'Do not allow an unvalidated model output to override required product inspection.'},
 {name:'Cooling-channel fouling drift',evidence:'Cycle time, mould temperature or warpage drifts gradually while process recipe stays fixed.',check:['flow and pressure drop','water quality/scale','return temperature','circuit maintenance history'],avoid:'Do not normalize a fouled cooling circuit with permanent process changes.'},
 {name:'Pressure-integral shift',evidence:'Area under the cavity-pressure curve changes even when peak pressure looks similar.',check:['hold duration and pressure transmission','gate seal','fill/transfer timing','part mass/dimension response'],avoid:'Do not judge pressure history using peak value alone.'}
]);

add('signals',[
 {name:'Local cavity-pressure features',meaning:'Features extracted from selected regions of a cavity-pressure curve rather than one whole-cycle scalar.',use:'Support diagnosis or prediction when different cycle phases carry different quality information.',drift:'Feature usefulness is application-specific and should be validated against measured quality.'},
 {name:'Pressure-curve area / integral',meaning:'Time integral of a pressure signal over a defined interval.',use:'Capture both magnitude and duration of pressure exposure for correlation studies.',drift:'Changing the integration window, sensor zero or sampling rate changes the metric.'},
 {name:'Residual pressure drop',meaning:'Defined decrease in cavity pressure after a selected cycle event.',use:'Study unloading, gate seal and cooling/solidification behaviour when validated for the application.',drift:'Interpret only with consistent event timing and sensor location.'},
 {name:'Nozzle pressure',meaning:'Pressure measured near the machine nozzle, between barrel and mould.',use:'Bridge machine-side melt behaviour and cavity response during troubleshooting or advanced monitoring.',drift:'Nozzle pressure is not identical to cavity pressure because losses occur through sprue/runner/gate.'},
 {name:'Barrel melt-pressure trend',meaning:'Pressure measured in or near the injection barrel during selected process phases.',use:'Observe plasticising/injection rheology upstream of the mould.',drift:'Sensor location and machine design strongly affect interpretation.'},
 {name:'In-mould viscosity index',meaning:'Calculated process index derived from pressure/flow information to track apparent rheological change.',use:'Compare material/process behaviour between shots or feedstock lots under a defined method.',drift:'It is method-specific and not a replacement for full laboratory rheology.'},
 {name:'Capacitance / dielectric signal',meaning:'Electrical response measured in the mould that can reflect material state at the sensing location.',use:'Research shows potential for monitoring in-mould material behaviour alongside pressure and temperature.',drift:'Requires application-specific sensor design, calibration and correlation before production use.'},
 {name:'Machine vibration features',meaning:'Statistical or frequency-domain features derived from machine vibration sensors.',use:'Research use includes combining vibration with cavity data for quality prediction.',drift:'Mounting, machine condition and environmental vibration can shift the baseline.'},
 {name:'Vision defect score',meaning:'Quantitative output from a camera/vision algorithm evaluating part appearance or geometry.',use:'Automate or support inspection when the vision system is validated against known defects.',drift:'Lighting, camera setup, part colour and algorithm changes can cause false shifts.'},
 {name:'Model confidence / prediction error',meaning:'Measure of predictive uncertainty or observed error for a data-driven quality model.',use:'Track whether a model remains trustworthy as materials, tooling or production conditions change.',drift:'A model can degrade when production leaves the training-data domain.'},
 {name:'Cooling circuit pressure drop',meaning:'Difference in coolant pressure across a defined mould circuit.',use:'Trend restriction/fouling when paired with actual flow and temperature data.',drift:'Pump state and parallel circuits can change pressure drop without local fouling.'},
 {name:'Thermal-uniformity spread',meaning:'Difference or statistical spread across measured mould-surface temperatures.',use:'Track cooling balance and compare thermal maps before/after tooling or circuit changes.',drift:'Measurement location and timing in the cycle must be repeatable.'}
]);

add('tooling',[
 {name:'Conformal-cooling design validation',purpose:'Confirms a non-linear cooling-channel design delivers the intended thermal benefit in the real mould.',inspect:['flow distribution','surface-temperature uniformity','cycle/ejection temperature','warpage and shrinkage response'],remember:'Simulation is design evidence; commissioning data are needed to prove production performance.'},
 {name:'Conformal-cooling manufacturability',purpose:'Ensures additively manufactured cooling passages can be built, cleaned, inspected and maintained.',inspect:['minimum passage geometry','powder/debris removal','surface roughness','leak/pressure test'],remember:'A high-performing simulated passage that cannot be cleaned or verified is not a robust production design.'},
 {name:'Cooling-channel roughness',purpose:'Influences pressure loss, flow regime and fouling tendency inside a circuit.',inspect:['manufacturing process','scale/corrosion','flow versus pressure drop','water quality'],remember:'Additively manufactured passages may differ hydraulically from smooth drilled channels.'},
 {name:'Cooling-flow balance manifold',purpose:'Distributes coolant to parallel mould circuits.',inspect:['individual circuit flow','valve positions','pressure drop','hose identification'],remember:'Parallel circuits naturally divide flow according to resistance; equal hose size does not guarantee equal cooling.'},
 {name:'Thermal imaging / surface mapping',purpose:'Measures spatial mould/part temperature patterns during validation or troubleshooting.',inspect:['emissivity/method','cycle timing','repeatable measurement locations','hot/cold pattern'],remember:'Temperature maps are most useful when taken at a defined point in the cycle.'},
 {name:'Sensorized cavity insert',purpose:'Integrates pressure, temperature or experimental dielectric sensing near the moulded part.',inspect:['sensor flushness','wiring protection','calibration','replaceability'],remember:'Sensor installation should not compromise cavity surface, strength or safe mould service.'},
 {name:'Cooling-circuit leak test',purpose:'Verifies circuit integrity before or after mould installation/service.',inspect:['approved test pressure/method','cross-leak between circuits','external leakage','documentation'],remember:'Use the mould maker/site procedure; do not improvise pressure tests.'},
 {name:'Cooling-circuit descaling plan',purpose:'Controls mineral/contamination buildup that reduces heat transfer and flow.',inspect:['water chemistry','flow trend','maintenance interval','approved cleaning chemistry'],remember:'Chemical cleaning must be compatible with mould metals, seals and site safety controls.'},
 {name:'Sequential valve-gate balance study',purpose:'Evaluates how valve timing changes filling, weld-line location and cavity balance.',inspect:['actual pin timing','cavity-pressure response','flow-front evidence','part quality'],remember:'Valve timing is a process/tool interaction, not just a controller setting.'},
 {name:'Sensor cable routing',purpose:'Protects mould-sensor wiring from pinch, heat, movement and electrical noise.',inspect:['strain relief','moving interfaces','connector condition','separation from high-power wiring where required'],remember:'Intermittent sensor wiring can masquerade as process instability.'}
]);

add('machine',[
 {name:'Machine-to-mould pressure loss',role:'Difference between upstream machine/nozzle pressure and local cavity pressure during flow.',watch:['material viscosity','runner/gate restriction','fill rate','sensor timing'],evidence:'Pressure loss is distributed through the flow path and should be studied at comparable flow conditions.'},
 {name:'Machine response delay',role:'Time between controller command/event and measured physical response.',watch:['transfer event','servo/hydraulic response','data-sampling rate','software/filtering'],evidence:'Fast moulding events can shift if control response or sampling changes.'},
 {name:'Injection acceleration/deceleration',role:'Rate at which screw/ram velocity changes between profile stages.',watch:['small/thin parts','pressure overshoot','machine capability','actual velocity trace'],evidence:'Two machines with the same nominal speed profile can fill differently if acceleration capability differs.'},
 {name:'Check-ring sealing trend test',role:'Controlled study of non-return-valve repeatability using shot delivery/pressure evidence.',watch:['cushion variation','transfer position','part mass','pressure response'],evidence:'Use the machine supplier/site-approved method; the purpose is repeatability diagnosis, not a universal test recipe.'},
 {name:'Nozzle-pressure sensor',role:'Measures melt pressure immediately upstream of the mould for advanced process monitoring.',watch:['sensor temperature rating','zero/calibration','pressure drop to cavity','installation dead volume'],evidence:'Useful for locating whether variation originates upstream or within the mould flow path.'},
 {name:'Machine-independent process descriptors',role:'Uses physical responses such as fill time, melt/cavity pressure and temperature rather than only controller setpoint numbers.',watch:['sensor equivalence','unit conversions','machine limits','transfer definitions'],evidence:'Physical response improves transfer thinking but still requires revalidation on another machine.'},
 {name:'Data acquisition synchronisation',role:'Aligns machine, cavity, robot, vision and auxiliary data to the same cycle/event timeline.',watch:['clock drift','trigger source','sample rate','cycle identifier'],evidence:'Unsynchronised data can create false correlations between process events and quality.'},
 {name:'Recipe revision control',role:'Prevents uncontrolled changes to production settings and preserves approved baselines.',watch:['access permissions','revision identity','change reason','backup/restore'],evidence:'Recipe control supports traceability but does not replace measurement of actual process response.'},
 {name:'Machine warm-up state',role:'Thermal/mechanical stabilisation state before collecting process evidence.',watch:['barrel/oil/platen temperatures','cycle count','hot-runner/mould state','repeatability'],evidence:'Qualification data should distinguish transient startup from steady production.'},
 {name:'Controller data filtering',role:'Smoothing or signal processing applied before values are displayed or logged.',watch:['peak pressure','fast transfer events','different controller settings','export versus display values'],evidence:'Filtered signals can look more repeatable while hiding short-duration events.'}
]);

add('quality',[
 {name:'Pressure-curve feature validation',purpose:'Confirms selected pressure features actually relate to the required product characteristic.',good:['independent measured quality data','repeat trials','representative process variation','documented feature definitions'],risk:'Correlation discovered on one dataset is not proof of causal or universal predictive value.'},
 {name:'Training / validation / test split',purpose:'Separates data used to fit a predictive model from data used to tune and independently evaluate it.',good:['cycle/lot/time leakage prevented','representative holdout data','documented preprocessing','repeatability'],risk:'Testing a model on the same data used for training gives over-optimistic performance.'},
 {name:'Model drift monitoring',purpose:'Detects when production data move away from the conditions used to develop a predictive model.',good:['baseline distributions retained','material/tool changes tracked','prediction error reviewed','retraining governed'],risk:'A once-validated ML model can become unreliable after material, sensor or tooling changes.'},
 {name:'False reject / false accept review',purpose:'Measures both kinds of classification error for automated quality decisions.',good:['ground-truth inspection','confusion matrix or equivalent','risk-based acceptance','borderline cases retained'],risk:'High overall accuracy can hide an unacceptable false-accept rate.'},
 {name:'Sensor-feature traceability',purpose:'Records exactly how raw sensor data become derived process features.',good:['sensor identity/calibration','sampling rate','filtering','feature formula/window'],risk:'A named metric such as pressure integral is not reproducible if its calculation window is undocumented.'},
 {name:'Multivariate process monitoring',purpose:'Evaluates several correlated process signals together instead of one limit at a time.',good:['stable baseline','measurement quality','interpretable reaction plan','false-alarm performance reviewed'],risk:'More variables do not automatically improve detection; correlated/noisy data can make monitoring harder.'},
 {name:'Data-set representativeness',purpose:'Checks whether validation data include relevant materials, cavities, machines, lots and process states.',good:['known variation sources included','rare defects represented where practical','metadata retained','future-use scope defined'],risk:'A model built only on ideal production may fail during the exact disturbances it is meant to detect.'},
 {name:'Data leakage check',purpose:'Prevents future or quality-result information from accidentally entering model inputs during development.',good:['cycle boundaries respected','preprocessing fitted only on training data','duplicate parts controlled','time/lot structure reviewed'],risk:'Leakage can make a weak model appear nearly perfect.'},
 {name:'Research-to-production validation',purpose:'Separates promising published/experimental monitoring methods from plant-approved control methods.',good:['local trials','risk review','measurement correlation','operator/maintenance plan'],risk:'A successful research study is evidence of feasibility, not automatic production validation.'},
 {name:'Recyclate incoming-control plan',purpose:'Defines evidence needed before variable secondary feedstock enters an approved process.',good:['supplier/lot identity','rheology or agreed proxy','contamination/colour controls','blend ratio traceability'],risk:'Treating all PCR lots as equivalent can move the process outside its validated range.'},
 {name:'Recycled-material mechanical qualification',purpose:'Checks retained properties relevant to the actual product after secondary feedstock/reprocessing.',good:['impact/elongation where relevant','tensile/flexural as required','conditioning controlled','lot/recycle history recorded'],risk:'MFR/MVR alone cannot establish final product mechanical performance.'},
 {name:'Cooling-system commissioning study',purpose:'Creates a measured baseline for cooling circuits before production qualification.',good:['flow per circuit','supply/return temperatures','surface-temperature map','cycle/warpage evidence'],risk:'Without a baseline, later fouling or connection errors are difficult to diagnose.'}
]);

add('troubleshooting',[
 {name:'Pressure curve changes but machine settings do not',pattern:'Machine recipe is unchanged while cavity pressure shape or timing shifts.',first:['material lot/rheology','mould/cooling temperature','actual velocity/pressure response','gate/vent restriction'],avoid:'Assuming unchanged setpoints mean unchanged physical process.'},
 {name:'ML quality model suddenly over-rejects',pattern:'Automated prediction rejects many parts while manual/measurement inspection remains stable.',first:['sensor zero/calibration','camera/lighting if used','model input distribution','recent material/tool/software changes'],avoid:'Disabling inspection controls without first identifying whether the model or process changed.'},
 {name:'Pressure peak stable but pressure area changes',pattern:'Peak cavity pressure is similar but part mass/dimension or pressure integral shifts.',first:['hold duration/effectiveness','gate seal','pressure decay','transfer timing'],avoid:'Using peak pressure as the only packing-quality indicator.'},
 {name:'Recycled PP lot requires different pressure',pattern:'A new secondary-feedstock lot changes pressure demand or cavity balance.',first:['incoming rheology/lot evidence','blend ratio','moisture/contamination','controlled baseline comparison'],avoid:'Treating the lot as a simple colour change with no process qualification.'},
 {name:'Conformal insert cools unevenly after service',pattern:'Thermal map becomes less uniform after maintenance or long production.',first:['circuit flow/pressure drop','blockage or scale','cross-connection','insert leak/integrity'],avoid:'Assuming conformal geometry prevents normal cooling-system maintenance problems.'},
 {name:'Cavity sensor signal becomes noisy',pattern:'Pressure/temperature trace shows spikes or discontinuities not reflected in part quality.',first:['connector/cable routing','sensor preload/installation','electrical noise/grounding','acquisition sampling/filtering'],avoid:'Tuning the moulding process around an instrumentation fault.'},
 {name:'Vibration-based quality feature shifts after maintenance',pattern:'A vibration model changes after machine or mounting service while product quality is unchanged.',first:['sensor mounting','machine mechanical condition','model baseline','maintenance change record'],avoid:'Assuming vibration features transfer unchanged after hardware modifications.'},
 {name:'Part weight prediction remains good but dimension prediction worsens',pattern:'A monitoring model tracks mass but no longer predicts a critical dimension accurately.',first:['quality-specific feature relevance','measurement system','material orientation/shrinkage','model drift'],avoid:'Using one successful response variable as proof the model predicts all quality characteristics.'},
 {name:'Cooling improvement reduces cycle but warpage grows',pattern:'A cooling redesign shortens ejection time but part distortion increases.',first:['temperature uniformity not just average','ejection temperature distribution','packing/orientation interaction','circuit balance'],avoid:'Optimising cycle time as the only cooling objective.'},
 {name:'Secondary feedstock passes flow test but impact fails',pattern:'MFR/MVR or fill behaviour is acceptable while brittle failures increase.',first:['impact/elongation testing','molecular/thermal history','contamination','weld-line/notch location'],avoid:'Using melt-flow testing as a substitute for end-use mechanical qualification.'}
]);

add('glossary',[
 ['Autoencoder','Machine-learning architecture that compresses and reconstructs data; research uses include extracting features from injection-moulding pressure curves.'],
 ['Feature engineering','Transforming raw process signals into defined variables used for analysis, monitoring or predictive models.'],
 ['Local pressure feature','Metric calculated from a selected time/event region of a pressure curve rather than the whole cycle.'],
 ['Model drift','Loss of predictive performance as production data or relationships change from the model-development baseline.'],
 ['Data leakage','Use of information during model development that would not legitimately be available at prediction time, causing misleading performance.'],
 ['False accept','Part classified as acceptable by a system when the required ground-truth inspection says it is not.'],
 ['False reject','Part classified as reject by a system when the required ground-truth inspection says it is acceptable.'],
 ['Domain shift','Change between development and production data distributions, such as a new resin lot, machine, cavity or sensor condition.'],
 ['Ground truth','Reference quality result used to evaluate a monitoring or prediction system.'],
 ['In-mould rheology','Use of in-process pressure/flow information to infer apparent material flow behaviour inside the moulding process.'],
 ['Pressure-area feature','Defined area under a pressure-versus-time curve over a stated interval.'],
 ['Sensor fusion','Combining multiple sensors such as pressure, temperature, vibration, capacitance or vision to improve process information.'],
 ['Dielectric sensing','Measurement of electrical material response that can provide information about polymer state under defined sensor conditions.'],
 ['Thermal map','Spatial set/image of measured surface temperatures used to assess heat distribution.'],
 ['Pressure drop','Difference in pressure between two locations in a flowing system under defined conditions.'],
 ['Secondary feedstock','Material sourced from recovered/recycled streams rather than solely virgin resin.'],
 ['PCR','Post-consumer recycled material recovered after its intended consumer use.'],
 ['PIR','Post-industrial recycled material recovered from manufacturing scrap or industrial streams.'],
 ['Closed-loop adaptive control','Control strategy that changes process inputs in response to measured process feedback.'],
 ['Commissioning baseline','Documented measured condition established when equipment/tooling is accepted for intended use, used for later comparison.']
]);

sources('research monitoring',[
 ['Ke, Wang & Nian (2024) — Data-driven quality prediction','Polymer Engineering & Science study using autoencoder-derived cavity-pressure features and ML for injection-moulded quality prediction.','https://consensus.app/papers/data‐driven-quality-prediction-in-injection-molding-an-ke-wang/4de689b3ed215b9db60d05e038a9567a/?utm_source=chatgpt'],
 ['Zheng et al. (2025) — Integrated capacitance/pressure/temperature sensing','IEEE Transactions on Instrumentation and Measurement study demonstrating a combined in-mould sensing probe and quality-prediction correlations.','https://consensus.app/papers/an-integrated-capacitancepressuretemperature-sensing-zheng-hu/6761d2ed563f510e9fd05deb594b317d/?utm_source=chatgpt'],
 ['Araújo et al. (2023) — In-cavity pressure failure diagnosis','Peer-reviewed study correlating cavity-pressure profiles with injection-moulding failures and simulation.','https://link.springer.com/article/10.1007/s00170-023-11100-1']
]);

sources('research recycling',[
 ['Krantz et al. (2024) — In-mould rheology and recycled PP control','Polymer Engineering & Science study of pressure-controlled/adaptive injection moulding using recycled polypropylene blends.','https://consensus.app/papers/in‐mold-rheology-and-automated-process-control-for-krantz-nieduzak/ebd3b82909a15afea4bef5375df880ab/?utm_source=chatgpt'],
 ['Huang & Peng (2021) — Repeated recycling of PP','Study of repeated PP injection/recycling effects on fluidity, crystallinity and tensile properties.','https://consensus.app/papers/details/5a36773edfeb5829a9e36a503b17cef8/?utm_source=chatgpt'],
 ['Estela-García, Hohoff & Osswald (2025) — Recycled PP processing behaviour','Experimental and CAE study of viscosity evolution through repeated polypropylene processing.','https://consensus.app/papers/details/83d583edb41450569650fe4ded205cc3/?utm_source=chatgpt']
]);

sources('research cooling',[
 ['Kanbur, Suping & Duan (2020) — Conformal cooling review','Review of conformal-cooling design, CAE and optimisation for injection moulding.','https://doi.org/10.1007/s00170-019-04697-9'],
 ['Kariminejad et al. (2022) — Conventional vs conformal cooling','Commercial-component study comparing conventional and conformal cooling channel performance.','https://doi.org/10.4028/p-q2k0v8'],
 ['Lee (2023) — Conformal cooling optimisation','Applied Sciences study of conformal-channel design and cooling efficiency using simulation and additive manufacturing.','https://doi.org/10.3390/app13137437']
]);

window.MM_RESEARCH_REFERENCE={version:'2026-08-24',note:'Research-backed additions describe observed mechanisms and monitoring approaches. Published study results are not universal production recipes; local validation remains required.'};
})();
/* <<< reference-research-extension.js */

/* >>> reference-20x-extension.js */
/* MouldMaster 20-pass research expansion — curated 2026-08-24 */
(function(){
'use strict';
const D=window.MM_REFERENCE_DATA;
const S=window.MM_SOURCE_LIBRARY;
if(!D||!S)throw new Error('MouldMaster reference base must load before 20-pass research data');
const add=(key,rows)=>{D[key]=[...(D[key]||[]),...rows]};
const sources=(key,rows)=>{S[key]=[...(S[key]||[]),...rows]};

const PASSES=[
 'rheology and shear response','drying moisture and hydrolysis','hot runners and valve gates','tool wear and maintenance','defect mechanisms','fibre orientation and composites','velocity pressure and machine control','in-mould sensing','machine vision and ML inspection','robot and automation integration','process validation and SPC','DOE and multi-objective optimisation','recyclates and reprocessing','LCA and sustainability','predictive maintenance','design for injection moulding','micro injection moulding','assisted and microcellular moulding','energy efficiency','overmoulding and insert moulding'
];

add('materials',[
 {name:"Moisture-sensitive condensation polymer",family:"Processing-behaviour class",traits:["water can drive hydrolytic chain scission during melt processing","acceptable pellet water content is grade-specific","drying history matters in addition to dryer setpoint"],watch:["sample location and exposure after drying","actual material water-content test","residence and thermal history","dryer airflow and leaks"],verify:"Supplier water-content limit, approved test method, drying equipment capability and material exposure history."},
 {name:"Reprocessed polypropylene with multiple heat histories",family:"Secondary semi-crystalline polyolefin",traits:["molecular weight and viscosity can change with repeated processing","crystallisation behaviour can shift","visual appearance may not reveal all property loss"],watch:["MFR or rheology trend","impact and elongation","odour/VOC or colour change","number and severity of reprocessing cycles"],verify:"Defined recycle history, lot-specific rheology and mechanical-property qualification for the intended product."},
 {name:"Reprocessed polyethylene",family:"Secondary semi-crystalline polyolefin",traits:["branching and chain-scission balance can differ from polypropylene","washing and compounding history can affect stability","flow response can vary between sources"],watch:["melt elasticity and viscosity","contamination and washing history","elongation/fracture behaviour","density and blend composition"],verify:"Incoming-feedstock specification, washing/compounding history, rheology and end-use mechanical requirements."},
 {name:"Foamable thermoplastic compound",family:"Physical or chemical foaming formulation",traits:["cell nucleation and growth change density and stiffness","surface and core can have very different structures","weight reduction changes section mechanics"],watch:["cell size/distribution","skin thickness","surface quality","mechanical property retention"],verify:"Exact foaming technology, blowing-agent system, density target, structural requirements and validated mould/process."},
 {name:"Supercritical-fluid foaming grade",family:"Physical-foaming thermoplastic",traits:["dissolved gas changes melt behaviour","cell morphology is process-dependent","lightweighting and stiffness/impact trade-offs are application-specific"],watch:["gas dosing consistency","pressure history","cell coalescence","surface swirl or roughness"],verify:"Material and equipment qualification, gas-delivery system, density/property targets and approved operating window."},
 {name:"Overmould-compatible hard/soft pair",family:"Multi-material polymer system",traits:["adhesion depends on chemistry and interface thermal history","mechanical interlock can supplement molecular bonding","injection sequence can affect interface strength"],watch:["substrate temperature","surface contamination","interface pressure/flow","material compatibility"],verify:"Supplier compatibility data plus local peel/shear/tensile validation for the actual geometry and ageing environment."},
 {name:"Compatibilised polymer pair",family:"Multi-material or recycled blend system",traits:["compatibiliser can improve otherwise weak interfaces or blends","effect is formulation-specific","excess or wrong compatibiliser can alter bulk properties"],watch:["dispersion","interface failure mode","lot/additive identity","long-term ageing"],verify:"Approved compatibiliser chemistry/concentration and mechanical testing of the complete moulded system."},
 {name:"Thermoplastic composite organosheet insert",family:"Continuous-fibre thermoplastic composite",traits:["overmoulded ribs/features can create integrated structures","interface strength depends on heating and consolidation","substrate can fail before the interface"],watch:["insert temperature","deconsolidation/porosity","gate distance","local pressure and surface condition"],verify:"Laminate specification, insert-preparation method, interface test plan and structural validation."},
 {name:"Micro-moulding polymer grade",family:"Material selected for microfeatures or very small shot sizes",traits:["high shear and rapid cooling magnify material-data sensitivity","microfeature replication can depend on low-temperature rheology","standard macro-scale assumptions may lose accuracy"],watch:["rheology data quality","surface temperature","trapped gas","shot-size repeatability"],verify:"Micro-scale process evidence, appropriate material model and metrology of the actual replicated features."},
 {name:"High-aspect-ratio microfeature resin",family:"Precision replication application",traits:["feature fill can be limited by freeze-off and trapped air","surface temperature strongly affects replication","mould surface and venting dominate local behaviour"],watch:["feature orientation","microventing","surface condition","replication depth distribution"],verify:"Feature-level metrology and validated moulding/simulation correlation rather than nominal bulk part fill alone."},
 {name:"Recycled feedstock with variable compressibility",family:"Secondary material with uncertain pvT behaviour",traits:["effective shot volume can vary with pressure-temperature history","fixed virgin-material pvT assumptions may be inaccurate","composition changes can affect dosing"],watch:["part mass","cushion and transfer","pressure history","lot-specific density/compressibility"],verify:"Local material characterisation or validated inline method and product-level dimensional/mass evidence."},
 {name:"Surface-critical foamed polymer",family:"Microcellular moulding application",traits:["foam reduces mass but can create swirl or roughness","skin formation controls appearance","surface improvement methods can alter cell morphology"],watch:["skin thickness","cell structure near surface","film or counter-pressure method if used","paint/coating compatibility"],verify:"Appearance standard, density, mechanical properties and downstream finishing on production-equivalent samples."}
]);

add('defects',[
 {name:"Hydrolysis-related embrittlement",evidence:"Part can look acceptable while molecular degradation reduces toughness or elongation.",check:["material water content","drying/exposure history","thermal residence","mechanical test versus retained baseline"],avoid:"Do not judge moisture-sensitive processing solely from surface appearance."},
 {name:"Hot-runner thermal imbalance",evidence:"Cavities or gate regions associated with one manifold branch show repeatable fill, colour or mass differences.",check:["zone actual and heater output","manifold thermal expansion/contact","nozzle/gate restriction","cavity-specific pressure or mass"],avoid:"Do not average grouped cavity behaviour into one machine-wide adjustment."},
 {name:"Hot-runner leakage signature",evidence:"Unexpected material loss, contamination, heater-load change or cavity imbalance develops near manifold/nozzle interfaces.",check:["safe shutdown inspection","heater/thermocouple behaviour","manifold/nozzle sealing surfaces","source of degraded material"],avoid:"Do not continue heating an unexplained leak or open a pressurised hot runner casually."},
 {name:"Fibre-orientation warpage",evidence:"Distortion follows flow direction or changes substantially when gate/fill pattern changes in reinforced material.",check:["gate location and flow front","fibre orientation prediction or sectioning","cooling balance","directional shrinkage data"],avoid:"Do not model reinforced-material shrinkage as isotropic without evidence."},
 {name:"Composite weld-line strength loss",evidence:"Filled or reinforced part fails preferentially where flow fronts meet even when surface line appears small.",check:["fibre orientation at weld","venting","interface temperature","mechanical load direction"],avoid:"Do not qualify a structural weld line from cosmetics alone."},
 {name:"Vision false reject from lighting drift",evidence:"Automated inspection rejection rises after lamp, camera, enclosure or surface-reflection changes while measured product remains stable.",check:["illumination intensity/geometry","camera exposure/focus","reference artefact","model input distribution"],avoid:"Do not tune moulding conditions to fix an inspection-system optical shift."},
 {name:"Vision false accept on novel defect",evidence:"A defect escapes automated inspection because its appearance was absent or underrepresented in training data.",check:["ground-truth audit","training-set coverage","confidence/error analysis","new material/colour/surface condition"],avoid:"Do not treat high historical accuracy as proof every future defect class is covered."},
 {name:"Cooling fouling induced warpage",evidence:"Warpage or ejection temperature drifts gradually as cooling flow deteriorates.",check:["circuit flow and pressure drop","surface thermal map","water quality/scale","maintenance history"],avoid:"Do not permanently compensate for a degraded cooling circuit with process settings."},
 {name:"Microfeature incomplete replication",evidence:"Bulk part fills but small ribs, grooves, lenses or textures remain partially unfilled.",check:["local cavity surface temperature","feature-scale venting/trapped air","material rheology at relevant conditions","feature orientation and fill sequence"],avoid:"Do not infer microfeature fill from overall part mass alone."},
 {name:"Foam swirl / silver surface",evidence:"Microcellular part shows streaked, swirled or rough surface associated with cell growth near the advancing skin.",check:["cell-growth timing","skin formation","gas/counter-pressure method","surface thermal history"],avoid:"Do not confuse foam-related surface structure with moisture splay without evidence."},
 {name:"Overmould interface peel",evidence:"Hard/soft or polymer/polymer layers separate at the interface under peel, flex or environmental exposure.",check:["material compatibility","substrate temperature and delay","surface cleanliness","interface geometry and pressure"],avoid:"Do not assume chemical family similarity guarantees adhesion."},
 {name:"Insert-interface voiding",evidence:"Porosity or incomplete contact forms around a metal/composite insert and reduces bond or sealing performance.",check:["insert preheat/temperature","air escape path","surface treatment/contamination","local fill and pressure"],avoid:"Do not increase packing globally before checking trapped air and insert preparation."}
]);

add('signals',[
 {name:"Dryer material-out moisture",meaning:"Measured water content of resin sampled near the point it actually enters production.",use:"Distinguish dryer display conditions from the material state delivered to the machine.",drift:"Exposure after drying, poor airflow or short residence can create wet material despite normal dryer displays."},
 {name:"Dryer airflow",meaning:"Quantity or proxy for drying air moving through the material bed.",use:"Use with dew point, temperature, residence and moisture measurement to assess drying-system health.",drift:"Blocked filters, leaking hoses or poor bed distribution can reduce effective drying."},
 {name:"Hot-runner heater duty imbalance",meaning:"Difference in heater output required for zones that should operate under comparable thermal conditions.",use:"Reveal heat loss, heater degradation, thermocouple placement or leakage even when displayed temperatures match.",drift:"Compare against a stable, validated mould warm state and similar production load."},
 {name:"Hot-runner thermal expansion state",meaning:"Warm-up dependent dimensional/thermal condition of manifold and nozzles.",use:"Relate startup leakage, gate seating or balance changes to the mould reaching equilibrium.",drift:"Cold and hot tool geometry/contact conditions can differ materially."},
 {name:"Fibre orientation indicator",meaning:"Simulation, imaging or indirect measure describing local reinforcement alignment.",use:"Connect gate/fill changes to directional shrinkage and mechanical properties.",drift:"A global fibre-content certificate does not describe local orientation in the part."},
 {name:"Interface temperature history",meaning:"Temperature-time history at a polymer/polymer or polymer/insert interface during overmoulding.",use:"Support adhesion studies where molecular healing and crystallisation are temperature-dependent.",drift:"One mould-temperature setpoint does not equal actual interface temperature everywhere."},
 {name:"Microfeature replication ratio",meaning:"Measured replicated feature height/depth/volume relative to the mould feature.",use:"Quantify micro/nanostructure filling rather than relying on visual acceptance.",drift:"Metrology resolution and feature location must be controlled."},
 {name:"Ultrasonic time-of-flight / echo feature",meaning:"Feature from an ultrasonic signal responding to melt arrival, solidification or detachment.",use:"Research and advanced monitoring can observe otherwise inaccessible in-mould events non-invasively.",drift:"Transducer coupling, temperature and geometry alter the baseline."},
 {name:"Virtual-sensor estimate",meaning:"Model-derived estimate of a process quantity that is not directly measured.",use:"Provide additional monitoring such as melt state or shear-rate estimates when validated.",drift:"It inherits uncertainty from its model and input sensors and requires drift checking."},
 {name:"Vision confidence score",meaning:"Model confidence associated with a camera-based classification or detection.",use:"Support review thresholds and identify uncertain cases rather than forcing every image into a hard decision.",drift:"Confidence is not calibrated probability unless specifically validated as such."},
 {name:"Anomaly score",meaning:"Data-driven measure of how far a cycle or machine condition differs from a learned healthy baseline.",use:"Support predictive-maintenance screening and early fault investigation.",drift:"Planned process changes can look anomalous unless the baseline and context are updated."},
 {name:"Specific energy per part",meaning:"Energy used by machine and defined auxiliaries divided by accepted parts or production mass.",use:"Compare energy performance while retaining output and quality context.",drift:"Boundary definition, scrap and idle time can change the metric more than one machine setting."},
 {name:"Energy by cycle phase",meaning:"Energy attributed to injection, recovery, clamp/motion, heating, cooling auxiliaries or idle phases.",use:"Locate where an energy reduction opportunity actually exists.",drift:"Different machine architectures allocate energy differently; compare like-for-like boundaries."},
 {name:"Foam part density",meaning:"Mass per unit volume of a foamed moulding or defined sample.",use:"Track lightweighting and correlate cell morphology with mechanical response.",drift:"Local density can differ from bulk average in skin-core foam structures."},
 {name:"Cell size distribution",meaning:"Distribution of foam-cell dimensions in a defined region of a microcellular part.",use:"Characterise morphology rather than reporting only average density.",drift:"Sampling location and image-analysis method strongly affect the result."},
 {name:"Overmould bond strength",meaning:"Measured interface strength using a defined peel, shear, tensile or structural test.",use:"Validate material pair and process/interface design.",drift:"Different test geometry and load mode produce non-equivalent numbers."}
]);

add('tooling',[
 {name:"Hot-runner thermal expansion clearance",purpose:"Allows manifold/nozzle components to reach operating temperature without harmful interference or loss of sealing.",inspect:["supplier assembly dimensions","warm-up leakage evidence","contact/seal marks","manifold plate condition"],remember:"Hot-runner dimensions and contact loads change with temperature; cold inspection alone can miss operating-state problems."},
 {name:"Hot-runner heater/thermocouple pairing",purpose:"Ensures each controller zone measures and heats the intended physical location.",inspect:["zone mapping","connector identity","heater resistance","thermocouple polarity/location"],remember:"A swapped sensor/heater pair can create apparently plausible but unstable temperature control."},
 {name:"Vent wear baseline",purpose:"Defines the approved geometry/condition of gas escape paths for later maintenance comparison.",inspect:["depth/land to tool standard","erosion/deposits","burn location","cleaning damage"],remember:"Both blocked vents and over-worn vents can create quality problems."},
 {name:"Gate erosion baseline",purpose:"Tracks progressive gate geometry change caused by abrasive material or repeated service.",inspect:["gate dimensions","vestige/appearance","cavity balance","filled-material run history"],remember:"Small gate changes can alter shear, balance and freeze behaviour before damage is visually obvious."},
 {name:"Wear map for filled-material mould",purpose:"Records locations expected to erode or polish under abrasive fibre/mineral-filled flow.",inspect:["gate/runner turns","shutoffs","slides","vent edges"],remember:"Maintenance intervals should reflect material abrasiveness and observed wear, not shot count alone."},
 {name:"Microvent",purpose:"Provides controlled gas escape for very small features or thin flow paths.",inspect:["feature-scale blockage","cleaning method","part flash","end-of-fill burn"],remember:"Microfeatures can become gas-limited even when the main cavity venting is adequate."},
 {name:"Microfeature insert",purpose:"Carries precision micro/nano geometry that may require specialised fabrication and metrology.",inspect:["feature wear/contamination","surface replication","insert seating","cleaning damage"],remember:"Bulk mould dimensions can remain correct while microfeatures lose functional fidelity."},
 {name:"Gas-assisted channel",purpose:"Provides intended path for pressurised gas to form or pack hollow/thick features in assisted moulding.",inspect:["channel geometry","gas penetration pattern","injector/nozzle condition","wall-thickness evidence"],remember:"Assisted moulding adds a second flow system; conventional solid-part assumptions do not fully apply."},
 {name:"Foam-compatible gate system",purpose:"Controls filling while accommodating gas-laden melt and the intended skin/cell development.",inspect:["pressure drop","surface defect location","cell morphology near gate","gate freeze"],remember:"Gate design influences both flow and foaming morphology."},
 {name:"Overmould mechanical interlock",purpose:"Uses holes, ribs, undercuts or texture to provide geometric load transfer across an interface.",inspect:["fill completeness","stress concentration","insert position","interface flash"],remember:"Mechanical interlock can improve retention but does not prove chemical adhesion or environmental durability."},
 {name:"Insert temperature measurement point",purpose:"Provides repeatable evidence of insert thermal state immediately before/within overmoulding.",inspect:["sensor location or approved handheld method","time from heating to mould close","temperature variation across inserts","traceability"],remember:"Heater setpoint is not the same as actual interface temperature."},
 {name:"Vision inspection fixture",purpose:"Presents the part to cameras with repeatable pose, background and illumination.",inspect:["part seating","lighting contamination","camera position","reference artefact"],remember:"Inspection fixture repeatability is part of the measurement system."}
]);

add('machine',[
 {name:"Injection profile tracking error",role:"Difference between commanded and measured injection velocity through the fill profile.",watch:["acceleration transitions","pressure limit","machine warm-up","load/material changes"],evidence:"Trend actual response, not only setpoints, when comparing machines or diagnosing fill variation."},
 {name:"Velocity/pressure transition disturbance",role:"Short transient caused by switching control objectives near the end of filling.",watch:["pressure dip/overshoot","actual velocity","transfer repeatability","cavity pressure"],evidence:"The physical transition response is machine/process-specific and can affect packing consistency."},
 {name:"Injection acceleration capability",role:"Limits how quickly the injection axis can reach or change commanded velocity.",watch:["small shot/thin wall fill","profile stages","drive load","pressure overshoot"],evidence:"Nominal peak speed does not describe the full dynamic capability of an injection unit."},
 {name:"Servo/hydraulic control bandwidth",role:"Describes how quickly an axis/control loop can follow changing commands and reject disturbances.",watch:["fast profile changes","load change","controller tuning","sampling/filtering"],evidence:"Machine response differences can matter even when recipe values and nominal size are similar."},
 {name:"Inline pvT / compressibility estimate",role:"Uses pressure/thermal process information to estimate melt specific volume or dosing correction.",watch:["model assumptions","sensor accuracy","recyclate variability","part-mass validation"],evidence:"Advanced inline methods can reduce dependence on fixed material curves but require local validation."},
 {name:"Vision-to-cycle handshake",role:"Synchronises inspection result with the exact moulding cycle and downstream reject action.",watch:["cycle ID","latency","lost images","reject confirmation"],evidence:"A good vision model still fails traceability if the result can be assigned to the wrong part."},
 {name:"Robot safe-state handshake",role:"Coordinates moulding machine and robot states through the validated cell-safety/control architecture.",watch:["mould open permission","robot clear","EOAT state","restart sequence"],evidence:"Functional handshakes must remain separate from and subordinate to validated safety functions."},
 {name:"Energy-monitoring boundary",role:"Defines which loads are included in an energy KPI: machine, dryer, chiller, TCU, robot, hot runner or other auxiliaries.",watch:["meter location","shared utilities","idle time","accepted-part denominator"],evidence:"Energy comparisons are meaningful only when their system boundaries and production output are explicit."},
 {name:"Idle/base-load energy",role:"Energy consumed while a machine or auxiliary is powered but not adding value to a production cycle.",watch:["planned stops","heater hold","hydraulic pump strategy","auxiliary standby"],evidence:"High fixed base load makes utilisation and scheduling important to energy per accepted part."},
 {name:"Assisted-moulding gas delivery unit",role:"Meters and controls high-pressure gas for an approved gas-assisted or microcellular process.",watch:["equipment interlocks","gas quality/supply","pressure/time trace","maintenance"],evidence:"Treat as specialised process equipment requiring supplier procedures and integrated risk assessment."}
]);

add('quality',[
 {name:"Bayesian adaptive DOE",purpose:"Selects later experiments using information learned from earlier trials instead of fixing the complete experiment set in advance.",good:["clear factor bounds","measured quality responses","algorithm decision history","independent confirmation run"],risk:"Fewer experiments do not remove the need for safe factor limits or final validation."},
 {name:"Pareto front",purpose:"Represents non-dominated trade-offs when no single setting simultaneously minimises all competing objectives.",good:["objectives scaled and defined","constraint violations excluded","trade-off decision documented","confirmation at selected solution"],risk:"A mathematically optimal point is not automatically acceptable to engineering, safety or customer requirements."},
 {name:"Surrogate model",purpose:"Approximates an expensive experiment or simulation so optimisation can explore more candidate conditions.",good:["training domain stated","prediction error checked","validation points retained","extrapolation avoided"],risk:"Optimising a weak surrogate can efficiently find the wrong answer."},
 {name:"Confirmation run",purpose:"Tests the selected optimum or process window using independent production-equivalent trials.",good:["same measurement system","replication","all critical responses checked","deviations documented"],risk:"Do not declare optimisation success from model predictions alone."},
 {name:"Process-window boundary challenge",purpose:"Tests defined edges or worst-case combinations of a candidate operating window.",good:["risk-based boundary selection","actuals recorded","product requirements checked","safe equipment/material limits respected"],risk:"A centre-point run cannot demonstrate the edges of an approved process window."},
 {name:"Multivariate anomaly baseline",purpose:"Defines normal relationships among several process signals for later anomaly detection.",good:["known healthy production","material/cavity metadata","sensor stability","false-alarm review"],risk:"An anomaly model can learn bad production as normal if the baseline is not quality-screened."},
 {name:"Predictive-maintenance ground truth",purpose:"Links detected anomalies to verified maintenance findings or failures so models can improve.",good:["fault code and physical finding","timestamp/cycle link","maintenance action","post-repair verification"],risk:"Alarm labels without confirmed physical causes can train misleading models."},
 {name:"Vision measurement-system study",purpose:"Evaluates repeatability, reproducibility and classification performance of automated visual inspection.",good:["controlled lighting/fixture","known-good and known-defect samples","false accept/reject measured","multiple lots/colours as applicable"],risk:"Pixel-level precision does not guarantee production classification capability."},
 {name:"Model external validation",purpose:"Tests a prediction model on data from a different time, lot, tool condition or machine within its intended use scope.",good:["predefined acceptance metric","no retraining on test set","metadata retained","failure cases reviewed"],risk:"Random train/test splits can overstate performance when adjacent cycles are highly similar."},
 {name:"Reprocessing-history factor",purpose:"Treats number/severity of prior heat/shear cycles as a controlled material variable during recycled-material qualification.",good:["cycle history traceable","rheology measured","mechanical responses tested","contamination controlled"],risk:"Two materials labelled the same recycled percentage can have very different process histories."},
 {name:"LCA allocation sensitivity",purpose:"Tests how environmental conclusions change with the method used to allocate burdens/credits across recycled streams or co-products.",good:["allocation method explicit","alternative cases compared","system boundary stated","functional unit consistent"],risk:"A single carbon number can hide assumptions that reverse the comparison."},
 {name:"Energy KPI normalisation",purpose:"Expresses energy relative to useful production such as accepted parts or kilograms while retaining cycle and quality context.",good:["meter boundary defined","scrap included","production state documented","same functional output compared"],risk:"Reducing kWh per cycle is not an improvement if reject rate or cycle count rises."},
 {name:"Overmould interface qualification",purpose:"Demonstrates interface strength and durability of a multi-material moulded joint.",good:["defined loading mode","environmental ageing if relevant","failure mode recorded","geometry and material lot controlled"],risk:"One lap-shear value does not represent every service loading direction or ageing condition."},
 {name:"Microfeature metrology plan",purpose:"Defines how very small moulded features are measured with adequate resolution and traceability.",good:["instrument resolution/capability","feature datum/location","repeat scans/measurements","mould feature reference"],risk:"A normal part-dimensional CMM plan may not be capable of assessing micro/nano replication."}
]);

add('safety',[
 {name:"High-pressure gas assisted moulding",check:"Treat gas-assist equipment, injector, hoses and mould passages as a specialised high-pressure system under the supplier and site safety design.",why:"Stored gas energy and pressurised polymer add hazards beyond conventional injection moulding.",never:"Do not disconnect, loosen or improvise gas components while they may be pressurised."},
 {name:"Foaming gas supply",check:"Control gas cylinders/generators, regulators and process equipment under applicable compressed-gas requirements and supplier procedures.",why:"Gas supply introduces stored energy and, depending on gas/process, asphyxiation or pressure hazards.",never:"Do not bypass gas-pressure interlocks or substitute an unapproved gas."},
 {name:"Automated vision reject mechanism",check:"Assess reject gates, pneumatic pushers, robots and conveyors as moving machinery within the cell risk assessment.",why:"Adding inspection automation can introduce new pinch, strike and unexpected-motion hazards.",never:"Do not reach into an automated reject path while the system remains capable of motion."},
 {name:"Predictive maintenance is not isolation",check:"Use anomaly or health monitoring to plan work, then perform servicing under the approved isolation procedure.",why:"A model indicating low risk or stopped motion does not remove stored hazardous energy.",never:"Do not substitute a software health indicator for lockout/isolation."},
 {name:"Insert-loading cell safety",check:"Integrate manual/robot insert loading with guard, presence-sensing and restart requirements for the complete machine cell.",why:"Hands, inserts and automation can enter the mould area before clamp closure.",never:"Do not defeat mould-area safeguards to speed insert placement."},
 {name:"Experimental process study boundaries",check:"DOE and research trials must remain inside equipment, material and site-approved safety limits.",why:"Optimisation algorithms may request extreme factor combinations unless constraints are explicit.",never:"Do not let automated optimisation command conditions outside validated safe limits."}
]);

add('troubleshooting',[
 {name:"Dry resin test passes at dryer but fails at machine",pattern:"Material meets moisture target at one sampling point but moulding still shows moisture/degradation symptoms.",first:["sample at machine feed point","check transfer-line leaks/exposure","verify hopper residence/airflow","compare approved moisture method"],avoid:"Assuming the entire material path is dry from one upstream sample."},
 {name:"One hot-runner branch changes during warm-up",pattern:"Grouped cavities drift until the mould/manifold reaches a stable thermal state.",first:["trend zone output and actuals","allow approved warm-up/equilibration","inspect thermal expansion/sealing evidence","compare branch cavity pressure/mass"],avoid:"Saving a permanent recipe correction for a transient thermal condition."},
 {name:"Filled-material gate slowly grows",pattern:"Gate vestige, shear-related appearance or cavity balance changes gradually over a long run.",first:["measure gate wear","review abrasive material exposure","compare fill/pressure baseline","inspect replaceable insert condition"],avoid:"Treating progressive tooling erosion as resin-lot noise."},
 {name:"Reinforced-part warpage flips after gate move",pattern:"Warpage direction changes after gating or flow-path modification.",first:["review fibre orientation","compare flow-front pattern","check directional shrinkage","confirm cooling remained equivalent"],avoid:"Applying the old warpage correction to a new orientation field without evidence."},
 {name:"Machine reaches pressure limit before profile speed",pattern:"Actual injection velocity falls below command and fill becomes sensitive to material changes.",first:["confirm pressure-limit event","check material viscosity/thermal state","inspect flow restriction","review machine capacity"],avoid:"Increasing commanded velocity when the axis cannot achieve it."},
 {name:"Sensor model degrades after cable replacement",pattern:"Predictions or anomaly scores shift after sensor wiring/service with little product change.",first:["check zero/calibration","compare signal noise/filtering","verify cable routing/connectors","rebaseline only after physical verification"],avoid:"Retraining immediately and hiding an instrumentation problem."},
 {name:"Vision misses defect on new colour",pattern:"Inspection performance changes after pigment, gloss or surface texture change.",first:["review lighting/reflection","collect ground-truth examples","test domain shift","revalidate thresholds/model"],avoid:"Assuming a vision model is colour-independent unless it was validated that way."},
 {name:"Anomaly alert repeats but maintenance finds nothing",pattern:"Predictive-maintenance system repeatedly flags healthy production.",first:["check baseline scope","review sensor drift","identify planned process-state change","measure false-alarm rate"],avoid:"Ignoring all future alerts instead of correcting the model or measurement system."},
 {name:"DOE optimum fails confirmation run",pattern:"Modelled or experimental optimum does not reproduce under independent trials.",first:["check factor actuals","review interactions/model lack-of-fit","verify measurement system","look for time/lot/cavity effects"],avoid:"Widening acceptance criteria to make the predicted optimum pass."},
 {name:"Recyclate lot has same MFR but fills differently",pattern:"Standard melt-flow value is similar yet injection pressure or fill balance changes.",first:["consider full shear-dependent rheology","check pvT/compressibility and contamination","compare pressure curves","verify lot composition"],avoid:"Treating one MFR value as a complete rheological fingerprint."},
 {name:"Energy per part rises with stable cycle time",pattern:"Cycle duration and product remain similar while energy KPI worsens.",first:["split energy by machine/auxiliary phase","check heater/pump/TCU duty","review idle/base loads","verify meter boundary"],avoid:"Changing injection settings before locating the actual energy increase."},
 {name:"Foamed part meets weight but loses stiffness",pattern:"Lightweighting target is achieved while structural response falls outside expectation.",first:["inspect cell morphology and skin thickness","verify local density","test relevant mechanical mode","review weld/orientation effects"],avoid:"Using weight reduction alone as the foam-process acceptance criterion."},
 {name:"Foamed part has good core but poor surface",pattern:"Internal cell morphology is acceptable while swirl, roughness or paint appearance fails.",first:["review skin formation","surface thermal history","gas counter-pressure/film method if applicable","material and tool surface"],avoid:"Increasing foam level without assessing the skin/surface mechanism."},
 {name:"Overmould bond weak far from gate",pattern:"Interface strength decreases along flow length or at regions with lower thermal/pressure history.",first:["map interface temperature","review gate and flow path","check surface contamination","compare local failure mode"],avoid:"Reporting one coupon result as uniform bond strength across a complex part."},
 {name:"Overmould fails in substrate not interface",pattern:"Test fracture moves into the insert/organosheet rather than separating at the moulded interface.",first:["identify actual failure plane","check substrate porosity/delamination","review local gate/thermal history","use correct structural test"],avoid:"Calling every pull-off result an interfacial strength value."},
 {name:"Microfeature result disagrees with bulk simulation",pattern:"Overall fill prediction is good but microstructured region is under-replicated.",first:["use feature-scale mesh/model","check low-temperature rheology","include trapped-air/surface effects where relevant","validate with micro-metrology"],avoid:"Assuming a macro-scale mesh resolves microfeature physics."},
 {name:"Cooling redesign cuts cycle but changes shrinkage",pattern:"A new high-efficiency cooling layout shortens cycle yet dimensions shift.",first:["compare temperature uniformity and ejection state","review crystallisation/shrinkage response","check packing/gate seal","repeat capability study"],avoid:"Treating cooling time reduction as independent from material morphology and dimensions."}
]);

add('glossary',[
 ["Hydrolytic chain scission","Reduction in polymer molecular chain length caused by reaction with water under conditions where the polymer chemistry is susceptible."],
 ["Molecular-weight distribution","Distribution of polymer chain sizes; it influences rheology and can change through degradation, branching or recycling."],
 ["pvT behaviour","Relationship between specific volume, pressure and temperature used to describe polymer compressibility and shrinkage-related behaviour."],
 ["Pressure tracking error","Difference between requested/target and measured pressure response through a defined process interval."],
 ["Velocity tracking error","Difference between commanded and measured injection-axis velocity through a defined profile."],
 ["Control bandwidth","Frequency/rate range over which a control system can respond effectively to commands or disturbances."],
 ["Heater duty cycle","Fraction or pattern of controller output applied to a heater over time to maintain temperature."],
 ["Thermal expansion","Dimensional change of mould/hot-runner components with temperature; important for sealing and alignment."],
 ["Fibre orientation tensor","Mathematical representation used in composite flow modelling to describe local reinforcement orientation."],
 ["Skin-core morphology","Different structure near a moulded surface and through the interior caused by gradients in shear, temperature, pressure or foaming."],
 ["Microfeature replication ratio","Quantified degree to which mould microgeometry is reproduced in the polymer part."],
 ["Wall slip","Relative motion between polymer melt and the wall under some micro/flow conditions instead of a strict no-slip boundary assumption."],
 ["Surrogate model","Fast approximation of an experiment or high-cost simulation used for prediction or optimisation inside a defined domain."],
 ["Bayesian optimisation","Sequential optimisation method that uses a probabilistic model and prior observations to choose informative next trials."],
 ["Pareto optimal","Condition where improving one objective necessarily worsens at least one other considered objective."],
 ["Domain of applicability","Range of materials, machines, process states and data conditions for which a model has evidence supporting its use."],
 ["External validation","Evaluation using independent data not used for fitting or tuning a model."],
 ["Anomaly detection","Method for identifying observations that differ meaningfully from a defined normal/healthy baseline."],
 ["Predictive maintenance","Use of condition and historical evidence to anticipate maintenance needs rather than relying only on fixed intervals or failures."],
 ["Specific energy consumption","Energy normalised to a stated production output such as accepted mass or parts, with the measurement boundary explicitly defined."],
 ["Functional unit","Reference quantity used in life-cycle assessment so alternative systems are compared on equivalent delivered function."],
 ["Allocation","LCA method for assigning environmental burdens or credits among co-products, recycled streams or life cycles."],
 ["Microcellular injection moulding","Injection process using dissolved gas/foaming to create a cellular internal structure and reduce density."],
 ["Gas counter pressure","Controlled gas pressure applied in a mould cavity to delay or influence foaming and surface formation in specialised processes."],
 ["Gas-assisted injection moulding","Process that introduces pressurised gas into the polymer flow/part to form or pack hollow/thick features."],
 ["Overmoulding","Injection of one material onto or around a previously formed material/component to create an integrated part."],
 ["Insert moulding","Injection moulding around a pre-positioned insert such as metal, electronics or a composite element."],
 ["Polymer healing","Interdiffusion/re-entanglement of compatible polymer chains across a sufficiently mobile interface, contributing to bond development."],
 ["Mechanical interlock","Geometric engagement across an interface that transfers load independently of or alongside chemical/molecular adhesion."],
 ["Interface failure mode","Location and mechanism of fracture in a multi-material joint; may be adhesive, cohesive, delamination or mixed."],
 ["Ground-truth audit","Periodic comparison of automated inspection/monitoring decisions against an independent accepted reference method."],
 ["Cycle synchronisation","Association of signals, images, robot events, inspection results and part identity with the same production cycle."],
 ["Microventing","Very small controlled gas-escape features designed for thin-wall, microfeature or local end-of-fill regions."],
 ["Thermal uniformity","Degree to which relevant mould/part temperatures are spatially consistent at a defined point in the cycle."],
 ["Confirmation experiment","Independent trial used to verify that an optimisation result or predicted process condition actually performs as expected."],
 ["Reprocessing history","Record of prior melting, extrusion, moulding, grinding and other thermal/shear exposures experienced by a polymer."],
 ["Cascadic degradation","Progressive material-property and molecular changes accumulated across repeated processing/recycling loops."],
 ["Virtual sensor","Model-based estimate of a process variable generated from other measurements rather than a direct physical sensor."],
 ["Sensor drift","Slow change in sensor output or calibration independent of the true process quantity."],
 ["False-alarm rate","Frequency at which a monitoring system signals abnormality when the accepted ground truth indicates normal operation."]
]);

sources('20x rheology and drying',[
 ["Campos et al. (2025) — PET drying study","Recent research on drying and material condition in recycled PET processing; use as mechanism evidence, not a universal dryer recipe.","https://doi.org/10.1007/s44347-025-00013-9"],
 ["Chen et al. (2022) — Moisture/process DOE","Study examining moisture/plasticisation effects using designed experiments.","https://doi.org/10.3390/app12031410"],
 ["Bruchmüller & Puch (2026) — Inline pvT dosing","Research on inline pvT analysis for variable polymer/recyclate melt dosing.","https://doi.org/10.1002/app.70411"]
]);

sources('20x hot runner and tooling',[
 ["Cheng et al. (2024) — Hot-runner thin-wall control","Research on hot-runner process behaviour and adaptive control in thin-wall moulding.","https://doi.org/10.3390/polym16081057"],
 ["Kim (2023) — Hot-runner manifold thermal deformation","Study of manifold thermal/mechanical behaviour relevant to sealing and balance.","https://doi.org/10.3390/mi14071337"],
 ["Frumosu et al. (2020) — Injection mould wear prediction","Research on predicting mould wear/maintenance needs from process evidence.","https://doi.org/10.1080/0951192X.2020.1829062"],
 ["Pedroso et al. (2024) — Injection mould materials review","Review of mould materials and service considerations.","https://doi.org/10.3390/machines12040255"],
 ["Jiang & Zhai (2023) — Erosion wear","Study relevant to erosion mechanisms in injection-mould tooling.","https://doi.org/10.1515/ipp-2022-0014"]
]);

sources('20x defects and composites',[
 ["Burn-mark mechanism study (2021)","Research using evolved-gas analysis and injection moulding evidence to investigate burn-mark formation.","https://doi.org/10.3390/POLYM13234087"],
 ["Vaněk et al. (2024) — Thick-wall PC sink marks","Experimental/simulation study of thick-walled optical injection mouldings and sink/dimensional quality.","https://doi.org/10.3390/polym16162318"],
 ["Huang et al. (2021) — Fibre orientation and warpage","Research linking fibre orientation and reinforced-part deformation.","https://doi.org/10.1007/S40684-020-00226-2"],
 ["Scantamburlo et al. (2022) — Composite moulding response","Study of reinforced thermoplastic processing, orientation and quality interactions.","https://doi.org/10.1016/j.compositesa.2022.107239"],
 ["Shao et al. (2021) — Fibre length/orientation PA66","Study of reinforcement length/orientation and moulded composite response.","https://doi.org/10.1007/S12221-021-0964-3"]
]);

sources('20x machine control and sensors',[
 ["Ren et al. (2024) — Injection speed control","Deep-reinforcement-learning research on injection-speed tracking in a servo-driven hydraulic system.","https://doi.org/10.3390/act13090376"],
 ["Yang et al. (2021) — Injection-rate feedback control","Experimental work on improved injection-speed feedback control.","https://doi.org/10.1155/2021/9960021"],
 ["Wu et al. (2023) — Robust injection velocity tracking","Research on robust tracking of injection velocity in nonlinear machine dynamics.","https://doi.org/10.3390/math11122619"],
 ["Zheng et al. (2024) — Pressure/temperature/capacitance sensor","Integrated in-mould sensor research for material-state and quality monitoring.","https://doi.org/10.1109/tim.2024.3522402"],
 ["Kariminejad et al. (2021) — Ultrasound sensors","Review of ultrasonic sensing for injection-moulding process monitoring.","https://doi.org/10.3390/S21155193"],
 ["Chen, Guo & Wang (2020) — In-mould ANN defect detection","Online defect-detection research using in-mould pressure/temperature data.","https://doi.org/10.1007/S00170-020-06011-4"]
]);

sources('20x vision and automation',[
 ["Fan & Qiu (2024) — Vision inspection for moulded defects","Deep-learning machine-vision research focused on surface defects of injection-moulded products.","https://doi.org/10.1088/1361-6501/ad1c4c"],
 ["Asadi et al. (2023) — YOLO-NAS injection inspection","Research applying real-time object detection to identify defective injection-moulded products.","https://doi.org/10.1109/iccia61416.2023.10506371"],
 ["Prunella et al. (2023) — Industrial vision survey","Large survey of deep-learning approaches and deployment issues for industrial surface-defect inspection.","https://doi.org/10.1109/access.2023.3271748"],
 ["ISO 10218-2:2025","Current industrial robot application and robot-cell safety requirements.","https://www.iso.org/standard/73934.html"],
 ["EUROMAP technical recommendations","Industry interface recommendations for injection machines, robots, hot runners and peripheral equipment.","https://www.euromap.org/technical-issues/technical-recommendations"]
]);

sources('20x validation and optimisation',[
 ["Kumar, Park & Lee (2020) — Data-driven smart control","Research on process-window monitoring and smart injection-moulding control.","https://doi.org/10.1016/J.CIRPJ.2020.07.006"],
 ["Vasco et al. (2023) — Closed-loop control case","Industry 4.0 refurbishment case using process data and closed-loop corrections.","https://doi.org/10.3390/electronics12020271"],
 ["ValiData (2025) — Injection process validation methodology","Research project on more evidence-based injection-moulding validation, especially for medical technology.","https://doi.org/10.34657/18916"],
 ["Kariminejad et al. (2024) — Bayesian adaptive DOE","Industrial injection-moulding optimisation using adaptive experimental design and sensor data.","https://doi.org/10.1038/s41598-024-80405-2"]
]);

sources('20x recycling and sustainability',[
 ["Boz Noyan et al. (2024) — Recycled polyethylene","Rheological and functional property study of mechanically recycled post-consumer rigid polyethylene.","https://doi.org/10.3390/ma17081855"],
 ["Cascadic polyolefin degradation (2024)","Study of molecular, rheological and defect changes through repeated polyolefin reprocessing cycles.","https://doi.org/10.1007/s10098-024-02818-x"],
 ["Mannheim & Siménfalvi (2020) — PP life cycle","Life-cycle assessment with focus on injection-moulding manufacturing impacts.","https://doi.org/10.3390/POLYM12091901"],
 ["He et al. (2022) — Recycled PA12 LCA","Study demonstrating how allocation assumptions can change life-cycle conclusions for recycled feedstock.","https://doi.org/10.1111/jiec.13277"],
 ["Feng et al. (2023) — Composite/foam LCA","Life-cycle study of plant-fibre composite and microcellular moulding options.","https://doi.org/10.3390/ma16144952"]
]);

sources('20x maintenance and design',[
 ["Rousopoulou et al. (2020) — Predictive maintenance","Real-time anomaly detection and cognitive predictive-maintenance work applied to injection-moulding machines.","https://doi.org/10.3389/FRAI.2020.578152"],
 ["Godec et al. (2021) — Mould design optimisation","Numerical mould-design optimisation with warpage/cooling considerations.","https://doi.org/10.31803/TG-20210531204548"],
 ["Yang et al. (2022) — Automotive inner-panel mould design","Simulation and optimisation research covering gate schemes, cooling and warpage/shrinkage responses.","https://doi.org/10.1155/2022/7280643"]
]);

sources('20x micro moulding',[
 ["Loaldi et al. (2020) — Micro-moulding simulation validation","Experimental validation of 3D micro-part and microfeature injection-moulding simulation.","https://doi.org/10.3390/MI11060614"],
 ["Liparoti et al. (2021) — Microfeature multiscale modelling","Research on rheology, crystallisation, trapped air and microfeature replication.","https://doi.org/10.3390/POLYM13193236"],
 ["Zhou et al. (2026) — Biomedical micro injection moulding review","Recent review of polymer micro-injection moulding materials, equipment and process challenges.","https://doi.org/10.1002/adem.202502009"]
]);

sources('20x assisted moulding and energy',[
 ["Pradeep et al. (2024) — Supercritical-fluid foam moulding","Material-process-microstructure-performance research for supercritical-fluid assisted injection-moulded TPO foams.","https://doi.org/10.1002/pen.26700"],
 ["Ren et al. (2022) — Gas counter pressure and microcellular PP","Study of surface, cell morphology and tensile response under gas-counter-pressure assisted moulding.","https://doi.org/10.3390/polym14061078"],
 ["Soesilo & Valentin (2025) — Hydraulic to electric energy case","Case study comparing energy and emissions after injection-machine technology transition; site-specific results must not be generalised.","https://doi.org/10.14710/jati.20.2.104-110"],
 ["Zhang et al. (2017) — Electric-hydraulic energy review","Background review of energy-conservation approaches in electric-hydraulic injection-moulding equipment.","https://doi.org/10.3390/EN10111768"]
]);

sources('20x overmoulding and inserts',[
 ["Lafranche et al. (2021) — Thin-wall PA6/PP overmoulding","Research on interfacial adhesion in thin-wall injection-overmoulded multilayer parts.","https://doi.org/10.1002/APP.50294"],
 ["Özel & Soylemez (2024) — Multi-material bond strength","Experimental investigation of temperature effects on polymer-polymer bond strength in multi-component moulding.","https://doi.org/10.1115/1.4065847"],
 ["Soeiro et al. (2024) — Polymer/polymer and polymer/metal interfaces","Experimental multi-component moulding study on coupling agents, preheating and surface preparation.","https://doi.org/10.1016/j.prostr.2024.01.043"],
 ["Ma et al. (2025) — Ultrasonically assisted overmoulding","Research on thermoplastic composite interface enhancement using local ultrasonic activation.","https://doi.org/10.1002/pc.70132"]
]);

window.MM_RESEARCH_20X={version:'2026-08-24',passes:PASSES.slice(),passCount:PASSES.length,note:'Twenty-topic research synthesis. Entries are mechanisms, evidence prompts and study concepts—not universal machine settings or substitutes for supplier, machine, mould, safety or product-specific validation.'};
})();
/* <<< reference-20x-extension.js */

/* >>> reference-2026-expansion.js */
/* MouldMaster practical reference expansion — researched 2026-08-24 */
(function(){
'use strict';
const D=window.MM_REFERENCE_DATA;
const S=window.MM_SOURCE_LIBRARY;
if(!D||!S)throw new Error('MouldMaster reference data and source library must load before the 2026 expansion');
const add=(key,rows)=>{const seen=new Set((D[key]||[]).map(x=>String(x.name||'').toLowerCase()));D[key]=[...(D[key]||[]),...rows.filter(x=>!seen.has(String(x.name||'').toLowerCase()))]};
const source=(key,rows)=>{const seen=new Set((S[key]||[]).map(x=>x[2]));S[key]=[...(S[key]||[]),...rows.filter(x=>!seen.has(x[2]))]};

add('materials',[
 {name:'Glass-fibre-reinforced polyamide',family:'Short-fibre reinforced engineering thermoplastic',traits:['high stiffness and strength potential','properties depend strongly on fibre orientation','moisture conditioning affects dimensions and properties'],watch:['processing can shorten fibres','flow direction creates anisotropy','moisture before moulding can damage some grades'],verify:'Exact PA chemistry, glass content, moisture specification, retained-property requirements and orientation-sensitive test plan.'},
 {name:'Mineral-filled polypropylene',family:'Filled semi-crystalline polyolefin',traits:['reduced shrinkage can be achievable versus unfilled PP','stiffness and dimensional behaviour depend on filler type/loading','surface appearance may change'],watch:['filler orientation can still drive warpage','abrasion may increase','density and flow behaviour differ from unfilled resin'],verify:'Exact filler type/content, density, shrinkage data, tooling-wear expectations and approved processing window.'},
 {name:'Flame-retardant compounds',family:'Application-qualified polymer compounds',traits:['formulated to meet defined flammability performance','electrical/electronic uses common','behaviour is grade-specific'],watch:['thermal history can change colour or performance','regrind limits can be restricted','substituting a visually similar grade can invalidate qualification'],verify:'Exact grade, certification file/rating, regrind policy, colour/additive restrictions and supplier process guidance.'},
 {name:'Conductive / ESD compounds',family:'Electrically modified thermoplastic compounds',traits:['electrical resistance controlled by conductive additive system','carbon or fibre fillers are common','mechanical properties can differ from base resin'],watch:['orientation and shear can affect conductivity','filler systems can be abrasive','surface resistance is not inferred from colour'],verify:'Specified electrical test method/range, conditioning, filler system, wear controls and lot qualification.'},
 {name:'Optical-grade amorphous polymers',family:'Transparent moulding materials',traits:['clarity depends on material and surface quality','flow and residual stress can affect optical performance','contamination is highly visible'],watch:['moisture and degradation can create haze/streaks','mould polish and handling matter','birefringence/residual stress may be functional defects'],verify:'Exact optical grade, drying/handling, optical test requirement, mould-finish standard and contamination controls.'},
 {name:'Post-consumer recycled polyolefin compound',family:'Recycled thermoplastic feedstock',traits:['composition can vary between lots','MFR alone may not capture all property variation','contamination history matters'],watch:['colour, odour, inclusions and mechanical properties can drift','multiple prior heat histories may reduce molecular weight','sorting/source changes can alter behaviour'],verify:'Supplier certificate, source definition, incoming QC, representative sampling, contamination limits and validated application requirements.'},
 {name:'Mass-balanced / chemically recycled feedstock grade',family:'Certified feedstock-attribution or recycled-content resin',traits:['may use chain-of-custody accounting','physical polymer performance is grade-specific','environmental claim scope depends on certification scheme'],watch:['mass-balance claim is not the same as measured recycled content in an individual pellet','regulatory/customer wording matters','process settings still follow the actual grade'],verify:'Certification scheme, claim wording, chain-of-custody evidence, exact grade datasheet and customer/regulatory requirements.'},
 {name:'High-filled structural thermoplastic',family:'High filler/reinforcement engineering compound',traits:['high stiffness potential','reduced flow length versus unfilled grades is common','anisotropy can dominate dimensional response'],watch:['gate and screw design affect fibre/filler damage','wear can increase substantially','weld-line strength can control the part'],verify:'Filler/reinforcement type and loading, retained-fibre expectations, gate/weld-line design, tool steel/wear plan and structural validation.'}
]);

add('defects',[
 {name:'Cavity-to-cavity imbalance',evidence:'Nominally identical cavities show repeatable differences in fill, mass, dimension or pressure response.',check:['cavity ID and sample segregation','runner/gate condition','local venting and cooling','cavity-pressure or short-shot evidence where available'],avoid:'Do not average cavities together until cavity-specific behaviour has been checked.'},
 {name:'Gate vestige inconsistency',evidence:'Gate remnant, blush, stringing or gate break differs between cycles or cavities.',check:['gate geometry/wear','gate temperature and seal timing','degating method','part temperature at ejection'],avoid:'Do not treat a gate-local problem as a whole-mould temperature problem without location evidence.'},
 {name:'Haze / loss of clarity',evidence:'Transparent or translucent parts show cloudiness, local haze or reduced optical transmission.',check:['material moisture/volatiles','surface contamination or mould finish','thermal degradation','residual stress and flow history'],avoid:'Do not assume every haze defect is moisture; surface and stress mechanisms can look similar.'},
 {name:'Post-conditioning blister',evidence:'Bubbles or blisters appear after heat, humidity, painting, plating or other downstream exposure.',check:['trapped gas/void mechanism','material moisture or volatile content','surface preparation','downstream temperature/time history'],avoid:'Do not approve the moulding only from immediate visual inspection when downstream exposure is part of the product requirement.'},
 {name:'Assembly-induced cracking',evidence:'A moulded part passes inspection but cracks during fastening, snap-fit assembly or service loading.',check:['residual stress','boss/clip geometry','fastener torque/interference','chemical exposure and conditioning'],avoid:'Do not change the moulding process before separating assembly load, geometry and material compatibility effects.'},
 {name:'Parting-line mismatch',evidence:'A step or offset appears where the two mould halves meet.',check:['mould alignment/interlocks','wear or contamination on shutoffs','platen/mould seating','thermal growth'],avoid:'Do not try to hide a mechanical mismatch with packing or clamp-force changes.'},
 {name:'Cavity-specific burn mark',evidence:'Burning or dieseling repeatedly occurs in one cavity or one end-of-fill region.',check:['local vent condition','fill sequence','runner balance','contamination or local restriction'],avoid:'A cavity-specific burn strongly favours a local cause over a global barrel-setting explanation.'},
 {name:'Intermittent black specks after restart',evidence:'Dark inclusions appear mainly after stoppage, restart or long residence events.',check:['residence/soak history','dead spots in nozzle/hot runner/barrel','purge sequence','temperature overshoot'],avoid:'Do not automatically classify every black speck as external contamination.'}
]);

add('signals',[
 {name:'Cavity-to-cavity pressure delta',meaning:'Difference between comparable pressure features from separate cavities.',use:'Separate local cavity balance from global machine variation.',drift:'A widening delta can indicate gate, runner, vent, cooling or sensor-location changes even when the machine trace looks stable.'},
 {name:'Time to velocity/pressure transfer',meaning:'Elapsed time from injection start to the transfer event.',use:'Trend filling consistency alongside transfer position and pressure.',drift:'A time change with unchanged programmed settings can reveal viscosity, restriction or actual-velocity changes.'},
 {name:'Material moisture actual',meaning:'Measured water content of the resin sample using a suitable validated method.',use:'Verify material condition rather than relying only on dryer display values.',drift:'Dryer dew point can look acceptable while wet material still reaches the machine because of residence, airflow, leaks or handling.'},
 {name:'Dryer outlet / hopper temperature',meaning:'Temperature of drying air or material near the hopper outlet when the system supports measurement.',use:'Confirm heat reaches the material through the full drying path.',drift:'A heater setpoint alone does not prove correct material temperature or residence time.'},
 {name:'Cooling-flow delta by circuit',meaning:'Difference in measured flow between mould cooling circuits or between validated and current state.',use:'Find restricted, misconnected or unbalanced circuits.',drift:'Temperature stability can mask a circuit-flow loss until local part temperature or dimensions change.'},
 {name:'Mould-open force / drive load proxy',meaning:'Machine load or force needed to start opening or separate the mould where available.',use:'Trend sticking, vacuum, overpacking, slide condition or mechanical friction.',drift:'A rising opening load can be an early sign before visible ejection damage appears.'},
 {name:'Robot pick confirmation / vacuum signal',meaning:'Automation signal confirming that a part or sprue was successfully gripped.',use:'Separate moulding faults from handling faults and prevent double-shots or trapped parts.',drift:'Increasing retries can indicate part release, static, vacuum, gripper wear or positional drift.'},
 {name:'Cycle-to-cycle transfer-pressure spread',meaning:'Variation in pressure demand at the chosen transfer event across consecutive shots.',use:'Simple indicator of fill resistance repeatability when transfer strategy is stable.',drift:'Increasing spread suggests material, check-ring, temperature, restriction or machine-response instability.'}
]);

add('tooling',[
 {name:'Vent land and relief condition',purpose:'Provides a controlled gas escape path while limiting flash.',inspect:['land depth/width to approved tool design','deposit or damage','relief path blockage','end-of-fill evidence'],remember:'Cleaning a vent without preserving its designed geometry can create a new flash or gas-trap problem.'},
 {name:'Gate wear trending',purpose:'Tracks dimensional or surface change at the gate over production life.',inspect:['gate diameter/thickness','vestige appearance','fill/pressure balance','cavity-to-cavity comparison'],remember:'Slow gate wear can shift balance gradually and may look like material viscosity drift.'},
 {name:'Cooling-circuit baseline',purpose:'Records validated flow, supply/return temperature and connection identity for each circuit.',inspect:['actual flow','hose connection','pressure drop','scale/corrosion evidence'],remember:'A labelled baseline makes post-maintenance cooling faults much easier to isolate.'},
 {name:'Hot-runner branch balance check',purpose:'Compares branch/zone behaviour feeding multiple gates or cavities.',inspect:['zone actuals and outputs','gate response','manifold/nozzle heater health','cavity fill/pressure evidence'],remember:'Equal displayed temperatures do not guarantee equal delivered heat or flow resistance.'},
 {name:'Ejector-system friction baseline',purpose:'Tracks mechanical resistance through ejector movement.',inspect:['pin wear/binding','plate alignment','lubrication to approved tool practice','part drag/ejection marks'],remember:'Process changes should not be used to compensate indefinitely for mechanical binding.'},
 {name:'Cavity identification and traceability',purpose:'Keeps samples, measurements and defects tied to the cavity that produced them.',inspect:['permanent cavity marks','data-system cavity mapping','robot/nest mapping','measurement labels'],remember:'Pooled data can hide a bad cavity and can make a good cavity look less capable.'}
]);

add('machine',[
 {name:'Check-ring repeatability study',role:'Tests whether the non-return valve delivers a repeatable effective shot under controlled conditions.',watch:['transfer position','cushion','part mass or suitable process response','material leakage and wear'],evidence:'Variation should be demonstrated with repeatable evidence before compensating with shot size or packing.'},
 {name:'Pressure-limited fill detection',role:'Identifies when the machine cannot follow the commanded filling velocity because a pressure/force limit is reached.',watch:['actual velocity versus command','pressure trace near limit','fill time','short-shot pattern'],evidence:'Changing a programmed velocity has little effect if the machine remains pressure-limited.'},
 {name:'Residence-time estimate',role:'Estimates how long material remains in the barrel/hot system relative to throughput.',watch:['shot size','cycle time','barrel volume and screw geometry','stoppages and purge events'],evidence:'Residence is an estimate and should be checked against supplier thermal limits and evidence of degradation.'},
 {name:'Nozzle alignment and seat condition',role:'Maintains centred, sealed transfer from machine nozzle to sprue bushing or hot-runner interface.',watch:['leakage/drool','uneven seat marks','sprue breakage','mechanical alignment after mould change'],evidence:'A mechanical alignment problem can produce startup instability that process settings will not reliably cure.'},
 {name:'Mould-protection signature',role:'Uses low-force/low-pressure closing behaviour to detect obstruction before high clamp force is applied.',watch:['position window','force/pressure limit','time','changes after tool maintenance'],evidence:'Protection settings must remain sensitive enough to protect the actual mould and should not be defeated to avoid nuisance stops.'},
 {name:'Thermal-soak readiness',role:'Confirms barrel, hot runner and mould have reached a repeatable operating thermal state before judging process capability.',watch:['actual temperatures','heater output stabilization','mould surface/coolant condition','first-shot trends'],evidence:'A process assessed during warm-up may show drift that disappears after thermal equilibrium.'}
]);

add('quality',[
 {name:'Cavity-separated capability study',purpose:'Calculates capability by cavity when a multicavity mould can produce distinct populations.',method:['retain cavity identity','verify measurement system','check stability first','compare cavity means and spread before pooling'],caution:'A pooled Cpk can hide one weak cavity or exaggerate within-cavity variation when means differ.'},
 {name:'Measurement-system study before process adjustment',purpose:'Checks whether the measurement method is capable of detecting the process difference being acted on.',method:['define measurand and fixture','repeat measurements','include relevant operators/equipment where appropriate','review resolution, bias and repeatability'],caution:'Do not tune a stable moulding process to chase measurement noise.'},
 {name:'Measurement conditioning-time control',purpose:'Standardises when a plastic part is measured after moulding.',method:['define time from ejection','control temperature/humidity when required','document preconditioning','use the same state for comparison'],caution:'Semi-crystalline and moisture-sensitive polymers can move after moulding; mixed timing can create false process drift.'},
 {name:'Short-shot fill-pattern study',purpose:'Reveals flow sequence, hesitation, weld locations and cavity balance before full packing masks the evidence.',method:['use an approved safe study method','step fill progressively','label cavities and shot level','photograph/record flow-front changes'],caution:'Use machine/tool supplier procedures and never bypass guarding to observe a live mould.'},
 {name:'Gate-seal mass plateau study',purpose:'Finds when additional hold time no longer produces a meaningful increase in part mass under controlled conditions.',method:['hold other variables stable','increase hold time in planned steps','weigh conditioned samples consistently','confirm dimensions/quality as needed'],caution:'A mass plateau is evidence for that gate/material/process condition, not a universal time setting.'},
 {name:'Process-window study',purpose:'Maps acceptable output across deliberate variation of key controllable factors.',method:['define responses and limits','choose safe factor ranges','change factors systematically','record actuals and interactions'],caution:'Do not call a single nominal recipe a process window.'},
 {name:'Reaction plan',purpose:'Defines what operators/technicians do when a monitored variable or quality characteristic leaves its control condition.',method:['define trigger','contain affected product','verify measurement/process actuals','escalate and document disposition'],caution:'A control chart without an agreed reaction plan does not by itself control the process.'},
 {name:'Material-lot change verification',purpose:'Checks whether a new resin lot/source behaves within the validated process and product requirements.',method:['retain lot traceability','compare key incoming data','trend fill/pressure/mass and quality responses','escalate meaningful shifts'],caution:'Do not assume matching product name or nominal MFR guarantees identical moulding behaviour.'}
]);

add('safety',[
 {name:'Purge and startup exclusion zone',hazard:'Molten polymer, trapped gas or degraded material can eject from the nozzle/purge area unexpectedly.',control:['use machine guards/shields','keep people out of the line of fire','follow resin and machine purge instructions','use required heat/face PPE'],never:'Never stand directly in front of an unguarded nozzle during purge or troubleshooting.'},
 {name:'Stored hydraulic / pneumatic pressure',hazard:'Accumulator, hydraulic, pneumatic or spring energy can remain after normal stop.',control:['follow verified isolation procedure','release/block stored energy as specified','verify zero-energy state','use machine-specific documentation'],never:'Do not assume an emergency stop removes stored energy.'},
 {name:'High-pressure hydraulic leak',hazard:'A pinhole hydraulic leak can penetrate skin and may be difficult to see.',control:['isolate before inspection/repair','use safe leak-detection methods specified by site/equipment procedures','keep hands away from suspected jets','seek urgent medical response for injection injury'],never:'Never search for a high-pressure leak with bare hands.'},
 {name:'Mould change and lifting',hazard:'Heavy moulds and moving platens create crush, drop and stored-energy risks.',control:['use rated lifting points/equipment','follow site lift plan and isolation','secure mould before disconnecting services','control access to the danger zone'],never:'Do not work under a suspended mould or rely on the machine clamp as the lifting plan.'},
 {name:'Robot teach / intervention mode',hazard:'Unexpected robot or machine movement can occur inside an automated cell.',control:['use approved reduced-speed/teach procedures','maintain enabling-device and safeguarding requirements','control who can enter','apply lockout when the task requires it'],never:'Do not defeat interlocks to make repetitive intervention faster.'},
 {name:'Hot-runner electrical and thermal hazards',hazard:'Hot-runner systems combine high temperature with electrical heater circuits and stored heat.',control:['isolate electrical energy before service','allow/verify safe temperature','use qualified electrical procedures','follow manifold supplier instructions'],never:'Do not treat a controller-off indication as proof that the system is electrically isolated or cool.'}
]);

add('troubleshooting',[
 {name:'Separate global from cavity-specific causes',symptom:'Only one cavity or one region shows the defect.',sequence:['preserve cavity identity','compare cavity-local evidence first','check gate/vent/cooling/tool condition','only then expand to global machine/material causes'],verify:'If all cavities move together, a global cause becomes more plausible; if one cavity stays different, prioritise local evidence.'},
 {name:'Verify actuals before changing setpoints',symptom:'A process output changed although recipes appear unchanged.',sequence:['check actual velocity/pressure/temperature/flow','check machine limits and alarms','compare with validated trace/baseline','change only after confirming what physically changed'],verify:'A setpoint is an instruction; the actual response is the evidence.'},
 {name:'One planned change at a time',symptom:'Multiple settings have already been adjusted and the cause is unclear.',sequence:['return to a known safe baseline if possible','define one hypothesis','change one controlled factor or use a designed experiment','record response before the next change'],verify:'If several variables change together, attribution becomes weak.'},
 {name:'Post-maintenance comparison',symptom:'Quality changed after mould, machine, dryer or cooling maintenance.',sequence:['list exactly what was disturbed','verify hoses/zones/sensors/fixtures and cavity mapping','compare pre/post actuals','check mechanical setup before retuning process'],verify:'Maintenance correlation is a clue, not proof; confirm the changed physical condition.'},
 {name:'Thermal-soak first-shot drift',symptom:'Parts change through the first minutes after startup.',sequence:['trend mould/barrel/hot-runner actuals and heater outputs','observe coolant stabilization','separate purge/residence effects','judge capability only after defined steady state'],verify:'Repeatability after thermal equilibrium distinguishes warm-up drift from persistent instability.'},
 {name:'Suspected material contamination',symptom:'Unexpected streaks, specks, delamination, odour or mechanical weakness appears.',sequence:['contain suspect product/material','preserve lot and sample evidence','check feed/purge/regrind routes','do not recycle suspect mixed material until identity is controlled'],verify:'Confirm material identity/contamination with appropriate supplier or laboratory methods before declaring root cause.'},
 {name:'Short-shot map before speed chasing',symptom:'Weld line, hesitation, air trap or imbalance is unclear at full part.',sequence:['use an approved short-shot study','map flow front by cavity','compare with gate/vent geometry','then test the process hypothesis'],verify:'A progressive fill pattern provides stronger mechanism evidence than a single fully packed part.'},
 {name:'Sampling discipline for intermittent defects',symptom:'A defect appears only occasionally.',sequence:['record time, cavity, machine cycle and material lot','retain good and bad samples','capture nearby process traces/alarms','look for event correlation before averaging'],verify:'Intermittent faults are often erased when data are pooled without event timing.'}
]);

add('glossary',[
 {name:'Cavity balance',definition:'Degree to which multiple cavities fill and pack in comparable, intended ways under the same machine cycle.'},
 {name:'Cavity-specific capability',definition:'Capability assessment performed on the population from an individual cavity rather than on pooled multicavity output.'},
 {name:'Gate seal',definition:'Condition in which the gate has solidified or otherwise stopped transmitting useful packing pressure into the cavity.'},
 {name:'Pressure-limited fill',definition:'Condition where the machine reaches a pressure/force limit and can no longer follow the commanded injection velocity.'},
 {name:'Thermal soak',definition:'Time allowed for the machine, mould, hot runner and/or material system to reach a repeatable thermal state before evaluation.'},
 {name:'Measurement conditioning',definition:'Defined temperature, humidity and time state applied before measurement so results are comparable.'},
 {name:'Reaction plan',definition:'Predefined response to an out-of-control or out-of-specification condition, including containment, verification, escalation and disposition.'},
 {name:'Retained fibre length',definition:'Fibre length remaining in a moulded reinforced polymer after compounding and processing; it can differ substantially from feed-pellet fibre length.'},
 {name:'Cavity-pressure integral',definition:'Area under a cavity-pressure-versus-time trace over a defined interval; useful only with a validated sensor location, zero and correlation.'},
 {name:'Short-shot study',definition:'Controlled sequence of partially filled mouldings used to reveal the progression of the melt front and cavity balance.'}
]);

source('testing',[
 ['ISO 294-4:2018','Thermoplastic moulding and post-moulding shrinkage measured parallel and normal to flow.','https://www.iso.org/standard/70413.html'],
 ['ISO 294-5:2026','Standard specimen preparation for investigating anisotropy in injection-moulded thermoplastics.','https://www.iso.org/standard/85835.html'],
 ['ISO 1183-1:2025','Density determination methods for non-cellular plastics, including moulded parts, granules and flakes.','https://www.iso.org/standard/85977.html'],
 ['ISO 527-1:2019','General principles for tensile testing of plastics and plastic composites.','https://www.iso.org/standard/527-1'],
 ['ISO 178:2019','Published flexural-property test method for plastics; a revision was under development in 2026, so recheck before formal use.','https://www.iso.org/standard/70513.html'],
 ['ISO 179-1:2026','Current non-instrumented Charpy impact test method for plastics.','https://www.iso.org/standard/91071.html'],
 ['ISO 180:2023','Current Izod impact-strength test method for plastics.','https://www.iso.org/standard/84394.html'],
 ['ASTM D955-21','Mould shrinkage from mould dimensions under specified thermoplastic moulding conditions.','https://store.astm.org/d0955-21.html'],
 ['ASTM D638-22','Tensile properties of reinforced and unreinforced plastics under defined test conditions.','https://store.astm.org/standards/d638/1000']
]);
source('tooling',[
 ['ISO 12165:2019','Standardized terminology and symbols for compression/injection mould and die-casting tool components.','https://www.iso.org/standard/75669.html'],
 ['ISO 16916:2016','Injection-mould tool specification-sheet framework; confirmed current by ISO after its 2021 review.','https://www.iso.org/standard/68883.html']
]);
source('sensors',[
 ['Shin et al. (2025), Sensors and Actuators A','Review of in-situ process and in-line quality monitoring in injection moulding using intelligent sensors.','https://doi.org/10.1016/j.sna.2025.116248'],
 ['Zhao et al. (2024), Measurement','Review of injection-moulding measurement techniques covering machine state, melt flow and component-quality adjustment.','https://doi.org/10.1016/j.measurement.2024.114163'],
 ['Bielenberg & Stommel (2025), Polymers','Review of velocity/pressure switchover methods including pressure, deformation, ultrasonic and adaptive approaches.','https://pmc.ncbi.nlm.nih.gov/articles/PMC12030100/']
]);
source('sustainability',[
 ['Dawoud & Taha (2024), Polymers','Effects of selected polymer contamination on mechanical properties of post-industrial recycled polypropylene.','https://pmc.ncbi.nlm.nih.gov/articles/PMC11360251/'],
 ['Gas counter-pressure study on recycled PP (2024)','Study of surface/manufacturability effects for post-consumer recycled polypropylene; useful as research context, not a universal process recipe.','https://doi.org/10.1016/j.susmat.2024.e00897']
]);
source('safety',[
 ['OSHA — Horizontal injection moulding machine eTool','Machine-specific hazards and controls for guarding, servicing, hot material and feed-throat access.','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'],
 ['OSHA — Injection moulding safety tour','Illustrated guarding, purge-area, hopper/feed-throat and interlock examples.','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines/safety-tour-view-1']
]);

window.MM_REFERENCE_2026_EXPANSION={version:'2026.08.24.1',note:'Practical evidence-first expansion; no universal production setpoints.'};
})();
/* <<< reference-2026-expansion.js */

/* >>> reference-sources.js */
/* MouldMaster Reference Source Browser — 2026.08.24.1 */
(function(){
'use strict';

const EXTRA={
 tooling:[
  ['Autodesk Moldflow — Gate location','Gate-location analysis and the effect of injection location on filling and defects.','https://help.autodesk.com/cloudhelp/2026/ENU/MoldflowAdviser-CLC-Tutorials/files/Introductory-tutorials/Fill-Pack-analysis-tutorial/GUID-AA3B3176-BE1B-4E55-AF16-46FE7E803C75.html'],
  ['Autodesk Moldflow — Venting analysis','Air-pressure, air-trap and vent-location analysis during cavity filling.','https://help.autodesk.com/cloudhelp/2024/ENU/MoldflowInsight-CLC-Analyses/files/analysis-sequences/MFLO-VENTING-ANALYSIS-CPT.html'],
  ['Autodesk Moldflow — Weld and meld lines','Flow-front meeting, weld/meld-line formation and interpretation.','https://help.autodesk.com/cloudhelp/2025/ENU/MoldflowInsight-CLC-Results/files/Fill-or-flow-results/MoldflowInsight_CLC_Results_Fill_or_flow_results_Weld_and_meld_lines_result_html.html'],
  ['Autodesk Moldflow — Differential-shrinkage deflection','Warpage contribution from non-uniform shrinkage and related design/process factors.','https://help.autodesk.com/cloudhelp/2024/ENU/MoldflowAdviser-CLC-Results/files/Warp-analysis-results/MoldflowAdviser_CLC_Results_Warp_analysis_results_Deflection_differential_html.html'],
  ['Autodesk Moldflow — Cooling-circuit efficiency','Cooling-channel heat-removal efficiency and factors affecting thermal performance.','https://help.autodesk.com/cloudhelp/2024/ENU/MoldflowInsight-CLC-Results/files/Cool-analysis-results/MoldflowInsight_CLC_Results_Cool_analysis_results_Circuit_heat_removal_efficiency_html.html']
 ],
 machine:[
  ['ISO 20430:2020','Safety requirements for injection moulding machines and machine/tool interfaces.','https://www.iso.org/standard/68000.html'],
  ['HSE PPIS4(rev1)','Safety at injection moulding machines, including guarding and access.','https://www.hse.gov.uk/pubns/ppis4.pdf'],
  ['OSHA Injection Molding eTool','Machine components, hazards, guarding and safe operation context.','https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'],
  ['Kistler — Cavity pressure','Technical background on cavity-pressure measurement and process monitoring.','https://www.kistler.com/en/cavity-pressure/cavity-pressure/C00000099'],
  ['RJG — Injection molding resources','Technical learning resources on scientific moulding, cavity pressure and process development.','https://rjginc.com/resource-center/']
 ],
 quality:[
  ['NIST Engineering Statistics Handbook','SPC, capability, measurement and DOE reference.','https://www.itl.nist.gov/div898/handbook/'],
  ['NIST — Process capability','Capability indices, assumptions and interpretation prerequisites.','https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'],
  ['NIST — Control charts','Statistical process monitoring and control-chart background.','https://www.itl.nist.gov/div898/handbook/pmc/section3/pmc3.htm'],
  ['NIST — Measurement process characterization','Measurement-system and uncertainty concepts.','https://www.itl.nist.gov/div898/handbook/mpc/mpc.htm'],
  ['NIST — Experimental design','DOE principles including randomisation, blocking and interactions.','https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'],
  ['ISO 22514-2:2026','Process capability and performance for time-dependent process models.','https://www.iso.org/standard/88883.html'],
  ['ISO 22514-7:2021','Capability of measurement processes. Confirm current edition/status before formal contractual use.','https://www.iso.org/standard/80624.html']
 ],
 polymers:[
  ['ISO 1133-1:2022','MFR/MVR determination for thermoplastics under specified test conditions.','https://www.iso.org/standard/83905.html'],
  ['ASTM D1238','Melt flow rates of thermoplastics by extrusion plastometer.','https://store.astm.org/standards/d1238'],
  ['ISO 294-1:2017','General principles for injection moulding thermoplastic test specimens.','https://www.iso.org/standard/67036.html'],
  ['Trotta et al. (2021), Polymer Testing','Injection-moulding rheology and high-shear behaviour.','https://doi.org/10.1016/j.polymertesting.2021.107068'],
  ['Hu et al. (2022), Polymers','Cooling-rate effects on polypropylene crystallisation.','https://doi.org/10.3390/polym14173646'],
  ['Covestro — Drying for injection moulding','Manufacturer technical background on drying and moisture-sensitive polymers.','https://solutions.covestro.com/-/media/covestro/solution-center/whitepapers/injection-molding-of-high-quality-molded-parts-drying.pdf']
 ],
 defects:[
  ['Zhao et al. (2022)','Review of shrinkage, warpage and interacting injection-moulding process parameters.','https://pubmed.ncbi.nlm.nih.gov/35194289/'],
  ['Autodesk Moldflow — Cooling stage','Cooling, heat removal and solidification background.','https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html'],
  ['Autodesk Moldflow — Packing guidance','Packing, holding and gate-freeze background.','https://help.autodesk.com/view/MOLDFLOW/2013/ENU/caas.html?url=caas%2Fvhelp%2Fhelp-dev-autodesk-com%2Fv%2FSimulation-Moldflow%2Fenu%2F2013%2FHelp%2F3Insight-360%2F3927-Process-3927%2F3933-Profiles3933%2F3945-Packing-3945.html'],
  ['HSE PPIS13(rev1)','Control of fumes during plastics processing; relevant when thermal degradation or fumes are suspected.','https://www.hse.gov.uk/pubns/ppis13.pdf']
 ],
 sensors:[
  ['Araújo et al. (2023)','In-cavity pressure measurement for injection-moulding diagnosis and simulation correlation.','https://link.springer.com/article/10.1007/s00170-023-11100-1'],
  ['Párizs et al. (2023)','Multiple in-mould sensors for quality and process control.','https://pmc.ncbi.nlm.nih.gov/articles/PMC9920048/'],
  ['Kovács et al. (2019)','Review of in-mould sensors for injection moulding and Industry 4.0.','https://pubmed.ncbi.nlm.nih.gov/31443164/'],
  ['Weinert et al. (2023)','Condition monitoring of injection-mould tooling.','https://pmc.ncbi.nlm.nih.gov/articles/PMC9966701/']
 ],
 safety:[
  ['ISO 20430:2020','Injection moulding machine safety requirements.','https://www.iso.org/standard/68000.html'],
  ['HSE — Plastics industry guidance','UK plastics-processing safety guidance index.','https://www.hse.gov.uk/pubns/plasindx.htm'],
  ['HSE PPIS4(rev1)','Safety at injection moulding machines.','https://www.hse.gov.uk/pubns/ppis4.pdf'],
  ['HSE PPIS13(rev1)','Controlling fume during plastics processing.','https://www.hse.gov.uk/pubns/ppis13.pdf'],
  ['OSHA 1910.212','General machine guarding.','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.212'],
  ['OSHA 1910.147','Control of hazardous energy (lockout/tagout).','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'],
  ['OSHA 1910.1200','Hazard Communication standard.','https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1200'],
  ['WorkSafe NZ — Safe use of machinery','NZ machinery risk-management and safeguarding guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/'],
  ['WorkSafe NZ — Machine lockouts','NZ de-energisation and machine lockout guidance.','https://www.worksafe.govt.nz/topic-and-industry/machinery/keeping-workers-safe-with-machine-lockouts/']
 ],
 law:[
  ['UK — PUWER 1998','Official Provision and Use of Work Equipment Regulations 1998.','https://www.legislation.gov.uk/uksi/1998/2306/contents'],
  ['UK — COSHH 2002','Official Control of Substances Hazardous to Health Regulations 2002.','https://www.legislation.gov.uk/uksi/2002/2677/contents'],
  ['NZ — Health and Safety at Work Act 2015','Official NZ legislation source for PCBU duties and SFAIRP framework.','https://www.legislation.govt.nz/act/public/2015/70/en/latest/']
 ]
};

function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));}
function merge(){
  const base=window.MM_SOURCE_LIBRARY||{};
  const out={};
  for(const [cat,rows] of Object.entries({...base,...EXTRA})){
    const joined=[...(base[cat]||[]),...(EXTRA[cat]||[])];
    const seen=new Set();
    out[cat]=joined.filter(x=>{const k=x[2];if(seen.has(k))return false;seen.add(k);return true});
  }
  return out;
}
function ensure(){
  if(!document.body||document.getElementById('mm-src-open'))return;
  const SOURCES=merge();
  window.MM_REFERENCE_SOURCES=SOURCES;
  const style=document.createElement('style');
  style.textContent=`#mm-src-open{position:fixed;left:14px;bottom:58px;z-index:2147483000;border:1px solid #41658d;background:#13243a;color:#eef7ff;border-radius:999px;padding:10px 14px;font:700 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);cursor:pointer}.mmsrc{position:fixed;inset:0;z-index:2147483002;background:rgba(2,8,18,.86);display:none;align-items:center;justify-content:center;padding:14px;color:#eef7ff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}.mmsrc[data-open="1"]{display:flex}.mmsrc-panel{width:min(980px,100%);max-height:min(88vh,900px);overflow:hidden;background:#0e1a2c;border:1px solid #304866;border-radius:18px;display:flex;flex-direction:column}.mmsrc-head{padding:18px;border-bottom:1px solid #253a54}.mmsrc-top{display:flex;gap:12px;justify-content:space-between;align-items:flex-start}.mmsrc h2{margin:0;font-size:22px}.mmsrc p{color:#b8c9dc;line-height:1.45}.mmsrc-close{border:1px solid #49627e;background:#172941;color:#fff;border-radius:9px;padding:8px 11px;cursor:pointer}.mmsrc-search{width:100%;border:1px solid #3a5471;background:#081423;color:#fff;border-radius:10px;padding:10px 12px;margin-top:12px}.mmsrc-body{overflow:auto;padding:14px 18px 24px}.mmsrc-section{margin:0 0 20px}.mmsrc-section h3{margin:0 0 8px;text-transform:capitalize}.mmsrc-link{display:block;border:1px solid #2b405b;background:#111f32;border-radius:10px;padding:11px 12px;margin:7px 0;color:#eaf4ff;text-decoration:none}.mmsrc-link small{display:block;color:#a9bdd6;margin-top:4px;line-height:1.4}.mmsrc-link em{display:block;color:#72e6cd;margin-top:5px;font-size:12px}.mmsrc-note{border-left:3px solid #55d6be;background:#10283a;padding:10px 12px;font-size:12px}.mmsrc-count{font-size:12px;color:#9fb5cf}.mmsrc button:focus-visible,.mmsrc input:focus-visible,#mm-src-open:focus-visible{outline:3px solid #72e6cd;outline-offset:2px}@media(max-width:650px){.mmsrc{padding:0}.mmsrc-panel{height:100%;max-height:none;border-radius:0;border:0}.mmsrc-head{padding-top:max(14px,env(safe-area-inset-top))}}`;
  document.head.appendChild(style);
  const open=document.createElement('button');open.id='mm-src-open';open.type='button';open.textContent='References';open.setAttribute('aria-haspopup','dialog');
  const modal=document.createElement('div');modal.className='mmsrc';modal.dataset.open='0';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','MouldMaster references');
  modal.innerHTML=`<section class="mmsrc-panel"><header class="mmsrc-head"><div class="mmsrc-top"><div><h2>Authoritative References</h2><p>Full source library supporting the reference database and training explanations.</p></div><button class="mmsrc-close" type="button">Close</button></div><input class="mmsrc-search" type="search" aria-label="Search references" placeholder="Search standards, regulators, research…"></header><div class="mmsrc-body"><p class="mmsrc-note">References support mechanisms, terminology, test methods, safety duties and statistical principles. They do not create universal production setpoints. Supplier grade data, machine/tool documentation, approved procedures and current jurisdictional requirements remain controlling for specific production decisions.</p><p class="mmsrc-count"></p><div class="mmsrc-list"></div></div></section>`;
  document.body.append(open,modal);
  const search=modal.querySelector('.mmsrc-search'), list=modal.querySelector('.mmsrc-list'), count=modal.querySelector('.mmsrc-count');
  function render(){const q=search.value.trim().toLowerCase();let total=0,html='';for(const [cat,rows] of Object.entries(SOURCES)){const matches=rows.filter(x=>!q||x.join(' ').toLowerCase().includes(q));if(!matches.length)continue;total+=matches.length;html+=`<section class="mmsrc-section"><h3>${esc(cat)}</h3>${matches.map(x=>`<a class="mmsrc-link" href="${esc(x[2])}" target="_blank" rel="noopener"><b>${esc(x[0])}</b><small>${esc(x[1])}</small><em>Open source ↗</em></a>`).join('')}</section>`}count.textContent=`${total} reference${total===1?'':'s'} shown`;list.innerHTML=html||'<p>No matching references.</p>'}
  search.addEventListener('input',render);
  const close=()=>{modal.dataset.open='0';open.focus()};open.addEventListener('click',()=>{modal.dataset.open='1';render();setTimeout(()=>search.focus(),0)});modal.querySelector('.mmsrc-close').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.dataset.open==='1')close()});render();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensure,{once:true});else ensure();
})();
/* <<< reference-sources.js */

/* >>> reference-browser-ui.js */
/* MouldMaster reference browser UI polish — 2026-08-24 */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
const FILTERS=[['all','All'],['safety','Safety'],['materials','Materials'],['testing','Testing'],['automation','Automation'],['research','Research'],['sustainability','Sustainability']];
let active='all';

function kind(cat,row){
  const n=String(row?.[0]||''),u=String(row?.[2]||'').toLowerCase();
  if(/legislation\.gov|legislation\.govt\.nz/.test(u)||/\b(?:act|regulations?)\b/i.test(n)&&/^(?:UK|NZ)\s*[—-]/.test(n))return 'Law';
  if(/^(?:BS EN )?ISO\b|^ASTM\b|^ANSI\/PLASTICS\b|^AS\/NZS\b/i.test(n))return 'Standard';
  if(/^(?:HSE|OSHA|WorkSafe|FDA)\b/i.test(n))return 'Regulator';
  if(/doi\.org|pubmed\.ncbi|pmc\.ncbi|consensus\.app|link\.springer\.com\/article/i.test(u))return 'Research';
  if(/^EUROMAP\b/i.test(n))return 'Industry';
  if(/^(?:Autodesk|Kistler|RJG|Covestro)\b/i.test(n))return 'Technical';
  return 'Reference';
}
function status(row){
  const n=String(row?.[0]||'').trim().toLowerCase();
  if(n==='iso 20430:2020')return ['Current','ISO confirmed this edition current; status checked 24 Aug 2026.'];
  if(n==='bs en iso 20430:2020')return ['Under review','BSI lists this edition as Current, Under Review; status checked 24 Aug 2026.'];
  if(n==='ansi/plastics b151.1-2017')return ['Under review','PLASTICS lists the 2017 edition as published and under review for ISO 20430 alignment; checked 24 Aug 2026.'];
  if(n.includes('health and safety at work amendment act 2026'))return ['Future 2027','Enacted in 2026 with commencement on 1 April 2027.'];
  return null;
}
function groups(cat,row){
  const c=String(cat||'').toLowerCase(),t=(String(row?.[0]||'')+' '+String(row?.[1]||'')+' '+String(row?.[2]||'')).toLowerCase(),k=kind(cat,row),out=[];
  if(/safety|law/.test(c)||/guard|safety|lockout|hazard|puwer|coshh|hswa|osha|worksafe|fume/.test(t))out.push('safety');
  if(/materials?|polymers?|recycl/.test(c)||/polymer|resin|rheolog|viscos|moisture|drying|crystalli|regrind|feedstock/.test(t))out.push('materials');
  if(/stats|quality|validation|testing/.test(c)||/test method|capability|measurement|doe|statistics|validation|iso 294|iso 527|iso 178|iso 179|iso 180|iso 75|iso 306|iso 1183|iso 15512/.test(t))out.push('testing');
  if(/sensors?|automation|machine/.test(c)||/sensor|robot|opc ua|euromap 77|euromap 82|vision|condition monitoring|automation/.test(t))out.push('automation');
  if(k==='Research')out.push('research');
  if(/sustain|recycl/.test(c)||/life[- ]cycle|\blca\b|recycl|secondary feedstock|environmental|iso 140/.test(t))out.push('sustainability');
  return [...new Set(out)];
}
function matchesFilter(cat,row){return active==='all'||groups(cat,row).includes(active)}
function sourceRows(S){const rows=[];for(const [cat,list] of Object.entries(S||{}))for(const row of list||[])rows.push([cat,row]);return rows}
function badge(label,extra=''){return `<span class="mmsrc-badge"${extra}>${esc(label)}</span>`}
function card(cat,row){
  const st=status(row),k=kind(cat,row),statusHtml=st?badge(st[0],` title="${esc(st[1])}" aria-label="Status: ${esc(st[0])}. ${esc(st[1])}"`):'';
  return `<a class="mmsrc-link" href="${esc(row[2])}" target="_blank" rel="noopener"><span class="mmsrc-cardtop"><b>${esc(row[0])}</b><span class="mmsrc-badges">${badge(k)}${statusHtml}</span></span><small>${esc(row[1])}</small><em>Open source ↗</em></a>`;
}
function addStyles(){
  if(document.getElementById('mm-reference-ui-style'))return;
  const s=document.createElement('style');s.id='mm-reference-ui-style';
  s.textContent=`
.mmsrc-panel{position:relative}.mmsrc-head{flex:none;padding:14px 16px 11px}.mmsrc-top{align-items:center;gap:9px}.mmsrc h2{font-size:20px;line-height:1.14;letter-spacing:-.2px}.mmsrc-top p{margin:5px 0 0;font-size:13px;line-height:1.35;max-width:650px}.mmsrc-close{flex:0 0 auto;min-height:34px;padding:6px 10px;border-radius:8px;font:600 14px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif}.mmsrc-search{min-height:42px;margin-top:9px;padding:9px 11px;font-size:15px;line-height:1.2}.mmsrc-search::placeholder{color:#9aadc3;opacity:1}.mmsrc-filters{display:flex;gap:6px;overflow-x:auto;overscroll-behavior-inline:contain;margin-top:8px;padding:0 0 2px;scrollbar-width:none}.mmsrc-filters::-webkit-scrollbar{display:none}.mmsrc-filter{flex:0 0 auto;border:1px solid #36506e;background:#101f32;color:#b9cbe0;border-radius:999px;padding:6px 9px;font:650 11px/1 system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;white-space:nowrap}.mmsrc-filter[aria-pressed="true"]{background:#17364a;border-color:#55d6be;color:#eafffb}.mmsrc-body{padding:10px 16px 74px;scroll-behavior:smooth}.mmsrc-note{margin:0 0 8px;padding:9px 10px;font-size:11.5px;line-height:1.42}.mmsrc-count{margin:0 0 9px;font-size:10.5px;line-height:1.2;color:#91a7c0}.mmsrc-section{margin:0 0 15px}.mmsrc-section h3{margin:0 0 6px;font-size:17px;line-height:1.2}.mmsrc-link{padding:9px 10px;margin:5px 0;border-radius:9px}.mmsrc-cardtop{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;flex-wrap:wrap}.mmsrc-cardtop>b{font-size:15px;line-height:1.24}.mmsrc-link small{font-size:12.5px;line-height:1.34;margin-top:3px}.mmsrc-link em{font-size:11.5px;margin-top:4px}.mmsrc-badges{display:flex;gap:4px;flex-wrap:wrap}.mmsrc-badge{display:inline-flex;align-items:center;min-height:20px;border:1px solid #3a526d;background:#0c1a2a;color:#aac2d8;border-radius:999px;padding:3px 6px;font:650 9.5px/1 system-ui,-apple-system,"Segoe UI",sans-serif;white-space:nowrap}.mmsrc-topbtn{position:absolute;z-index:4;right:14px;bottom:14px;min-height:36px;border:1px solid #45617f;background:#132940;color:#eaf5ff;border-radius:999px;padding:7px 11px;font:700 12px/1 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.3);opacity:0;transform:translateY(6px);pointer-events:none;transition:opacity .15s ease,transform .15s ease}.mmsrc-topbtn[data-show="1"]{opacity:1;transform:none;pointer-events:auto}.mmsrc-filter:focus-visible,.mmsrc-topbtn:focus-visible{outline:3px solid #72e6cd;outline-offset:2px}
@media(max-width:650px){.mmsrc-head{padding:max(9px,env(safe-area-inset-top)) 12px 9px}.mmsrc-top{gap:7px}.mmsrc h2{font-size:18px;line-height:1.1}.mmsrc-top p{font-size:12px;line-height:1.3;margin-top:4px}.mmsrc-close{min-height:31px;padding:5px 8px;font-size:12.5px}.mmsrc-search{min-height:39px;margin-top:7px;padding:8px 10px;font-size:14px}.mmsrc-filters{margin-top:7px}.mmsrc-filter{padding:5px 8px;font-size:10.5px}.mmsrc-body{padding:8px 12px calc(70px + env(safe-area-inset-bottom))}.mmsrc-note{font-size:11px;padding:8px 9px;margin-bottom:7px}.mmsrc-count{margin-bottom:8px}.mmsrc-section{margin-bottom:13px}.mmsrc-section h3{font-size:16px}.mmsrc-link{padding:8px 9px;margin:4px 0}.mmsrc-cardtop>b{font-size:14px}.mmsrc-link small{font-size:12px}.mmsrc-link em{font-size:11px}.mmsrc-badge{font-size:9px}.mmsrc-topbtn{right:12px;bottom:max(11px,env(safe-area-inset-bottom))}}
@media(prefers-reduced-motion:reduce){.mmsrc-topbtn{transition:none}.mmsrc-body{scroll-behavior:auto}}
`;
  document.head.appendChild(s);
}
function enhance(){
  const modal=document.querySelector('.mmsrc'),S=window.MM_REFERENCE_SOURCES;if(!modal||!S||modal.dataset.uiPolished==='1')return false;
  modal.dataset.uiPolished='1';addStyles();
  const head=modal.querySelector('.mmsrc-head'),search=modal.querySelector('.mmsrc-search'),list=modal.querySelector('.mmsrc-list'),count=modal.querySelector('.mmsrc-count'),body=modal.querySelector('.mmsrc-body'),open=document.getElementById('mm-src-open');
  if(!head||!search||!list||!count||!body)return false;
  const filters=document.createElement('div');filters.className='mmsrc-filters';filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter references');head.appendChild(filters);
  const top=document.createElement('button');top.type='button';top.className='mmsrc-topbtn';top.textContent='↑ Top';top.setAttribute('aria-label','Back to top of references');top.dataset.show='0';modal.querySelector('.mmsrc-panel')?.appendChild(top);
  const allRows=sourceRows(S);
  function chipCount(id){return id==='all'?allRows.length:allRows.filter(([cat,row])=>groups(cat,row).includes(id)).length}
  function drawFilters(){filters.innerHTML=FILTERS.map(([id,label])=>`<button type="button" class="mmsrc-filter" data-filter="${id}" aria-pressed="${active===id?'true':'false'}">${esc(label)} <span aria-hidden="true">${chipCount(id)}</span></button>`).join('')}
  function renderEnhanced(){
    const q=search.value.trim().toLowerCase();let total=0,html='';
    for(const [cat,rows] of Object.entries(S)){
      const matches=(rows||[]).filter(row=>matchesFilter(cat,row)&&(!q||row.join(' ').toLowerCase().includes(q)));
      if(!matches.length)continue;total+=matches.length;html+=`<section class="mmsrc-section"><h3>${esc(cat)}</h3>${matches.map(row=>card(cat,row)).join('')}</section>`;
    }
    const label=FILTERS.find(x=>x[0]===active)?.[1]||'All';
    count.textContent=`${total} reference${total===1?'':'s'} shown${active==='all'?'':` · ${label}`}`;
    list.innerHTML=html||'<p>No matching references for this filter.</p>';
    drawFilters();
  }
  filters.addEventListener('click',e=>{const b=e.target.closest('.mmsrc-filter');if(!b)return;active=b.dataset.filter||'all';renderEnhanced();body.scrollTo({top:0,behavior:'smooth'})});
  search.addEventListener('input',renderEnhanced);
  open?.addEventListener('click',()=>requestAnimationFrame(renderEnhanced));
  body.addEventListener('scroll',()=>{top.dataset.show=body.scrollTop>420?'1':'0'});
  top.addEventListener('click',()=>{body.scrollTo({top:0,behavior:'smooth'});search.focus({preventScroll:true})});
  renderEnhanced();
  window.MM_REFERENCE_BROWSER_UI={version:'2026-08-24',filters:FILTERS.map(x=>x[0]),sourceTypeBadges:true,verifiedStatusBadges:true,backToTop:true,mobileCompact:true};
  return true;
}
function start(){if(enhance())return;let tries=0;const id=setInterval(()=>{tries++;if(enhance()||tries>40)clearInterval(id)},50)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
/* <<< reference-browser-ui.js */

/* >>> diagnostic-learning-labs.js */
/* MouldMaster Diagnostic Learning Labs — evidence-first, answer-cue-balanced practice */
(function(){
'use strict';

const VERSION='2026.08.30.2';
const STORAGE_BASE='mm_diagnostic_labs_v1';
const C=(text,feedback,correct=false)=>({text,feedback,...(correct?{correct:true}:{})});
const ORDER={0:[0,1,2,3],1:[1,0,2,3],2:[1,2,0,3],3:[1,2,3,0]};
function S(stage,question,correctText,correctFeedback,wrong,pos){
  const raw=[C(correctText,correctFeedback,true),...wrong.map(x=>C(x[0],x[1]))];
  return {stage,question,choices:ORDER[pos].map(i=>raw[i])};
}

const LABS=[
  {
    id:'cavity-short-shot',title:'One cavity is short',level:'Intermediate',focus:'Local vs global evidence',
    summary:'An 8-cavity PA66-GF30 mould runs with stable overall fill time and pressure, but cavity 8 is repeatedly short.',
    evidence:['Cavities 1–7 fill normally.','Cavity 8 is consistently short at the same end-of-fill area.','Overall fill time and peak pressure are stable.','Material condition checks are within the approved requirement.'],
    related:['Short shot','Cavity-to-cavity imbalance','Reject pattern by cavity/time','Gate','Vent'],
    steps:[
      S('Observe','What does the evidence point to first?','A local flow-path or venting condition at cavity 8','Correct. A repeatable one-cavity defect with stable global signals makes a local branch, gate, runner or vent condition the strongest first hypothesis.',[
        ['A system-wide barrel-temperature shift that should influence multiple cavities in a similar way','A global thermal shift is less consistent with seven cavities remaining normal.'],
        ['A packing-stage holding-pressure deficit after the velocity-controlled filling phase has ended','Holding pressure acts after filling and does not explain why only one cavity repeatedly fails to complete fill.'],
        ['A clamp-force shortfall expected to show broader mould-opening or flash evidence across the tool','Clamp force is not the strongest explanation for a cavity-specific short shot with otherwise stable behaviour.']
      ],1),
      S('Best next test','Which check gives the most diagnostic information next?','Compare cavity 8 gate, runner and vent condition with a known-good cavity','Correct. Preserve cavity identity and compare the local flow path before changing a stable global process.',[
        ['Raise the barrel-temperature profile across the machine and judge whether all cavities respond together','That changes the full process before the local restriction hypothesis is tested.'],
        ['Increase hold time and use packed part mass as the main indicator even though cavity 8 is short during fill','Hold-time changes cannot restore material that never reached the end of the cavity during filling.'],
        ['Increase clamp force and use mould-opening response as the primary test of the cavity-specific short shot','That does not directly test the suspected local restriction or venting mechanism.']
      ],3),
      S('Controlled response','If the local restriction is confirmed, what is the best learning principle?','Correct the local restriction, then verify the validated process response','Correct. Fix the confirmed mechanism and demonstrate recovery rather than hiding it with unrelated global adjustments.',[
        ['Increase injection pressure until cavity 8 fills, accepting higher load across the otherwise stable cavities','That can mask a tooling problem and expose stable cavities or the mould to unnecessary load.'],
        ['Change injection speed, pressure and temperature together so the symptom is removed as quickly as possible','Multiple simultaneous changes destroy the evidence needed to learn which factor mattered.'],
        ['Ignore cavity identity and accept the pooled shot weight as proof that all cavities are filling correctly','Pooled shot data can hide one weak cavity and erase the most diagnostic pattern.']
      ],0),
      S('Explain','Why is cavity identity so useful?','It preserves cavity identity, separating local from system-wide causes','Correct. Location-specific patterns help distinguish local tooling/flow-path mechanisms from machine, material or thermal changes that affect the whole shot.',[
        ['It proves the material condition is correct whenever seven of eight cavities continue to fill normally','Cavity identity narrows the mechanism but does not prove every other input is correct.'],
        ['It means machine actuals no longer need to be reviewed once the defect is assigned to a single cavity','Machine actuals still help confirm that global filling behaviour remained stable.'],
        ['It identifies the exact production setting that should be changed without any confirming inspection or controlled test','Location guides diagnosis; it does not provide a universal setting or eliminate confirmation.']
      ],2)
    ]
  },
  {
    id:'splay-moisture',title:'Silver streaks after a material change',level:'Intermediate',focus:'Material condition and evidence',
    summary:'Silver streaks appear after a new lot of moisture-sensitive resin is loaded. The dryer display looks normal.',
    evidence:['The defect began soon after the material-lot change.','Dryer set temperature and displayed dew point look normal.','No confirmed resin moisture measurement has been taken.','The defect appears as silver streaking rather than an incomplete fill.'],
    related:['Splay / silver streaks','Material moisture actual','Dryer dew point / air condition','Material-lot change verification'],
    steps:[
      S('Observe','What is the most important uncertainty?','Whether actual resin moisture meets the exact grade requirement','Correct. Dryer displays are supporting evidence; the unresolved variable is the actual material condition reaching the machine.',[
        ['Whether clamp force has fallen enough to change the moulding response after the material-lot change','Clamp force is poorly connected to the material-handling timing and silver-streak pattern.'],
        ['Whether cooling time has become excessive and is creating the observed silver streak pattern after fill','Cooling time is not the strongest first explanation for streaking that begins with material exposure.'],
        ['Whether ejector speed changed during the same shift and is marking the part after it leaves the cavity','Ejection occurs after the streak-forming melt behaviour and does not fit the timing evidence.']
      ],2),
      S('Best next test','Which test is strongest?','Measure resin moisture and verify the drying/handling path','Correct. Direct material-condition evidence plus the handling path discriminates moisture from filling or tooling alternatives.',[
        ['Treat the normal displayed dew point as sufficient proof that dry resin is reaching the machine hopper','A normal dryer display alone does not prove that the pellets at the machine meet the grade moisture limit.'],
        ['Increase injection pressure and judge the streak response without first checking the material condition','That changes filling without testing the moisture hypothesis raised by the handling history.'],
        ['Polish the mould surface and use the cosmetic change as the primary test of the moisture hypothesis','Surface tooling is a weak first test when the defect timing points toward material condition.']
      ],0),
      S('Controlled response','If excessive moisture is confirmed, what is the correct principle?','Restore approved conditioning, verify moisture, then reassess','Correct. Use the exact grade and site-approved requirement, confirm the actual material state, and only then judge the moulding response.',[
        ['Apply one fixed drying cycle to every nylon grade so material handling is standardised across jobs','Drying requirements are grade-, equipment- and handling-specific rather than one universal recipe.'],
        ['Raise melt temperature to drive moisture out during plasticising and judge the part appearance afterward','Processing wet moisture-sensitive resin can cause degradation; barrel heat is not a safe substitute for conditioning.'],
        ['Mask the visible streaking with colour adjustment while leaving the material-conditioning uncertainty unresolved','That hides appearance without correcting or verifying the material mechanism.']
      ],3),
      S('Explain','What is the main lesson from the normal dryer display?','Displayed dryer values are not verified resin condition','Correct. Setpoints and displayed air conditions are useful context, but they are not the same as an independently verified material actual.',[
        ['Dryer instrumentation should be disregarded completely because it cannot contribute useful evidence about air condition','Dryer data are useful when interpreted with airflow, residence, handling and direct moisture evidence.'],
        ['Material-lot changes can be ignored once the dryer has returned to its normal screen values','Lot and handling history remain relevant even when displayed dryer conditions recover.'],
        ['Silver streaking has one universal cause, so independent material and process checks are unnecessary','Splay can arise from moisture, contamination, volatiles, degradation or air entrainment.']
      ],1)
    ]
  },
  {
    id:'pressure-limited-fill',title:'The machine is not following the speed setting',level:'Advanced',focus:'Setpoint vs actual',
    summary:'A technician increases programmed injection velocity, but actual fill time hardly changes and the actual velocity trace remains below command.',
    evidence:['Commanded velocity was increased.','Actual velocity remains below the command during the same region of fill.','Injection pressure is running near the machine/process limit.','Fill time changes very little.'],
    related:['Injection velocity actual','Peak injection pressure','Pressure-limited fill detection','Machine setpoints vs actuals'],
    steps:[
      S('Observe','What mechanism best fits?','The fill is pressure-limited and cannot achieve commanded velocity','Correct. The command rises but the achieved velocity does not, while pressure demand is near the applicable limit.',[
        ['The controller is ignoring the programmed velocity profile and should be treated as failed without further checks','The actual trace and pressure demand support a capability/pressure limitation before a controller-failure claim.'],
        ['Holding time is controlling screw velocity during the velocity-controlled filling phase of the cycle','Holding occurs after the filling phase and is not the command that sets injection velocity.'],
        ['Clamp force is determining the injection velocity because mould restraint directly sets screw speed','Clamp force restrains mould opening; it does not command screw velocity.']
      ],3),
      S('Best next test','What should be compared next?','Compare commanded and actual velocity with pressure demand and limit','Correct. Those signals directly test whether the machine is following the requested profile within the approved capability envelope.',[
        ['Review only the programmed velocity setpoint and assume the physical fill response should match that screen value','The problem is specifically a mismatch between command and achieved response, so setpoint alone is insufficient.'],
        ['Use total cycle time alone as the deciding signal even if the fill phase changes independently','Total cycle time can remain similar while the filling phase is pressure-limited.'],
        ['Use clamp tonnage alone to determine whether the machine can follow the requested injection-velocity profile','Clamp tonnage does not establish injection-velocity following capability.']
      ],1),
      S('Controlled response','What is the right diagnostic principle?','Find the cause of high pressure demand before requesting more speed','Correct. Investigate material state, restriction, thermal condition and machine capability before demanding an unattainable response.',[
        ['Continue raising the velocity command until the displayed setpoint is well above the actual machine capability','A command above achievable capability does not create the intended actual velocity.'],
        ['Raise all available machine pressure and force limits before identifying why the process demand increased','Limits may protect machine, mould, material or process capability and should not be bypassed as a diagnostic shortcut.'],
        ['Ignore the actual velocity trace and tune from the saved recipe because commands define the physical process','Commands are not proof of the achieved physical process; the actual trace is central evidence.']
      ],2),
      S('Explain','Why are actuals important for process transfer?','Actual process response, not copied setpoints, defines transfer','Correct. Transfer should reproduce relevant physical outputs and remain within the receiving machine capability, not merely copy screen numbers.',[
        ['Actuals make material-condition data unnecessary because machine response alone fully describes the process','Material condition remains part of the moulding system and can alter the achieved response.'],
        ['Actual measurements are only relevant on electric machines and can be ignored on hydraulic equipment','Measured process response is useful across machine architectures.'],
        ['Actual process traces make runner, gate and tooling pressure losses irrelevant during machine-to-machine transfer','Tooling geometry and local pressure loss remain critical even when machine actuals are available.']
      ],0)
    ]
  },
  {
    id:'check-ring-repeatability',title:'Cushion and part mass are wandering',level:'Advanced',focus:'Shot-delivery repeatability',
    summary:'Cycle-to-cycle cushion, transfer position and part mass vary while programmed settings remain unchanged.',
    evidence:['Cushion varies more than normal.','Transfer position and part mass move with the variation.','The programmed recipe has not changed.','The variation repeats over consecutive cycles.'],
    related:['Cushion','Transfer position','Part mass','Check-ring repeatability study','Non-return valve / check ring'],
    steps:[
      S('Observe','Which system deserves early investigation?','Shot-delivery and check-ring repeatability','Correct. Coupled movement in cushion, transfer and mass is strong evidence to investigate effective shot delivery and non-return-valve repeatability.',[
        ['Mould-surface texture variation that would change appearance without explaining cushion, transfer and mass movement','Texture does not explain the coupled process-signal movement shown here.'],
        ['Robot take-out timing variation occurring after moulding but coinciding with the observed shot-delivery drift','Robot timing can affect handling but not this linked shot-delivery signature.'],
        ['Clamp-opening speed variation after cooling that would not normally create the coupled filling signals shown','Clamp opening occurs after the shot is formed and is not linked to cushion/transfer variation.']
      ],0),
      S('Best next test','What is the best learning-oriented test?','Run a repeatability study of transfer, cushion and part mass','Correct. A sequence of aligned shot-delivery responses can demonstrate repeatability before any compensating process change.',[
        ['Increase shot size until average mass returns to target and then treat the higher average as proof of repeatability','Changing the average can hide cycle-to-cycle instability rather than identify it.'],
        ['Change shot size and holding pressure together, then compare only the final average part mass','Changing multiple factors makes the shot-delivery mechanism harder to isolate.'],
        ['Judge the system from one cycle and assume that a single acceptable cushion value represents repeatability','Repeatability requires a sequence of cycles, not one acceptable observation.']
      ],2),
      S('Controlled response','If a mechanical repeatability problem is confirmed, what should happen?','Repair the repeatability cause, then restore the validated process','Correct. Stable process development depends on stable shot delivery; correct the mechanical cause before tuning around it.',[
        ['Build a new process recipe around the unstable shot-delivery behaviour and accept the mechanical variation as baseline','A recipe cannot make an unstable mechanical delivery system repeatable.'],
        ['Increase clamp force to compensate for the changing cushion and part mass even though clamp behaviour is not implicated','Clamp force is unrelated to non-return-valve sealing repeatability.'],
        ['Stop recording cushion so the remaining process data appear more stable during production review','Removing a useful signal hides evidence instead of correcting the instability.']
      ],1),
      S('Explain','Why trend several signals together?','Converging signals strengthen or weaken a suspected mechanism','Correct. Independent responses that move together provide stronger diagnostic evidence than one isolated number.',[
        ['Correlated movement guarantees one unique root cause and removes the need to test alternative explanations','Correlation strengthens a hypothesis but does not guarantee a single cause.'],
        ['Trending process signals replaces physical inspection and maintenance checks once a statistical pattern appears','Process data and physical inspection complement each other.'],
        ['Multiple signals make the time sequence unimportant even when the problem is intermittent or drifting','Time sequence is often essential for understanding drift and intermittency.']
      ],3)
    ]
  },
  {
    id:'cooling-warpage',title:'Warpage grows after mould maintenance',level:'Intermediate',focus:'Thermal balance',
    summary:'A part begins warping after mould maintenance even though the machine recipe is unchanged.',
    evidence:['Warpage increased immediately after mould maintenance.','The programmed recipe is unchanged.','One cooling circuit shows lower flow than its validated baseline.','Mould-surface temperatures are less balanced than before.'],
    related:['Warpage','Cooling-circuit flow','Cooling-circuit baseline','Mould-surface temperature'],
    steps:[
      S('Observe','What evidence is strongest?','The post-maintenance cooling-flow and thermal imbalance','Correct. Timing plus a measured circuit-flow and local-temperature change supports a thermal mechanism more strongly than unchanged commands.',[
        ['The unchanged injection-speed command, despite no evidence that filling behaviour changed after maintenance','An unchanged setpoint is background information, not the strongest cause evidence.'],
        ['The part colour, treated as the primary explanation despite the measured cooling-circuit change','Colour alone does not explain the measured circuit and thermal imbalance.'],
        ['The operator shift, even though the symptom began with a documented physical maintenance intervention','The maintenance-linked physical evidence is stronger than a shift association.']
      ],1),
      S('Best next test','What should be checked before process adjustment?','Verify circuit routing, flow, temperatures and local thermal balance','Correct. Confirm that the cooling system returned to its validated configuration before changing a previously stable recipe.',[
        ['Increase hold pressure immediately and judge warpage before checking whether the cooling circuit returned to baseline','That changes packing without testing the measured thermal imbalance.'],
        ['Increase injection velocity globally even though fill behaviour remained stable across the maintenance event','That does not explain the post-maintenance circuit-flow change.'],
        ['Ignore the measured flow difference because surface temperatures are close enough to the previous average','Temperature alone can mask a flow problem until local thermal balance shifts.']
      ],3),
      S('Controlled response','If a circuit is misconnected or restricted, what is the preferred response?','Restore the cooling circuit baseline, then verify part response','Correct. Restore the physical cooling condition and verify temperature, dimensions, warpage and process stability.',[
        ['Make a permanent packing-pressure compensation so production can continue without correcting the changed cooling condition','That can hide the cooling fault and introduce new residual-stress or dimensional effects.'],
        ['Lengthen cooling time until the symptom is hidden, without identifying whether a connection or restriction changed','More time may mask symptoms but does not correct the changed circuit condition.'],
        ['Increase mould-close force and treat the mechanical closing system as the primary control for coolant flow','Clamp closing force does not restore coolant routing or flow.']
      ],0),
      S('Explain','Why is a cooling baseline valuable?','A baseline makes cooling changes measurable rather than speculative','Correct. A known-good circuit and thermal reference makes post-maintenance routing, blockage and balance changes easier to isolate.',[
        ['A cooling baseline means mould temperature should never vary and any change automatically indicates a failed circuit','Thermal systems vary; a baseline provides context for meaningful change rather than a no-variation rule.'],
        ['A cooling baseline replaces dimensional and warpage inspection once flow and temperature values are recorded','Part-quality responses remain essential to deciding whether the process is acceptable.'],
        ['A cooling baseline provides one universal coolant-flow target that can be copied to any mould and circuit','Cooling requirements remain mould-, circuit- and product-specific.']
      ],2)
    ]
  },
  {
    id:'gate-seal-study',title:'Does more hold time still help?',level:'Advanced',focus:'Scientific moulding study design',
    summary:'A learner wants to know whether extra hold time still changes the packed part after the gate has stopped transmitting useful pressure.',
    evidence:['The process is otherwise stable.','Part mass is measured with a consistent method.','Hold time can be varied in controlled steps.','The exact gate/material/process condition must be studied rather than assumed.'],
    related:['Gate-seal study','Part mass','Process window study','Hold pressure actual'],
    steps:[
      S('Observe','What response is useful for a basic gate-seal study?','Part mass across controlled hold-time steps','Correct. A repeatable part-mass plateau is useful evidence that additional hold time is no longer adding measurable material for the tested condition.',[
        ['Only the programmed hold-time value, without measuring whether the part or process response changes','A study needs a measured response, not the input value by itself.'],
        ['Only total cycle time, even though it does not show whether additional material still passes through the gate','Cycle time does not establish whether packing material is still transmitted through the gate.'],
        ['Only clamp-force data, despite clamp load not being the response used to establish effective gate seal','Clamp force is not the primary response for this study.']
      ],2),
      S('Best next test','How should the study be run?','Vary hold time alone and record a repeatable response','Correct. A controlled factor, stable important conditions and repeated response data make the gate-seal evidence interpretable.',[
        ['Change hold time, holding pressure and cooling together, then attribute any result to the time change','That confounds the study and makes causal interpretation weak.'],
        ['Use one shot at each condition and assume that a single observation is enough despite process variation','A single observation can be misleading when process or measurement variation is present.'],
        ['Copy the gate-seal time from another mould even though gate geometry, resin and thermal condition differ','Gate-seal behaviour is specific to the gate, resin, geometry and thermal condition.']
      ],0),
      S('Controlled response','What does a repeatable mass plateau mean?','Extra hold time no longer adds meaningful part mass','Correct. Under the studied stable condition, additional hold time is no longer producing a meaningful mass response; relevant dimensions and quality still require verification.',[
        ['The same hold time is now proven correct for every resin, gate geometry and moulding condition','The conclusion is specific to the tested material, geometry and process state.'],
        ['Holding pressure can be ignored completely once a mass plateau has appeared in the time study','Pressure magnitude and transmission remain relevant; the study addresses the time response being tested.'],
        ['Cooling time should automatically be set equal to the observed hold-time plateau for production','Cooling and gate seal are governed by different response criteria.']
      ],3),
      S('Explain','Why is this better than guessing?','It links a controlled input change to a measured response','Correct. This is the scientific-moulding principle of relating a deliberate input to a repeatable measured outcome.',[
        ['It guarantees full product validation from one gate-seal study without the remaining quality and capability evidence','A gate-seal study is one component of process-development evidence, not complete validation.'],
        ['It removes the need to verify material, machine and supplier constraints because the part-mass response is sufficient','Material and equipment limits still define the allowable study and production space.'],
        ['It proves longer hold time is universally harmful rather than establishing a condition-specific response plateau','The result is condition-specific and does not make longer hold universally wrong.']
      ],1)
    ]
  },
  {
    id:'measurement-noise',title:'The dimension moves — or does it?',level:'Advanced',focus:'Measurement system thinking',
    summary:'A critical dimension appears to drift, but repeated measurements of the same parts vary almost as much as the reported process change.',
    evidence:['Different operators obtain noticeably different values on the same parts.','Measurement timing after moulding is inconsistent.','The apparent process shift is small compared with measurement spread.','The moulding process signals themselves look stable.'],
    related:['Measurement system analysis','Measurement-system study before process adjustment','Measurement conditioning-time control','Dimensional drift'],
    steps:[
      S('Observe','What should be questioned first?','Whether the measurement can resolve the reported process shift','Correct. Adjustment and capability decisions are unreliable if measurement variation is comparable with the apparent process change.',[
        ['Whether injection pressure should be changed before verifying that the dimensional measurement is repeatable','Changing a stable process before verifying measurement can turn gauge noise into real process variation.'],
        ['Whether the mould surface should be reworked even though operator-to-operator measurement spread is already evident','The direct evidence points first to measurement-system adequacy, not mould rework.'],
        ['Whether robot speed should be adjusted because the measured dimension varies between operators','Robot speed is not supported by the operator-to-operator measurement evidence.']
      ],3),
      S('Best next test','What should be standardised and studied?','Standardise method, fixture, conditioning and MSA checks','Correct. Establish resolution, repeatability, reproducibility, method, fixture and conditioning before interpreting small process shifts.',[
        ['Review only the machine setpoint screen and assume a stable recipe proves the dimensional reading is accurate','Machine setpoints do not establish measurement-system capability.'],
        ['Average all readings together without separating operator, timing, fixture or repeatability effects','Averages can hide a measurement system that is not repeatable or reproducible.'],
        ['Use drawing tolerance alone to decide whether the measurement system is capable of supporting the decision','Tolerance matters, but a capable method must still be demonstrated.']
      ],1),
      S('Controlled response','What is the safest process-learning principle?','Verify the measurement before adjusting a stable process','Correct. Establish that the signal is real, then reassess the process evidence before making a production change.',[
        ['Adjust the moulding process after every individual reading so the process follows the measurement in real time','That can create real process variation in response to measurement noise.'],
        ['Tighten process-control limits until the chart looks better, without establishing whether the gauge is resolving change','Control limits do not improve the measurement system.'],
        ['Stop measuring the characteristic so measurement variation no longer appears in the process review','The objective is trustworthy measurement, not removal of quality evidence.']
      ],2),
      S('Explain','Why can conditioning time matter for plastic parts?','Plastic dimensions can change during post-mould conditioning','Correct. Temperature, crystallisation and moisture state can continue changing after ejection, depending on the polymer and specification.',[
        ['All plastic dimensions become fixed at ejection, so later changes must be measurement error or machine drift','Many polymers continue thermal, crystalline or moisture-related dimensional change after moulding.'],
        ['Conditioning is only relevant to metals and does not affect polymer temperature, moisture or crystallisation state','Plastics can be strongly affected by temperature and moisture history.'],
        ['Conditioning time directly sets machine injection pressure and therefore should be treated as a machine parameter','Conditioning affects the part measurement state, not the machine pressure setpoint.']
      ],0)
    ]
  },
  {
    id:'hot-runner-imbalance',title:'One hot-runner branch behaves differently',level:'Very Advanced',focus:'Thermal/flow evidence',
    summary:'Two cavities fed by one branch begin filling differently even though displayed hot-runner temperatures appear equal.',
    evidence:['The imbalance is repeatable by branch/cavity.','Displayed zone temperatures are close to setpoint.','One controller zone shows unusually high output compared with its peer.','The machine fill trace remains stable overall.'],
    related:['Hot-runner zone actuals','Hot-runner branch balance check','Hot-runner manifold','Cavity-to-cavity pressure delta'],
    steps:[
      S('Observe','Why is equal displayed temperature not enough?','Near-setpoint temperature does not prove equal delivered branch condition','Correct. Heater output, heat loss, local restriction and delivered melt condition can differ even while a sensor reads close to setpoint.',[
        ['Hot-runner systems cannot affect cavity balance, so branch-specific fill differences must originate elsewhere','Hot-runner branch condition can directly affect delivered heat and pressure loss.'],
        ['Every thermocouple should be treated as incorrect whenever two cavities supplied by one branch behave differently','The lesson is to combine sensor, controller and branch-response evidence, not distrust every thermocouple.'],
        ['Clamp force determines manifold temperature and should be adjusted before reviewing heater output or branch response','Clamp force is unrelated to manifold heater control.']
      ],0),
      S('Best next test','What should be compared?','Compare zone actual/output, branch response and cavity pressure/fill','Correct. Relate controller demand and temperature actuals to branch/gate and cavity response so the local thermal/flow hypothesis can be tested.',[
        ['Compare only the temperature setpoints because equal commands establish that each branch receives equal melt condition','Equal setpoints do not establish equal heater output, sensor condition or delivered melt state.'],
        ['Use only total shot weight even though pooled mass can hide opposite cavity-to-cavity fill differences','Combined mass can hide branch and cavity imbalance.'],
        ['Use only cooling time and ignore fill-stage branch evidence because temperature problems occur after filling','The observed imbalance is occurring in the hot-runner/filling path, so fill-stage evidence is directly relevant.']
      ],2),
      S('Controlled response','What should happen if a heater/thermocouple or branch fault is confirmed?','Repair the local hardware/control fault, then verify branch balance','Correct. Restore the physical/control system with approved procedures and demonstrate local recovery before rewriting the validated recipe.',[
        ['Keep increasing the affected zone setpoint until the branch fills, without confirming heater or thermocouple health','Blindly raising setpoint can worsen thermal history and does not establish the fault mechanism.'],
        ['Raise all barrel-zone temperatures to compensate for the local branch while preserving the faulty hot-runner state','That changes the global thermal condition to hide a local hardware problem.'],
        ['Increase clamp force and use the change in mould restraint as the primary response to a hot-runner control fault','Clamp force cannot repair a heater, thermocouple or branch restriction.']
      ],1),
      S('Explain','What broader troubleshooting habit does this teach?','Use location, timing and multiple signals to separate local from global faults','Correct. Good diagnosis asks where the change occurs, when it appears and which independent actuals move with it.',[
        ['Change the easiest available setting first and treat any short-term improvement as proof of root cause','Ease of adjustment is not evidence of causality.'],
        ['Treat displayed values as untrustworthy whenever one sensor disagrees with the observed part behaviour','Displayed values remain useful when interpreted with sensor limitations and independent evidence.'],
        ['Create a new process recipe for each defect instead of checking whether material, tooling or equipment changed','Many defects originate in material, tooling, maintenance or equipment conditions that should be corrected directly.']
      ],3)
    ]
  },
  {
    id:'local-flash',title:'Flash only at one shutoff',level:'Intermediate',focus:'Mechanism before adjustment',
    summary:'Flash appears repeatedly at one local shutoff after tool work while the rest of the parting line remains clean.',
    evidence:['Flash is confined to one shutoff/parting-line location.','The symptom began after tool work.','Other cavities/regions remain acceptable.','No broad rise in cavity-filling demand is evident.'],
    related:['Flash','Parting line','Mould support / pillars','Process audit trail'],
    steps:[
      S('Observe','What should be suspected first?','A local shutoff seating, damage or support condition','Correct. Location and timing favour a local tooling mechanism before a whole-process clamp or packing explanation.',[
        ['A global clamp-force shortage that should normally create broader mould-opening or flash evidence','A global clamp deficit is less consistent with one post-service shutoff being affected.'],
        ['A material-drying problem that would be expected to affect resin condition rather than one repaired shutoff','Material moisture does not fit the local flash location and tool-work timing.'],
        ['A robot-vacuum fault occurring after moulding that cannot create flash at a specific shutoff interface','Robot vacuum acts after moulding and cannot create flash at the shutoff interface.']
      ],1),
      S('Best next test','What is the strongest next action?','Inspect the flash location, seating/support and tool condition','Correct. Diagnose the changed physical interface with approved safe access before changing global process conditions.',[
        ['Raise global clamp force until the flash disappears, accepting higher mould load without inspecting the repaired shutoff','That can mask damage, increase mould stress and delay correction of the local mechanism.'],
        ['Reduce all pressure settings together and accept any new filling or packing changes as part of the correction','A global reduction can create other quality problems without fixing the local shutoff.'],
        ['Increase cooling time and use the cosmetic flash response as the main test of a local shutoff-seating problem','Cooling time does not test the suspected local sealing condition.']
      ],3),
      S('Controlled response','If local damage is found, what is the educational principle?','Restore the tooling condition, then verify the known process','Correct. Mechanism-first troubleshooting protects tooling and quality; repair the local condition before using process force as compensation.',[
        ['Make the compensating process change permanent and allow the process window to depend on the unresolved tooling defect','That leaves the process dependent on an unresolved mechanical condition.'],
        ['Disable mould protection so the tool closes harder and use increased closing force to overcome the damaged interface','Safeguards must never be bypassed to maintain production or compensate for tooling damage.'],
        ['Ignore the defect location and treat every flash mechanism as a pressure-only problem across the full shot','Flash can result from local seating, damage, support, venting or process pressure; location remains diagnostic.']
      ],0),
      S('Explain','Why should troubleshooting begin with defect location?','Location separates local mould features from whole-shot variables','Correct. A global variable is a weaker first hypothesis when only one local feature changes, although confirmation is still required.',[
        ['Location proves the exact root cause without any confirming inspection, process comparison or controlled test','Location narrows hypotheses but does not prove the exact mechanism by itself.'],
        ['Location removes the need to review process actuals because a local defect cannot have any process contribution','Process actuals still help establish whether global conditions changed.'],
        ['Location matters only for cosmetic defects and should not influence diagnosis of filling, flash or dimensional issues','Location is useful across filling, venting, flash, dimensions, ejection and other mechanisms.']
      ],2)
    ]
  }
];

function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function learnerToken(){let raw='anonymous';try{raw=String(window.db?.activeUser||window.user?.id||'anonymous')}catch(_){}let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function storageKey(){return `${STORAGE_BASE}::${learnerToken()}`}
function readState(){try{const x=JSON.parse(localStorage.getItem(storageKey())||'{}');return x&&typeof x==='object'?x:{}}catch(_){return {}}}
function writeState(state){try{localStorage.setItem(storageKey(),JSON.stringify(state))}catch(_){}}
function labState(id){const all=readState();return all[id]||{attempts:0,completed:false,bestScore:0,firstTry:false}}
function saveLab(id,patch){const all=readState();all[id]={...(all[id]||{}),...patch};writeState(all)}
let activeLabId=null,answers=[],attemptHadError=false;

function style(){
  if(document.getElementById('mm-diagnostic-labs-style'))return;
  const s=document.createElement('style');s.id='mm-diagnostic-labs-style';s.textContent=`
#diagnosticLabs{--dl-line:#2e4868;--dl-soft:#0e1e32;--dl-accent:#55d6be}.dl-hero{padding:24px}.dl-hero h2{font-size:30px;margin:7px 0 9px}.dl-hero p{max-width:850px;color:#bfd0e2;line-height:1.6}.dl-note{margin-top:13px;padding:12px 14px;border:1px solid #66582c;background:#282313;border-radius:10px;color:#f3e5ae;line-height:1.5;font-size:12px}.dl-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.dl-stat{padding:14px}.dl-stat b{display:block;font-size:24px;margin-top:4px}.dl-stat span{font-size:11px;color:var(--muted)}.dl-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.dl-card{padding:18px;display:flex;flex-direction:column;min-height:240px}.dl-card h3{margin:7px 0 8px}.dl-card p{color:var(--muted);line-height:1.52;font-size:13px;flex:1}.dl-meta,.dl-related,.dl-actions{display:flex;gap:6px;flex-wrap:wrap}.dl-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#bcd1e8;background:#102137}.dl-card-foot,.dl-toolbar{display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin-top:12px}.dl-done{color:var(--good);font-size:12px;font-weight:800}.dl-lab{display:grid;gap:14px}.dl-panel{padding:20px}.dl-evidence{display:grid;gap:8px;margin:12px 0}.dl-evidence div{padding:10px 12px;border:1px solid #2e4665;background:#0d1d31;border-radius:9px;color:#c8d7e7;font-size:13px}.dl-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.dl-progress span{height:7px;border-radius:99px;background:#253951}.dl-progress span.done{background:var(--accent)}.dl-progress span.current{outline:2px solid #68a7ff;outline-offset:2px}.dl-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.dl-question{font-size:19px;font-weight:800;margin:8px 0 12px}.dl-choices{display:grid;gap:8px}.dl-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.dl-choice.correct{border-color:#4a8a75;background:#123229}.dl-choice.wrong{border-color:#7c4651;background:#321a22}.dl-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55}.dl-feedback.bad{background:#2b1d20;border-color:#653f48}.dl-summary{padding:18px}.dl-learning-loop{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:14px}.dl-learning-loop span{padding:8px 5px;text-align:center;border-radius:8px;background:#11243a;border:1px solid #304a68;font-size:10px;color:#bed1e7}@media(max-width:900px){.dl-grid{grid-template-columns:1fr}.dl-learning-loop{grid-template-columns:1fr 1fr}}@media(max-width:560px){.dl-stats{grid-template-columns:1fr}.dl-toolbar button{width:100%}}`;
  document.head.appendChild(s);
}
function ensureSection(){let section=document.getElementById('diagnosticLabs');if(section)return section;section=document.createElement('section');section.className='view hidden';section.id='diagnosticLabs';const main=document.getElementById('mainContent')||document.querySelector('main.main');if(main)main.appendChild(section);return section}
function ensureNav(){const nav=document.getElementById('nav');if(!nav||nav.querySelector('[data-mm-diagnostic-labs]'))return;const btn=document.createElement('button');btn.type='button';btn.dataset.mmDiagnosticLabs='1';btn.innerHTML='⌁ <span>Diagnostic labs</span>';const anchor=nav.querySelector('button[data-view="scenarios"]');if(anchor)anchor.insertAdjacentElement('afterend',btn);else nav.appendChild(btn);btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openLabs()})}
function patchMobileMore(){if(window.__MM_DIAGNOSTIC_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;const base=window.openMobileMenu;window.openMobileMenu=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{const grid=document.querySelector('#modal .modal-card .grid2');if(!grid||grid.querySelector('[data-mm-diagnostic-menu]'))return;const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmDiagnosticMenu='1';b.innerHTML='<span class="icon">⌁</span><b>Diagnostic labs</b><small>Practise evidence-first troubleshooting.</small>';b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}openLabs()});grid.appendChild(b)});return r};window.__MM_DIAGNOSTIC_MORE_PATCH__=true}
function setHeader(title,subtitle){const h=document.getElementById('pageTitle'),p=document.getElementById('pageSubtitle');if(h)h.textContent=title;if(p)p.textContent=subtitle}
function hideOtherViews(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function markNav(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-diagnostic-labs]')?.classList.add('active')}
function backToPractice(){const b=document.querySelector('#nav button[data-view="scenarios"]');if(b)b.click();else location.hash=''}
function stats(){const state=readState();let done=0,totalBest=0,attempted=0;LABS.forEach(l=>{const s=state[l.id];if(s?.completed)done++;if(s?.attempts){attempted++;totalBest+=Number(s.bestScore||0)}});return {done,attempted,avg:attempted?Math.round(totalBest/attempted):0}}
function cardHtml(lab){const s=labState(lab.id);return `<article class="dl-card card"><div class="dl-meta"><span class="dl-chip">${escapeHtml(lab.level)}</span><span class="dl-chip">${escapeHtml(lab.focus)}</span></div><h3>${escapeHtml(lab.title)}</h3><p>${escapeHtml(lab.summary)}</p><div class="dl-card-foot"><span class="${s.completed?'dl-done':'muted tiny'}">${s.completed?`✓ Completed · best ${Number(s.bestScore||0)}%`:(s.attempts?`${s.attempts} attempt${s.attempts===1?'':'s'}`:'Not attempted')}</span><button class="secondary" data-dl-start="${escapeHtml(lab.id)}">${s.completed?'Practise again':'Start lab'}</button></div></article>`}
function renderHome(){activeLabId=null;answers=[];attemptHadError=false;const host=ensureSection();if(!host)return;const st=stats();host.innerHTML=`<div class="dl-hero card"><div class="eyebrow">Evidence-first practice</div><h2>Diagnostic Learning Labs</h2><p>Use real injection-moulding signal relationships to separate observations, mechanisms, discriminating tests and recovery evidence.</p><div class="dl-learning-loop"><span>1 Observe</span><span>2 Diagnose</span><span>3 Test</span><span>4 Respond</span><span>5 Explain</span></div><div class="dl-note"><b>Training boundary:</b> these are educational scenarios, not universal production recipes. Verify the exact resin grade, machine and mould documentation, approved site procedures and process limits before real production changes.</div></div><div class="dl-stats"><div class="dl-stat card"><span>Labs completed</span><b>${st.done}/${LABS.length}</b></div><div class="dl-stat card"><span>Labs attempted</span><b>${st.attempted}</b></div><div class="dl-stat card"><span>Average best score</span><b>${st.avg}%</b></div></div><div class="dl-toolbar"><div><h2 style="margin:0">Choose a case</h2><p class="muted" style="margin:4px 0 0">Focus on evidence before touching a setting.</p></div><button class="ghost" data-dl-back>Back to practice</button></div><div class="dl-grid" style="margin-top:12px">${LABS.map(cardHtml).join('')}</div>`}
function openLab(id){const lab=LABS.find(x=>x.id===id);if(!lab)return;activeLabId=id;answers=new Array(lab.steps.length).fill(null);attemptHadError=false;const prior=labState(id);saveLab(id,{...prior,attempts:Number(prior.attempts||0)+1});renderLab(0)}
function choiceHtml(c,i,selected){const chosen=selected===i;const cls=chosen?(c.correct?' correct':' wrong'):'';return `<button class="dl-choice${cls}" data-dl-choice="${i}" ${selected===null?'':'disabled'}>${escapeHtml(c.text)}</button>`}
function feedbackHtml(choice){return `<div class="dl-feedback ${choice.correct?'':'bad'}"><b>${choice.correct?'Good diagnosis':'Re-check the evidence'}</b><br>${escapeHtml(choice.feedback)}</div>`}
function renderLab(stepIndex){const lab=LABS.find(x=>x.id===activeLabId);if(!lab)return renderHome();const host=ensureSection(),step=lab.steps[stepIndex],selected=answers[stepIndex];host.innerHTML=`<div class="dl-lab"><div class="dl-toolbar"><button class="ghost" data-dl-home>← All labs</button><button class="ghost" data-dl-back>Back to practice</button></div><div class="dl-panel card"><div class="dl-meta"><span class="dl-chip">${escapeHtml(lab.level)}</span><span class="dl-chip">${escapeHtml(lab.focus)}</span></div><h2>${escapeHtml(lab.title)}</h2><p class="muted">${escapeHtml(lab.summary)}</p><div class="dl-progress">${lab.steps.map((_,i)=>`<span class="${i<stepIndex?'done':i===stepIndex?'current':''}"></span>`).join('')}</div></div><div class="dl-panel card"><h3>Evidence board</h3><div class="dl-evidence">${lab.evidence.map(x=>`<div>${escapeHtml(x)}</div>`).join('')}</div></div><div class="dl-panel card"><div class="dl-stage">${escapeHtml(step.stage)} · ${stepIndex+1}/${lab.steps.length}</div><div class="dl-question">${escapeHtml(step.question)}</div><div class="dl-choices">${step.choices.map((c,i)=>choiceHtml(c,i,selected)).join('')}</div>${selected===null?'':feedbackHtml(step.choices[selected])}${selected===null?'':`<div class="dl-actions">${stepIndex<lab.steps.length-1?'<button class="primary" data-dl-next>Next step</button>':'<button class="primary" data-dl-finish>Finish lab</button>'}<button class="ghost" data-dl-retry-step>Try this question again</button></div>`}</div><div class="dl-panel card"><b>Related reference topics</b><div class="dl-related">${lab.related.map(x=>`<span class="dl-chip">${escapeHtml(x)}</span>`).join('')}</div><p class="tiny muted">Exact production limits remain grade-, machine-, mould- and site-specific.</p></div></div>`;host.dataset.step=String(stepIndex)}
function finishLab(){const lab=LABS.find(x=>x.id===activeLabId);if(!lab)return;const correct=lab.steps.reduce((n,s,i)=>n+(s.choices[answers[i]]?.correct?1:0),0),score=Math.round(correct/lab.steps.length*100),prior=labState(lab.id),firstTry=Number(prior.attempts||0)===1&&!attemptHadError&&score===100;saveLab(lab.id,{...prior,completed:true,bestScore:Math.max(Number(prior.bestScore||0),score),firstTry:Boolean(prior.firstTry||firstTry)});const host=ensureSection();host.innerHTML=`<div class="dl-summary card"><div class="eyebrow">Lab complete</div><strong>${score}% · ${correct}/${lab.steps.length} decisions</strong><h2>${escapeHtml(lab.title)}</h2><p class="muted">${score===100?'You followed the evidence through the full reasoning chain.':'Review the missed steps and try again. Learn which evidence supports which mechanism rather than memorising option position.'}</p><div class="dl-actions"><button class="primary" data-dl-home>Choose another lab</button><button class="secondary" data-dl-restart>Practise this lab again</button><button class="ghost" data-dl-back>Back to practice</button></div></div>`}
function handleClick(e){const target=e.target.closest('[data-dl-start],[data-dl-home],[data-dl-back],[data-dl-choice],[data-dl-next],[data-dl-finish],[data-dl-retry-step],[data-dl-restart]');if(!target)return;if(target.dataset.dlStart)return openLab(target.dataset.dlStart);if(target.hasAttribute('data-dl-home'))return renderHome();if(target.hasAttribute('data-dl-back'))return backToPractice();if(target.hasAttribute('data-dl-restart'))return openLab(activeLabId);const host=ensureSection(),stepIndex=Number(host?.dataset.step||0),lab=LABS.find(x=>x.id===activeLabId);if(!lab)return;if(target.dataset.dlChoice!==undefined){const i=Number(target.dataset.dlChoice);answers[stepIndex]=i;if(!lab.steps[stepIndex].choices[i]?.correct)attemptHadError=true;return renderLab(stepIndex)}if(target.hasAttribute('data-dl-retry-step')){answers[stepIndex]=null;return renderLab(stepIndex)}if(target.hasAttribute('data-dl-next'))return renderLab(Math.min(stepIndex+1,lab.steps.length-1));if(target.hasAttribute('data-dl-finish'))return finishLab()}
function openLabs(){style();const host=ensureSection();if(!host)return;hideOtherViews();host.classList.remove('hidden');markNav();setHeader('Diagnostic labs','Practise evidence-first injection moulding troubleshooting.');renderHome();window.scrollTo?.({top:0,behavior:'smooth'})}
function install(){style();ensureSection();ensureNav();patchMobileMore();const host=document.getElementById('diagnosticLabs');if(host&&!host.__mmDlClick){host.addEventListener('click',handleClick);host.__mmDlClick=true}}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
const observer=new MutationObserver(schedule);if(document.documentElement)observer.observe(document.documentElement,{childList:true,subtree:true});
install();window.addEventListener('load',schedule);
window.MM_DIAGNOSTIC_LABS={version:VERSION,labs:LABS,open:openLabs,storage:'learner-scoped local progress only'};
})();
/* <<< diagnostic-learning-labs.js */

/* >>> material-behaviour-labs.js */
/* MouldMaster Material Behaviour Labs — grade-aware educational practice */
(function(){
'use strict';
const VERSION='2026.08.25.1';
const STORAGE_BASE='mm_material_behaviour_labs_v1';
const LABS=[
{
 id:'pp-vs-pc-drying',title:'PP and PC do not share one drying rule',level:'Beginner',focus:'Grade-specific material handling',materials:['PP','PC'],sourceIds:['exxon-pp-processing','covestro-drying'],
 summary:'Two jobs are waiting at the same machine. The exact neat PP grade supplier reference says drying is not required, while the PC job requires controlled drying and moisture verification.',
 evidence:['Job A is the exact neat PP grade covered by a supplier processing reference that states drying is not required.','Job B is a PC grade whose supplier guidance requires drying before processing.','The plant has one generic “engineering-plastic drying” note beside the hopper.','Neither supplier document authorises using the other material’s handling rule.'],
 related:['Polypropylene (PP)','Polycarbonate (PC)','Material moisture actual','Dryer dew point / air condition'],
 steps:[
  {stage:'Observe',question:'What is the strongest lesson from the two supplier references?',choices:[{text:'Drying decisions are grade-specific; do not transfer one resin family’s rule to another',correct:true,feedback:'Correct. Material family and exact grade documentation come before a generic shop-floor recipe.'},{text:'Every thermoplastic should be dried the same way',feedback:'That would contradict the grade-specific evidence in the scenario.'},{text:'PP and PC have the same moisture sensitivity',feedback:'The supplier requirements in this scenario clearly differ.'},{text:'Dryer settings are more important than resin identity',feedback:'Resin identity determines whether a drying requirement exists in the first place.'}]},
  {stage:'Best next test',question:'Before loading either material, what is the best next check?',choices:[{text:'Confirm the exact resin grade and the current supplier/site-approved handling instruction for that grade',correct:true,feedback:'Correct. Start from identity and approved requirements, not habit.'},{text:'Apply the PC drying cycle to both materials just in case',feedback:'Unnecessary heat history is not a substitute for grade-specific handling.'},{text:'Skip identification if the pellets look similar',feedback:'Appearance cannot establish polymer family, grade or handling requirement.'},{text:'Use whichever instruction was used on the previous job',feedback:'Previous-job instructions are not evidence for the current resin.'}]},
  {stage:'Controlled response',question:'What should happen when the PP job is changed to the PC job?',choices:[{text:'Change the material-handling plan to the PC grade requirement and verify actual material condition before judging the process',correct:true,feedback:'Correct. A material change can require a different conditioning and verification strategy.'},{text:'Keep the PP handling plan because the machine is unchanged',feedback:'The machine is only one part of the process; material requirements changed.'},{text:'Raise injection pressure to compensate for moisture risk',feedback:'Injection pressure does not replace correct material conditioning.'},{text:'Use one permanent drying recipe for all future jobs',feedback:'MouldMaster deliberately avoids universal material recipes.'}]},
  {stage:'Explain',question:'Why is this comparison educationally important?',choices:[{text:'It teaches learners to separate resin-specific requirements from machine habits and generic rules',correct:true,feedback:'Exactly. Experienced processing starts with the exact material, not a memorised universal setting.'},{text:'It proves PP can never contain surface moisture or contamination',feedback:'The supplier statement is about the referenced processing requirement, not every possible contamination condition.'},{text:'It proves every PC grade has identical drying parameters',feedback:'Exact limits remain grade- and supplier-specific.'},{text:'It means material documentation is optional after enough experience',feedback:'Experience should improve how documentation is interpreted, not replace it.'}]}
 ]
},
{
 id:'pc-wet-vs-dry',title:'Wet PC versus verified dry PC',level:'Intermediate',focus:'Moisture actual versus dryer display',materials:['PC'],sourceIds:['covestro-drying','iso-15512'],
 summary:'A transparent PC part develops silver streaks and loses impact performance after a material-handling interruption. The dryer display looks normal, but no resin moisture result has been recorded.',
 evidence:['Silver streaking began after the hopper was opened and material handling was interrupted.','Dryer temperature and displayed air condition returned to their normal screens.','No approved moisture measurement has confirmed the pellets now meet the exact grade requirement.','The supplier warns that insufficient drying can reduce molecular weight and degrade finished-part properties.'],
 related:['Polycarbonate (PC)','Splay / silver streaks','Material moisture actual','Material lot / handling history'],
 steps:[
  {stage:'Observe',question:'Which uncertainty matters most?',choices:[{text:'Whether the PC pellets reaching the machine are actually within the exact grade moisture requirement',correct:true,feedback:'Correct. A normal dryer display is supporting evidence, not proof of pellet condition.'},{text:'Whether clamp force changed',feedback:'Clamp force does not fit the material-handling timing or the streaking mechanism.'},{text:'Whether ejection speed is high enough',feedback:'Ejection occurs after the defect has already formed.'},{text:'Whether the colour masterbatch should be increased',feedback:'Colour addition would not establish the material condition.'}]},
  {stage:'Best next test',question:'What is the strongest next test?',choices:[{text:'Measure moisture with an approved method and verify the complete drying/transfer path against the grade requirement',correct:true,feedback:'Correct. Verify the actual material state and the path that produced it.'},{text:'Trust the dryer screen and change mould temperature',feedback:'The screen cannot establish pellet moisture after a handling interruption.'},{text:'Raise melt temperature to drive moisture out during injection',feedback:'Processing wet PC can worsen hydrolytic damage; correct conditioning comes first.'},{text:'Increase hold pressure until the streaks disappear',feedback:'Packing is not the right test for a moisture-driven surface/property problem.'}]},
  {stage:'Controlled response',question:'If excessive moisture is confirmed, what is the correct educational response?',choices:[{text:'Restore the supplier/site-approved conditioning process, verify moisture, then reassess the moulding response',correct:true,feedback:'Correct. Fix and verify material condition before tuning around it.'},{text:'Use the PP job’s no-drying rule',feedback:'The first lab specifically showed why requirements cannot be transferred between resin families.'},{text:'Hide the streaking with more pigment',feedback:'That masks appearance without addressing molecular damage.'},{text:'Keep running until the hopper “dries itself out”',feedback:'That creates uncontrolled exposure and potentially more degraded parts.'}]},
  {stage:'Explain',question:'Why can a part look better yet still require material verification?',choices:[{text:'Moisture-related processing can affect molecular weight and mechanical performance as well as visible streaking',correct:true,feedback:'Exactly. Cosmetic recovery alone is not proof that material properties are protected.'},{text:'Only transparent parts absorb moisture',feedback:'Transparency does not determine hygroscopic behaviour.'},{text:'Impact performance is controlled only by mould temperature',feedback:'Material condition can materially affect finished properties.'},{text:'Moisture measurement is only useful for colour defects',feedback:'It can be critical to polymer integrity and process repeatability.'}]}
 ]
},
{
 id:'pa66-gf30-dry-conditioned',title:'PA66-GF30: dry processing is not the same as conditioned properties',level:'Advanced',focus:'Moisture, reinforcement and anisotropy',materials:['PA66-GF30'],sourceIds:['basf-pa66-gf30','basf-ultramid','iso-15512'],
 summary:'A PA66-GF30 dimensional study compares freshly moulded dry specimens with conditioned specimens. The supplier data show different dry and conditioned mechanical values, while the moulded part also shows direction-dependent warpage.',
 evidence:['The exact study material is a PA66 grade with 30% glass-fibre reinforcement.','Supplier property data distinguish dry and conditioned mechanical values.','The part shows different shrink/warpage behaviour along and across the main flow direction.','Pre-mould drying and post-mould moisture conditioning are being discussed as if they were the same operation.'],
 related:['PA6 / PA66 (Nylon)','Warpage','Fibre orientation','Material moisture actual','Conditioned dimensions'],
 steps:[
  {stage:'Observe',question:'What distinction must be made first?',choices:[{text:'Drying before moulding controls processing moisture; post-mould conditioning changes the part’s later moisture state and properties',correct:true,feedback:'Correct. Those are different stages with different purposes.'},{text:'Drying and conditioning are interchangeable names for the same step',feedback:'That confusion can invalidate both processing and dimensional conclusions.'},{text:'Glass fibre eliminates moisture effects',feedback:'Reinforcement changes the property balance but does not remove polyamide moisture behaviour.'},{text:'Only unfilled nylon needs moisture control',feedback:'The exact reinforced grade still has dry/conditioned property differences.'}]},
  {stage:'Best next test',question:'How should the dimensional comparison be designed?',choices:[{text:'Define and control the specimen conditioning state, measurement timing and flow-direction orientation before comparing dimensions',correct:true,feedback:'Correct. Condition and orientation must be part of the test definition.'},{text:'Mix dry and conditioned parts in one sample to get an average',feedback:'Pooling distinct material states hides the mechanism.'},{text:'Measure only one direction on the part',feedback:'Glass-fibre orientation can make directional behaviour important.'},{text:'Increase packing pressure until every dimension matches',feedback:'Process compensation cannot replace a controlled material/measurement study.'}]},
  {stage:'Controlled response',question:'If warpage follows the fibre-flow direction, what is the better learning response?',choices:[{text:'Investigate gate/flow orientation, local thermal balance and reinforcement-driven anisotropy before global process compensation',correct:true,feedback:'Correct. Reinforced semi-crystalline materials can have strongly directional shrinkage and stiffness.'},{text:'Assume the moisture result alone explains every warped dimension',feedback:'Moisture matters, but the directional pattern points to additional orientation/thermal mechanisms.'},{text:'Increase clamp force',feedback:'Clamp force does not correct fibre orientation after filling.'},{text:'Treat PA66-GF30 exactly like unfilled PP',feedback:'The materials differ in moisture behaviour, crystallinity and reinforcement response.'}]},
  {stage:'Explain',question:'Why should the grade’s “dry/conditioned” data matter to a learner?',choices:[{text:'It shows that a material property can depend on its moisture state after moulding, so test condition must be part of the engineering conclusion',correct:true,feedback:'Exactly. A number without its material state can be misleading.'},{text:'It gives a universal conditioning recipe for every PA66 grade',feedback:'Conditions remain grade-, part- and specification-specific.'},{text:'It proves glass-filled parts cannot be dimensionally stable',feedback:'It identifies variables that must be controlled; it does not make stability impossible.'},{text:'It means process data are no longer useful',feedback:'Material state, process actuals and geometry all contribute to the final part.'}]}
 ]
},
{
 id:'abs-thermal-history',title:'ABS discoloration after a long residence event',level:'Intermediate',focus:'Thermal history versus moisture assumption',materials:['ABS'],sourceIds:['sabic-cycolac','basf-troubleshooter'],
 summary:'An ABS housing ran normally, then the machine paused for an extended unplanned stop. On restart the first parts show yellow/brown streaks and occasional dark specks.',
 evidence:['The defect starts immediately after the long residence event.','The same ABS lot produced acceptable parts before the stop.','The defect includes colour change and dark degraded-looking specks.','No independent evidence yet shows that resin moisture changed during the stop.'],
 related:['ABS','Black specks','Thermal history','Residence time','Startup / purge sequence'],
 steps:[
  {stage:'Observe',question:'Which mechanism deserves early attention?',choices:[{text:'Excessive thermal/residence history in the barrel, nozzle or hot runner during the stop',correct:true,feedback:'Correct. The timing and degraded appearance make thermal history a strong first hypothesis.'},{text:'Moisture must always be the cause of ABS streaking',feedback:'Moisture can matter, but the evidence here points first to the residence event.'},{text:'Low clamp force',feedback:'Clamp force does not explain the restart timing and dark degraded material.'},{text:'Insufficient cooling time',feedback:'Cooling happens after the melt has already experienced the suspected thermal history.'}]},
  {stage:'Best next test',question:'What should be reviewed next?',choices:[{text:'The approved shutdown/startup/purge procedure plus actual thermal and residence history through barrel, nozzle and hot runner',correct:true,feedback:'Correct. Trace where old or overheated material could remain before changing unrelated settings.'},{text:'Raise all barrel zones so the specks melt away',feedback:'Adding heat can worsen thermally degraded material.'},{text:'Change colour masterbatch immediately',feedback:'That does not test whether degraded resin is still in the melt path.'},{text:'Increase hold time',feedback:'Hold time is downstream of the suspected degradation mechanism.'}]},
  {stage:'Controlled response',question:'Once degraded hold-up is confirmed, what is the right principle?',choices:[{text:'Follow the resin/machine/site-approved purge and restart procedure, then confirm stable clean material before restoring the validated process',correct:true,feedback:'Correct. Remove the degraded source rather than tuning the process around it.'},{text:'Keep producing until the defect percentage becomes acceptable',feedback:'That treats degraded material as a normal variation rather than a condition to correct.'},{text:'Use a generic purge rule for every polymer',feedback:'Purge compatibility and safe handling are material-specific.'},{text:'Increase back pressure and temperature together',feedback:'Multiple aggressive changes can add thermal/shear history without proving the cause.'}]},
  {stage:'Explain',question:'What does the ABS case teach about symptom matching?',choices:[{text:'Similar-looking streaks can have different causes, so timing and process history are part of the diagnosis',correct:true,feedback:'Exactly. A defect name is not a root cause.'},{text:'ABS never needs moisture control',feedback:'That would overgeneralise beyond the evidence.'},{text:'Every dark speck proves a hot-runner failure',feedback:'Degradation can occur in several melt-path locations.'},{text:'Colour change is only cosmetic',feedback:'Thermal degradation can also change material properties.'}]}
 ]
},
{
 id:'pom-thermal-safety',title:'POM: thermal abuse is a material-safety problem',level:'Advanced',focus:'Thermal degradation and contamination control',materials:['POM'],sourceIds:['celanese-pom-processing'],
 summary:'A POM job is restarted after a nozzle blockage and suspected long residence. A suggestion is made to raise temperature aggressively and process through possible mixed-material contamination.',
 evidence:['Supplier POM guidance warns that excessive thermal stress or residence can decompose the polymer and release formaldehyde.','The same guidance warns that some incompatible contaminants, especially PVC, can trigger severe decomposition.','The nozzle has already shown a blockage condition.','The proposed response would add heat before material identity and safe condition are established.'],
 related:['POM / Acetal','Thermal degradation','Contamination control','Nozzle blockage','Safe startup / shutdown'],
 steps:[
  {stage:'Observe',question:'How should this situation be classified?',choices:[{text:'A material-specific safety and degradation condition that must follow supplier/site procedures before production optimisation',correct:true,feedback:'Correct. This is not just a cosmetic defect or a normal tuning problem.'},{text:'A normal short-shot problem that should be solved with more temperature',feedback:'The supplier warnings make that response unsafe and technically weak.'},{text:'Only a maintenance issue with no material implications',feedback:'POM thermal degradation and contamination are directly relevant.'},{text:'A reason to bypass alarms until flow returns',feedback:'Safeguards and approved procedures must not be bypassed.'}]},
  {stage:'Best next test',question:'What information is required before processing resumes?',choices:[{text:'Confirm material identity/contamination status and follow the POM supplier plus machine/site safe-degradation procedure',correct:true,feedback:'Correct. Establish what material is present and whether the melt path is safe.'},{text:'Smell the fumes to judge whether degradation is serious',feedback:'Odour is not a safe exposure test.'},{text:'Increase nozzle temperature until the blockage clears',feedback:'Supplier guidance warns against thermal abuse and pressure from blocked outlets.'},{text:'Blend in more POM to dilute possible PVC',feedback:'The supplier specifically warns that even low incompatible contamination can be dangerous.'}]},
  {stage:'Controlled response',question:'Which response best matches the evidence?',choices:[{text:'Stop uncontrolled processing, use the approved safe clean-out/restart method and do not process suspect incompatible contamination',correct:true,feedback:'Correct. Safety and material compatibility come before cycle recovery.'},{text:'Raise temperature and screw speed together',feedback:'That increases thermal/shear input to a material already suspected of degradation.'},{text:'Open guards to inspect the nozzle while cycling',feedback:'Do not bypass guarding or expose people to a hazardous machine/melt condition.'},{text:'Record the problem only if parts fail inspection',feedback:'The hazard exists before finished-part inspection.'}]},
  {stage:'Explain',question:'Why is POM useful in material-specific education?',choices:[{text:'It demonstrates that a process adjustment acceptable for one resin may be unsafe for another because degradation chemistry and contamination compatibility differ',correct:true,feedback:'Exactly. Material identity changes the safe decision space.'},{text:'It proves all semi-crystalline polymers have the same decomposition behaviour',feedback:'POM has material-specific hazards; do not generalise them to every polymer.'},{text:'It means temperature should never be adjusted on POM',feedback:'Temperature is a legitimate controlled process variable inside supplier-approved limits; thermal abuse is the issue.'},{text:'It removes the need for machine safety procedures',feedback:'Supplier, machine and site controls all remain necessary.'}]}
 ]
},
{
 id:'recycled-pp-lot-rheology',title:'Recycled PP: the lot changed, so the flow behaviour changed',level:'Advanced',focus:'Secondary-feedstock variability',materials:['Recycled PP'],sourceIds:['krantz-rpp-2024','iso-1133','exxon-pp-processing'],
 summary:'A recycled-PP component changes material batch. Nominal machine settings are unchanged, but fill pressure, apparent viscosity and part response shift compared with the validated previous batch.',
 evidence:['The change begins with a new recycled-PP batch.','Pressure demand and in-mould flow response move together.','Published recycled-PP injection-moulding research reports meaningful rheological differences across secondary-feedstock blends.','The new batch has not yet been compared with the incoming material/rheology acceptance plan.'],
 related:['Recycled-content compounds','MFR / MVR','In-mould rheology','Peak injection pressure','Material lot traceability'],
 steps:[
  {stage:'Observe',question:'What is the strongest first hypothesis?',choices:[{text:'The new secondary feedstock may have a different rheological/material state and should be verified before treating the machine as the cause',correct:true,feedback:'Correct. The lot timing plus pressure/flow shift makes material variability a strong hypothesis.'},{text:'The machine recipe must be corrupted because the settings did not move',feedback:'Identical setpoints do not guarantee identical material response.'},{text:'Recycled PP should behave identically if the label says PP',feedback:'Secondary feedstock can vary in molecular weight, contamination and rheology.'},{text:'Clamp force determines melt viscosity',feedback:'Clamp force does not set polymer rheology.'}]},
  {stage:'Best next test',question:'What is the best next evidence set?',choices:[{text:'Check lot identity and incoming QC, compare an approved flow/rheology measure such as MFR/MVR with process pressure/flow actuals, and review the validated material window',correct:true,feedback:'Correct. Connect incoming material evidence to what the moulding process actually did.'},{text:'Copy a virgin-PP recipe from another mould',feedback:'Different grade, geometry and feedstock history make that weak evidence.'},{text:'Increase melt temperature until pressure matches the old lot',feedback:'That compensates before establishing why the material response changed.'},{text:'Judge only average part weight',feedback:'A single pooled response can miss changes in pressure, dimensions, surface or mechanical properties.'}]},
  {stage:'Controlled response',question:'If the batch is within purchase specification but its rheology differs inside the allowed range, what is the sound learning principle?',choices:[{text:'Use the validated process/material window and controlled one-factor evidence to confirm acceptable part quality rather than forcing old screen numbers',correct:true,feedback:'Correct. The goal is a capable physical process, not identical nominal settings.'},{text:'Reject every recycled batch that is not numerically identical to the previous one',feedback:'That ignores the defined acceptance window and the reason secondary-feedstock controls exist.'},{text:'Change speed, temperature, packing and cooling together',feedback:'Multiple simultaneous changes destroy diagnostic learning.'},{text:'Disable process limits so the controller can compensate automatically',feedback:'Limits and safeguards must remain within approved boundaries.'}]},
  {stage:'Explain',question:'What should learners remember about MFR/MVR here?',choices:[{text:'It is useful incoming evidence but does not by itself reproduce the high-shear, geometry-specific rheology of the real moulding process',correct:true,feedback:'Exactly. Combine material tests with process actuals and part responses.'},{text:'One MFR value completely defines injection-moulding behaviour',feedback:'Injection moulding spans different shear, pressure, temperature and geometry conditions.'},{text:'MFR is irrelevant for recycled material',feedback:'It can be useful, but it is not the whole material state.'},{text:'If MFR matches, contamination and prior heat history cannot matter',feedback:'Other feedstock differences can still affect quality and processing.'}]}
 ]
}
];

/* 2026-08-30 strict assessment balance: preserve each choice's feedback/mechanism,
   rewrite option text to credible competing decisions, and distribute keyed positions. */
const ANSWER_BALANCE_VERSION='2026.08.30.1';
const BALANCE_ORDER={0:[0,1,2,3],1:[1,0,2,3],2:[1,2,0,3],3:[1,2,3,0]};
const BALANCE={
 'pp-vs-pc-drying':[
  {pos:1,texts:['Drying requirements follow the exact resin grade','Dry every thermoplastic with one standard cycle so material handling never varies between polymer families','Treat PP and PC as having equivalent moisture sensitivity because both are processed as thermoplastics','Prioritise dryer settings over resin identity even when supplier handling requirements differ by grade']},
  {pos:3,texts:['Confirm grade identity and its approved handling requirement','Apply the PC drying cycle to both materials as a precaution, even when the PP grade reference does not require it','Skip material identification when pellet appearance is similar enough to suggest the same polymer family','Reuse the previous job’s handling instruction because the machine and dryer hardware have not changed']},
  {pos:0,texts:['Switch to the PC handling plan and verify material condition','Keep the PP handling plan because the moulding machine is unchanged, despite the resin requirement changing','Increase injection pressure to compensate for possible moisture instead of confirming the PC material condition','Adopt one permanent drying recipe for all future jobs so operators do not need grade-specific instructions']},
  {pos:2,texts:['Material identity must override generic machine habits','The comparison proves PP can never carry surface moisture, contamination or handling-related variability','The comparison proves every PC grade uses identical drying limits regardless of supplier or exact formulation','Experienced operators can eventually stop using material documentation because machine familiarity is sufficient']}
 ],
 'pc-wet-vs-dry':[
  {pos:2,texts:['Whether PC moisture meets the exact grade limit','Whether clamp force changed enough to explain a defect that began after the material-handling interruption','Whether ejection speed is high enough even though the streaking forms before the part leaves the cavity','Whether more colour masterbatch would hide the appearance without resolving the material-condition uncertainty']},
  {pos:0,texts:['Measure moisture and verify the complete drying path','Trust the restored dryer screen and change mould temperature without confirming the pellet moisture at the machine','Raise melt temperature to drive moisture out during injection, accepting additional hydrolytic and thermal risk','Increase hold pressure until visible streaks change, even though packing does not test actual pellet moisture']},
  {pos:3,texts:['Restore approved conditioning, verify moisture, then reassess','Use the previous PP job’s no-drying rule because both materials are being processed on the same machine','Hide the streaking with additional pigment and treat improved appearance as evidence that the material recovered','Keep running until the hopper appears to dry itself out, without establishing residence, airflow or pellet moisture']},
  {pos:1,texts:['Moisture can damage properties before appearance proves recovery','Only transparent parts can absorb enough moisture to affect process behaviour or finished mechanical performance','Impact performance is controlled only by mould temperature, so resin moisture cannot influence the final property','Moisture measurement is useful only for colour defects and has no role in polymer integrity or repeatability']}
 ],
 'pa66-gf30-dry-conditioned':[
  {pos:3,texts:['Pre-mould drying and post-mould conditioning are different states','Treat drying and conditioning as interchangeable names for the same operation because both involve moisture','Assume glass fibre eliminates polyamide moisture effects and makes conditioning state irrelevant to properties','Apply moisture control only to unfilled nylon because reinforcement prevents moisture-driven property changes']},
  {pos:1,texts:['Control conditioning state, timing and flow orientation in the comparison','Mix dry and conditioned specimens into one sample so the average represents normal production variation','Measure only one part direction even when fibre orientation produces direction-dependent shrinkage and stiffness','Increase packing pressure until dimensions align, rather than controlling specimen state and measurement timing']},
  {pos:2,texts:['Investigate orientation, thermal balance and anisotropy before compensation','Assume moisture alone explains every warped dimension even when the direction follows gate and fibre orientation','Increase clamp force globally even though clamp load does not alter the fibre orientation already frozen into the part','Treat PA66-GF30 like unfilled PP and ignore reinforcement, crystallinity and moisture-state effects']},
  {pos:0,texts:['Engineering conclusions must include the material’s moisture state','Use the supplier dry/conditioned table as a universal conditioning recipe for every PA66 grade and application','Conclude that glass-filled parts cannot be dimensionally stable whenever dry and conditioned properties differ','Stop using process data because material conditioning state alone fully determines the final moulded dimensions']}
 ],
 'abs-thermal-history':[
  {pos:0,texts:['Excessive melt residence and thermal history during the stop','Assume moisture is always the cause of ABS streaking even when the defect starts immediately after a long residence event','Treat low clamp force as the primary mechanism despite the restart timing and dark degraded-looking material','Blame insufficient cooling time even though the suspected material degradation occurred before the melt entered the cavity']},
  {pos:2,texts:['Review approved restart/purge steps and the actual melt-path thermal history','Raise all barrel-zone temperatures until dark specks disappear, despite the possibility of additional thermal degradation','Change colour masterbatch immediately and use visual improvement as proof that degraded hold-up is gone','Increase hold time and judge the restart from packed-part response even though the suspected mechanism is upstream']},
  {pos:1,texts:['Use the approved purge/restart process and confirm clean stable material','Continue producing until the reject percentage falls, treating thermally degraded hold-up as normal startup variation','Apply one generic purge rule to every polymer regardless of compatibility, thermal stability or machine guidance','Increase back pressure and melt temperature together before confirming whether degraded material remains in the melt path']},
  {pos:3,texts:['Timing and thermal history distinguish similar-looking defects','Conclude ABS never needs moisture control because thermal history explains this particular restart event','Treat every dark speck as proof of hot-runner failure even though degradation can occur across the melt path','Treat colour change as purely cosmetic even when excessive thermal history can also alter material properties']}
 ],
 'pom-thermal-safety':[
  {pos:1,texts:['Treat it as a material-specific degradation and safety condition','Treat it as a normal short-shot problem and add temperature before confirming material condition or safe flow path','Treat it as maintenance-only with no material implications despite the known degradation chemistry and contamination risk','Bypass alarms until flow returns because production recovery is more important than the material-specific warning']},
  {pos:3,texts:['Confirm material/contamination identity and follow the approved POM safety procedure','Smell the fumes to judge degradation severity and continue if the odour seems tolerable to the operator','Increase nozzle temperature until the blockage clears without first establishing safe material condition','Blend in more POM to dilute possible PVC contamination rather than treating incompatible material as a safety issue']},
  {pos:0,texts:['Stop uncontrolled processing and use the approved clean-out/restart method','Raise temperature and screw speed together so the blockage clears before material degradation is investigated','Open guards to inspect the nozzle while cycling because direct observation is the fastest way to diagnose flow','Record the event only if finished parts fail inspection, even though the hazard exists before part quality is known']},
  {pos:2,texts:['Safe process decisions depend on resin-specific degradation chemistry','Assume all semi-crystalline polymers have the same decomposition behaviour and can share one thermal-abuse response','Never adjust temperature on POM under any condition, even within supplier-approved process limits and procedures','Ignore machine safety procedures once material guidance is available because the supplier document is sufficient']}
 ],
 'recycled-pp-lot-rheology':[
  {pos:2,texts:['Verify the new feedstock’s rheological/material state before blaming the machine','Treat the unchanged machine recipe as proof that the controller or stored settings must be corrupted','Assume recycled PP behaves identically whenever the material label says PP, regardless of lot history or composition','Use clamp force as the primary explanation for melt-viscosity and pressure changes during filling']},
  {pos:0,texts:['Compare lot QC/rheology with process pressure and flow actuals','Copy a virgin-PP recipe from another mould because polymer family matters more than lot-specific incoming evidence','Increase melt temperature until pressure matches the previous lot, without first checking material identity or rheology','Judge only average part weight and ignore changes in fill pressure, velocity following and the validated material window']},
  {pos:3,texts:['Use the validated material/process window and controlled evidence','Reject every recycled batch that is not numerically identical to the previous lot, regardless of product-quality capability','Change speed, temperature, packing and cooling together so the new material is forced toward the previous screen values','Disable process limits and allow the controller to compensate automatically without establishing why the material response changed']},
  {pos:1,texts:['MFR is useful incoming evidence but not the whole moulding rheology','Treat one MFR value as a complete description of high-shear, geometry-specific injection-moulding behaviour','Ignore MFR for recycled material even when it is part of an approved incoming quality-control comparison','Assume matching MFR proves contamination, composition and previous thermal history cannot affect the moulding response']}
 ]
};
for(const lab of LABS){
 const specs=BALANCE[lab.id];if(!specs||specs.length!==lab.steps.length)throw new Error(`Material answer-balance map incomplete: ${lab.id}`);
 lab.steps.forEach((step,i)=>{const spec=specs[i],original=step.choices;if(!original||original.length!==4||original.findIndex(c=>c.correct===true)!==0)throw new Error(`Material answer-balance source changed: ${lab.id}/${i}`);spec.texts.forEach((t,n)=>original[n].text=t);step.choices=BALANCE_ORDER[spec.pos].map(n=>original[n])});
}

function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function learnerToken(){try{let id='';if(typeof db!=='undefined'&&db?.activeUser)id=db.activeUser;else id=window.db?.activeUser||window.user?.id||'';return String(id||'anonymous').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,80)}catch(_){return'anonymous'}}
function key(){return STORAGE_BASE+':'+learnerToken()}
function read(){try{return JSON.parse(localStorage.getItem(key())||'{}')}catch(_){return{}}}
function save(all){try{localStorage.setItem(key(),JSON.stringify(all))}catch(_){}}
function state(id){return read()[id]||{attempts:0,bestScore:0,completed:false}}
function put(id,val){const a=read();a[id]=val;save(a)}
let active=null,answers=[],hadError=false;
function style(){if(document.getElementById('mm-material-lab-style'))return;const s=document.createElement('style');s.id='mm-material-lab-style';s.textContent=`
#materialLabs{padding-bottom:30px}.ml-hero,.ml-panel,.ml-card,.ml-summary{padding:18px}.ml-hero h2,.ml-panel h2,.ml-panel h3{margin-top:0}.ml-hero p,.ml-card p,.ml-panel p{line-height:1.55}.ml-note{margin-top:12px;padding:11px 12px;border:1px solid #6f5d31;background:#2a2415;border-radius:9px;color:#f2dfad;font-size:12px;line-height:1.5}.ml-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}.ml-card{display:flex;flex-direction:column;min-height:235px}.ml-card p{color:var(--muted);font-size:13px;flex:1}.ml-meta,.ml-related{display:flex;gap:6px;flex-wrap:wrap}.ml-chip{font-size:10px;border:1px solid #3b5574;border-radius:999px;padding:4px 7px;color:#c6d8ea;background:#102137}.ml-foot,.ml-actions,.ml-toolbar{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}.ml-lab{display:grid;gap:13px}.ml-evidence{display:grid;gap:8px}.ml-evidence div{padding:10px 12px;border:1px solid #31506f;background:#0d1d31;border-radius:9px;font-size:13px;color:#cbd9e8}.ml-progress{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px}.ml-progress span{height:7px;border-radius:99px;background:#253951}.ml-progress .done{background:var(--accent)}.ml-progress .current{outline:2px solid #68a7ff;outline-offset:2px}.ml-stage{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-weight:800}.ml-q{font-size:19px;font-weight:800;margin:8px 0 12px}.ml-choices{display:grid;gap:8px}.ml-choice{width:100%;text-align:left;border:1px solid #35506f;background:#112239;color:#e7f0fb;border-radius:10px;padding:11px 12px}.ml-choice.correct{border-color:#4a8a75;background:#123229}.ml-choice.wrong{border-color:#7c4651;background:#321a22}.ml-feedback{margin-top:12px;padding:13px;border-radius:10px;background:#0e2831;border:1px solid #2d5f5c;line-height:1.55;color:#d9f1ea}.ml-feedback.bad{background:#2b1d20;border-color:#653f48;color:#f3d1d6}.ml-sources a{display:block;margin-top:4px;color:#a9d5ff}.ml-done{color:var(--good);font-size:12px;font-weight:800}@media(max-width:900px){.ml-grid{grid-template-columns:1fr}}@media(max-width:560px){.ml-toolbar button{width:100%}}
`;document.head.appendChild(s)}
function section(){let x=document.getElementById('materialLabs');if(x)return x;x=document.createElement('section');x.id='materialLabs';x.className='view hidden';(document.getElementById('mainContent')||document.querySelector('main.main'))?.appendChild(x);return x}
function hide(){document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'))}
function header(t,p){const h=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');if(h)h.textContent=t;if(s)s.textContent=p}
function mark(){document.querySelectorAll('#nav button').forEach(b=>b.classList.remove('active'));document.querySelector('[data-mm-material-labs]')?.classList.add('active')}
function nav(){const n=document.getElementById('nav');if(!n||n.querySelector('[data-mm-material-labs]'))return;const b=document.createElement('button');b.type='button';b.dataset.mmMaterialLabs='1';b.innerHTML='◈ <span>Material labs</span>';const a=n.querySelector('[data-mm-diagnostic-labs]')||n.querySelector('button[data-view="scenarios"]');a?a.insertAdjacentElement('afterend',b):n.appendChild(b);b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open()})}
function mobile(){if(window.__MM_MATERIAL_MORE_PATCH__||typeof window.openMobileMenu!=='function')return;const base=window.openMobileMenu;window.openMobileMenu=function(){const r=base.apply(this,arguments);requestAnimationFrame(()=>{const g=document.querySelector('#modal .modal-card .grid2');if(!g||g.querySelector('[data-mm-material-menu]'))return;const b=document.createElement('button');b.type='button';b.className='quick-action';b.dataset.mmMaterialMenu='1';b.innerHTML='<span class="icon">◈</span><b>Material labs</b><small>Compare resin-specific behaviour.</small>';b.addEventListener('click',()=>{try{window.closeModal?.()}catch(_){}open()});g.appendChild(b)});return r};window.__MM_MATERIAL_MORE_PATCH__=true}
function sourceHtml(lab){const rs=window.MM_EVIDENCE_APPROVAL?.forMaterialLab?.(lab.id)||[];const src=[];for(const r of rs)for(const s of r.sources||[])if(!src.some(x=>x.url===s.url))src.push(s);return src.length?`<div class="ml-panel card ml-sources"><b>Evidence sources</b>${src.slice(0,5).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join('')}<p class="tiny muted">Evidence supports the mechanism being taught; exact production limits remain grade-, machine-, mould- and site-specific.</p></div>`:''}
function home(){active=null;answers=[];hadError=false;const h=section(),all=read();let done=0;LABS.forEach(l=>{if(all[l.id]?.completed)done++});h.innerHTML=`<div class="ml-hero card"><div class="eyebrow">Material-specific practice</div><h2>Material Behaviour Labs</h2><p>Compare how polymer family, moisture state, reinforcement, thermal history and recycled-feedstock variability change the correct diagnostic decision.</p><div class="ml-note"><b>Training boundary:</b> scenario values and supplier statements are learning evidence, not universal production recipes. Always verify the exact grade datasheet, SDS, approved site procedure and machine/mould limits.</div></div><div class="ml-toolbar" style="margin-top:14px"><div><h2 style="margin:0">Choose a material case</h2><p class="muted" style="margin:4px 0 0">${done}/${LABS.length} completed · learn the material before changing the machine.</p></div><button class="ghost" data-ml-back>Back to practice</button></div><div class="ml-grid">${LABS.map(card).join('')}</div>`}
function card(l){const s=state(l.id);return `<article class="ml-card card"><div class="ml-meta"><span class="ml-chip">${esc(l.level)}</span>${l.materials.map(m=>`<span class="ml-chip">${esc(m)}</span>`).join('')}</div><h3>${esc(l.title)}</h3><p>${esc(l.summary)}</p><div class="ml-foot"><span class="${s.completed?'ml-done':'muted tiny'}">${s.completed?`✓ Completed · best ${Number(s.bestScore||0)}%`:(s.attempts?`${s.attempts} attempt${s.attempts===1?'':'s'}`:'Not attempted')}</span><button class="secondary" data-ml-start="${esc(l.id)}">${s.completed?'Practise again':'Start lab'}</button></div></article>`}
function start(id){const l=LABS.find(x=>x.id===id);if(!l)return;active=id;answers=new Array(l.steps.length).fill(null);hadError=false;const s=state(id);put(id,{...s,attempts:Number(s.attempts||0)+1});render(0)}
function render(i){const l=LABS.find(x=>x.id===active);if(!l)return home();const st=l.steps[i],sel=answers[i],h=section();h.dataset.step=String(i);h.innerHTML=`<div class="ml-lab"><div class="ml-toolbar"><button class="ghost" data-ml-home>← All material labs</button><button class="ghost" data-ml-back>Back to practice</button></div><div class="ml-panel card"><div class="ml-meta"><span class="ml-chip">${esc(l.level)}</span><span class="ml-chip">${esc(l.focus)}</span></div><h2 style="margin:8px 0">${esc(l.title)}</h2><p class="muted">${esc(l.summary)}</p><div class="ml-progress">${l.steps.map((_,n)=>`<span class="${n<i?'done':n===i?'current':''}"></span>`).join('')}</div></div><div class="ml-panel card"><h3>Evidence board</h3><div class="ml-evidence">${l.evidence.map(x=>`<div>${esc(x)}</div>`).join('')}</div></div><div class="ml-panel card"><div class="ml-stage">${esc(st.stage)} · ${i+1}/${l.steps.length}</div><div class="ml-q">${esc(st.question)}</div><div class="ml-choices">${st.choices.map((c,n)=>`<button class="ml-choice ${sel===n?(c.correct?'correct':'wrong'):''}" data-ml-choice="${n}" ${sel===null?'':'disabled'}>${esc(c.text)}</button>`).join('')}</div>${sel===null?'':`<div class="ml-feedback ${st.choices[sel].correct?'':'bad'}"><b>${st.choices[sel].correct?'Good material reasoning':'Re-check the material evidence'}</b><br>${esc(st.choices[sel].feedback)}</div><div class="ml-actions">${i<l.steps.length-1?'<button class="primary" data-ml-next>Next step</button>':'<button class="primary" data-ml-finish>Finish lab</button>'}<button class="ghost" data-ml-retry>Try again</button></div>`}</div><div class="ml-panel card"><b>Related reference topics</b><div class="ml-related" style="margin-top:9px">${l.related.map(x=>`<span class="ml-chip">${esc(x)}</span>`).join('')}</div></div>${sourceHtml(l)}</div>`}
function finish(){const l=LABS.find(x=>x.id===active);if(!l)return;const correct=l.steps.reduce((n,s,i)=>n+(s.choices[answers[i]]?.correct?1:0),0),score=Math.round(correct/l.steps.length*100),s=state(l.id);put(l.id,{...s,completed:true,bestScore:Math.max(Number(s.bestScore||0),score)});section().innerHTML=`<div class="ml-summary card"><div class="eyebrow">Material lab complete</div><h2>${esc(l.title)}</h2><strong style="font-size:22px">${score}% · ${correct}/${l.steps.length} decisions</strong><p class="muted">${score===100?'You kept the material state and supplier evidence in the diagnostic chain.':'Review the missed steps. The goal is to know when material identity changes the correct decision.'}</p><div class="ml-actions"><button class="primary" data-ml-home>Choose another lab</button><button class="secondary" data-ml-restart>Practise again</button><button class="ghost" data-ml-back>Back to practice</button></div></div>${sourceHtml(l)}`}
function back(){const b=document.querySelector('#nav button[data-view="scenarios"]');if(b)b.click();else location.hash=''}
function click(e){const t=e.target.closest('[data-ml-start],[data-ml-home],[data-ml-back],[data-ml-choice],[data-ml-next],[data-ml-finish],[data-ml-retry],[data-ml-restart]');if(!t)return;if(t.dataset.mlStart)return start(t.dataset.mlStart);if(t.hasAttribute('data-ml-home'))return home();if(t.hasAttribute('data-ml-back'))return back();if(t.hasAttribute('data-ml-restart'))return start(active);const i=Number(section()?.dataset.step||0),l=LABS.find(x=>x.id===active);if(!l)return;if(t.dataset.mlChoice!==undefined){const n=Number(t.dataset.mlChoice);answers[i]=n;if(!l.steps[i].choices[n]?.correct)hadError=true;return render(i)}if(t.hasAttribute('data-ml-retry')){answers[i]=null;return render(i)}if(t.hasAttribute('data-ml-next'))return render(Math.min(i+1,l.steps.length-1));if(t.hasAttribute('data-ml-finish'))return finish()}
function open(){style();const h=section();if(!h)return;hide();h.classList.remove('hidden');mark();header('Material labs','Learn how resin identity changes the evidence and the safe next decision.');home();window.scrollTo?.({top:0,behavior:'smooth'})}
function install(){style();nav();mobile();const h=section();if(h&&!h.__mmMl){h.addEventListener('click',click);h.__mmMl=true}}
let queued=false;function schedule(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(()=>{queued=false;install()},0)}
if(document.documentElement)new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});install();window.addEventListener('load',schedule);
window.MM_MATERIAL_BEHAVIOUR_LABS={version:VERSION,labs:LABS,open,storage:'learner-scoped local progress only',trainingBoundary:'Scenario-specific education; verify exact grade and approved real-world requirements.',answerBalanceVersion:ANSWER_BALANCE_VERSION};
})();
/* <<< material-behaviour-labs.js */

/* >>> assessment-evidence-sources.js */
/* MouldMaster assessment evidence sources — 2026-08-25.3 */
(function(){
'use strict';
const SOURCES={
 'autodesk-fill-pack':{name:'Autodesk Moldflow — injection / fill + pack process settings',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/injection-molding/Process-settings/MoldflowInsight_CLC_Analyses_molding_processes_injection_molding_Process_settings_Process_Settings_Wizard_1st_html.html'},
 'autodesk-molding-window':{name:'Autodesk Moldflow — Molding Window analysis',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2024/ENU/MoldflowInsight-CLC-Analyses/files/analysis-sequences/LM_MOLDING_WINDOW_ANALYSIS.html'},
 'autodesk-packing':{name:'Autodesk Moldflow — packing guidance',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/view/MOLDFLOW/2013/ENU/caas.html?url=caas%2Fvhelp%2Fhelp-dev-autodesk-com%2Fv%2FSimulation-Moldflow%2Fenu%2F2013%2FHelp%2F3Insight-360%2F3927-Process-3927%2F3933-Profiles3933%2F3945-Packing-3945.html'},
 'autodesk-cooling':{name:'Autodesk Moldflow — cooling stage',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Ref-Materials/files/glossary-of-terminology/MoldflowInsight_CLC_Ref_Materials_glossary_of_terminology_Cooling_stage_html.html'},
 'autodesk-clamp':{name:'Autodesk Moldflow — clamp force result',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Results/files/Fill-or-flow-results/MoldflowInsight_CLC_Results_Fill_or_flow_results_Clamp_force_result_html.html'},
 'autodesk-flash':{name:'Autodesk Moldflow — flash defect reference',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2019/ENU/MoldflowInsight-Reference/files/GUID-47828B62-E02C-4367-8766-B8AF9DFF3ADE.htm'},
 'autodesk-valve-gate':{name:'Autodesk Moldflow — valve gate controllers and sequential gating',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2018/ENU/MoldflowInsight-Modelprep/files/GUID-F18BA634-5D28-4DC5-81E2-A5B56DB970A2.htm'},
 'basf-troubleshooter':{name:'BASF — Injection Molding Troubleshooter',authority:'BASF',kind:'resin-supplier technical guidance',url:'https://plastics-rubber.basf.com/asiapacific/en/performance_polymers/services/product_support_troubleshooting/injection_moulding_troubleshooter'},
 'basf-ultramid':{name:'BASF — Ultramid polyamide material family',authority:'BASF',kind:'resin-supplier product guidance',url:'https://plastics-rubber.basf.com/global/en/performance_polymers/products/ultramid'},
 'basf-pa66-gf30':{name:'BASF — Ultramid A 216 V30 PA66-GF30 grade data',authority:'BASF',kind:'resin-supplier grade data',url:'https://plastics-rubber.basf.com/global/en/performance_polymers/products/materials/30775362'},
 'covestro-drying':{name:'Covestro — Drying for injection moulding',authority:'Covestro',kind:'resin-supplier technical guidance',url:'https://solutions.covestro.com/-/media/covestro/solution-center/whitepapers/injection-molding-of-high-quality-molded-parts-drying.pdf'},
 'celanese-pom-processing':{name:'Celanese — Hostaform POM processing and safety guidance',authority:'Celanese',kind:'resin-supplier technical guide',url:'https://www.celanese.com/-/media/engineered%20materials/files/product%20technical%20guides/pom-065-hostaformpomeu-pm-en-r1-0916.pdf'},
 'exxon-pp-processing':{name:'ExxonMobil — polypropylene quick processing reference',authority:'ExxonMobil',kind:'resin-supplier technical guidance',url:'https://www.exxonmobilchemical.com/-/media/media-assets/media-library-assets/23/neat_polypropylene_process_parameters_en.pdf'},
 'sabic-cycolac':{name:'SABIC — CYCOLAC ABS resin family',authority:'SABIC',kind:'resin-supplier product guidance',url:'https://www.sabic.com/en/products/polymers/acrylonitrile-butadiene-styrene-abs/cycolac-resin'},
 'krantz-rpp-2024':{name:'Krantz et al. (2024) — in-mould rheology of recycled polypropylene',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1002/pen.26836'},
 'euromap-60':{name:'EUROMAP 60 — injection moulding machine energy efficiency',authority:'EUROMAP / VDMA',kind:'industry technical recommendation',url:'https://www.euromap.org/technical-issues/technical-recommendations'},
 'euromap-79':{name:'EUROMAP 79 — interface between injection moulding machine and robot',authority:'EUROMAP / VDMA',kind:'industry interface specification',url:'https://www.euromap.org/euromap79'},
 'iso-15512':{name:'ISO 15512:2019 — Plastics — Determination of water content',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/73834.html'},
 'iso-1133':{name:'ISO 1133-1:2022 — MFR/MVR',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/83905.html'},
 'iso-20430':{name:'ISO 20430:2020 — injection moulding machine safety requirements',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/68000.html'},
 'zhao-2022':{name:'Zhao et al. (2022) — injection-moulding shrinkage/warpage review',authority:'peer-reviewed research',kind:'research',url:'https://pubmed.ncbi.nlm.nih.gov/35194289/'},
 'trotta-2021':{name:'Trotta et al. (2021) — injection-moulding rheology and high-shear behaviour',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1016/j.polymertesting.2021.107068'},
 'jansen-1998':{name:'Jansen, Pantani & Titomanlio — holding time / gate-freeze evidence',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1002/pen.10186'},
 'liew-2022':{name:'Liew et al. (2022) — real-time moulding sensing and quality monitoring',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/s22134792'},
 'tsou-2023':{name:'Tsou et al. (2023) — oil/nozzle/cavity pressure correlation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1515/ipp-2022-4281'},
 'araujo-2023':{name:'Araújo et al. (2023) — in-cavity pressure for failure diagnosis',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1007/s00170-023-11100-1'},
 'hotrunner-2024':{name:'Polymers (2024) — hot-runner thermal-control evidence',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym16081057'},
 'overmould-2020':{name:'Polymer overmould interface qualification research',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1002/APP.50294'},
 'nist-capability':{name:'NIST/SEMATECH — Process capability',authority:'NIST',kind:'technical reference',url:'https://www.itl.nist.gov/div898/handbook/pmc/section1/pmc16.htm'},
 'nist-doe':{name:'NIST/SEMATECH — Experimental design',authority:'NIST',kind:'technical reference',url:'https://www.itl.nist.gov/div898/handbook/pri/section1/pri13.htm'},
 'nist-handbook':{name:'NIST/SEMATECH Engineering Statistics Handbook',authority:'NIST',kind:'technical reference',url:'https://www.itl.nist.gov/div898/handbook/'},
 'nist-ai-drift':{name:'NIST AI RMF Playbook — production monitoring and drift',authority:'NIST',kind:'technical reference',url:'https://airc.nist.gov/airmf-resources/playbook/measure/'}
};
function hash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return('00000000'+(h>>>0).toString(16)).slice(-8)}
function direct(reference,url){const u=String(url||'').trim();if(!/^https:\/\//i.test(u))return null;const known=Object.entries(SOURCES).find(([,s])=>s.url===u);if(known)return {id:known[0],...known[1]};return {id:'direct-'+hash(u),name:String(reference||'Direct cited source'),authority:'question-linked source',kind:u.startsWith('https://doi.org/')?'research':'direct source',url:u}}
function inferred(text){const t=String(text||'').toLowerCase(),ids=[];const add=(...x)=>x.forEach(id=>{if(SOURCES[id]&&!ids.includes(id))ids.push(id)});
 if(/capabil|\bcpk\b|\bcp\b|\bppk\b|\bpp\b|measurement|gauge|gage|sampling/.test(t))add('nist-capability','nist-handbook');
 if(/\bdoe\b|experiment|randomis|randomiz|blocking|factor|interaction|confirmation run|one.factor|confound/.test(t))add('nist-doe');
 if(/process window|molding window|moulding window|operating window|feasible window|preferred window/.test(t))add('autodesk-molding-window','nist-doe');
 if(/polycarbonate|\bpc\b.*moisture|\bpc\b.*dry/.test(t))add('covestro-drying','iso-15512');
 if(/pa66|polyamide|nylon|glass.fib|glass fib|conditioned properties/.test(t))add('basf-pa66-gf30','basf-ultramid','iso-15512');
 if(/polypropylene.*dry|neat pp|\bpp\b.*drying/.test(t))add('exxon-pp-processing');
 if(/\babs\b|cycolac/.test(t))add('sabic-cycolac','basf-troubleshooter');
 if(/\bpom\b|acetal|formaldehyde|pvc contamination|polyoxymethylene/.test(t))add('celanese-pom-processing');
 if(/recycled.*pp|secondary feedstock|recycled polypropylene/.test(t))add('krantz-rpp-2024','iso-1133');
 if(/moisture|drying|dryer|hygroscopic|humid|splay|silver streak/.test(t))add('covestro-drying','iso-15512');
 if(/mfr|mvr|rheolog|viscos|shear|flow length|polypropylene grade|recycled pp/.test(t))add('trotta-2021','iso-1133');
 if(/cavity pressure|pressure trace|sensor|signal acquisition|pressure.time|pressure area/.test(t))add('araujo-2023','liew-2022','tsou-2023');
 if(/check.ring|non.return|cushion|shot delivery|shot-delivery|recovery time/.test(t))add('liew-2022');
 if(/cool|warpage|shrink|ejection temperature|water.line|thermal balance|mould temperature|mold temperature/.test(t))add('zhao-2022','autodesk-cooling');
 if(/pack|hold|gate seal|gate.freeze|sink/.test(t))add('jansen-1998','autodesk-packing');
 if(/flash|parting.line|shutoff|seating/.test(t))add('autodesk-flash','autodesk-clamp');
 else if(/clamp|projected area/.test(t))add('autodesk-clamp');
 if(/valve.gate|valve gate|sequential gate|sequential gating/.test(t))add('autodesk-valve-gate','hotrunner-2024');
 if(/hot.runner|hot runner|heater duty|manifold/.test(t))add('hotrunner-2024');
 if(/residence|degrad|black speck|purge|thermal history|long shutdown|standstill/.test(t))add('basf-troubleshooter');
 if(/robot|eoat|handshake|robot.clear|automation sequence|automation time|handling device/.test(t))add('euromap-79','iso-20430');
 if(/energy|kwh|specific energy|heater\/pump|heater.*pump|tcu duty|auxiliary energy|energy per/.test(t))add('euromap-60');
 if(/overmould|overmold|insert temperature|interface temperature|bond strength|peel strength|interface thermal/.test(t))add('overmould-2020');
 if(/model drift|quality model|prediction error|training.domain|domain coverage|ground truth|vision model|model output/.test(t))add('nist-ai-drift');
 if(/v\/p|transfer|fill|short[-. ]shot|pressure loss|runner|gate|vent|burn|weld|jet|flow front|mould|mold|tooling/.test(t))add('autodesk-fill-pack','zhao-2022');
 if(/setpoint|actual|machine transfer|receiving machine|different machine|process transfer|fill time/.test(t))add('liew-2022','autodesk-fill-pack');
 if(/guard|interlock|lockout|isolation|safety|danger zone|emergency stop/.test(t))add('iso-20430');
 return ids.map(id=>({id,...SOURCES[id]})).slice(0,4)
}
window.MM_EVIDENCE_SOURCES={version:'2026.08.25.3',sources:SOURCES,direct,inferred,hash};
})();
/* <<< assessment-evidence-sources.js */

/* >>> evidence-maturity-deep-dive.js */
/* MouldMaster evidence maturity deep dive — 2026.08.26.2 */
(function(){
'use strict';
const VERSION='2026.08.26.2';
const REVIEWED='2026-08-26';
const REVIEW_BY='2026-11-26';
const E=window.MM_EVIDENCE_SOURCES;
if(!E)throw new Error('assessment-evidence-sources.js must load before evidence maturity deep dive');
const uniq=(arr,key='url')=>{const out=[];for(const x of arr||[]){if(!x||!x[key]||out.some(y=>y[key]===x[key]))continue;out.push(x)}return out};
const slug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,96);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

/* Independent evidence families added to improve triangulation rather than source-count inflation. */
const EXTRA_SOURCES={
 'nrv-wear-2023':{name:'Ma et al. (2023) — non-return valve wear and moulded-weight consistency',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1002/pen.26246'},
 'energy-review-2017':{name:'Zhang et al. (2017) — injection-moulding energy consumption review',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/en10111768'},
 'hotrunner-manifold-2023':{name:'Jung & Kim (2023) — hot-runner manifold thermal deformation and leak risk',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/mi14071337'},
 'overmould-2023':{name:'Miao et al. (2023) — overmoulding parameters and interface bond strength',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym15132879'},
 'thermal-degradation-1990':{name:'Injection-rate and melt-temperature effects on polypropylene degradation',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1016/0141-3910(90)90052-9'},
 'delrin-pom-molding':{name:'Delrin — Acetal Homopolymer Thermoplastic Resin Molding Guide',authority:'Delrin',kind:'resin-supplier technical guidance',url:'https://www.delrin.com/wp-content/uploads/2024/11/Delrin-Technical-Molding-Guide-NA-FNL.pdf'},
 'autodesk-clamp-modeling':{name:'Autodesk Moldflow — accurate clamp-force prediction modelling',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2019/ENU/MoldflowInsight-Modelprep/files/GUID-5C97629F-C5C5-4A6D-BD2A-55FE6A4A5EE2.htm'},
 'hse-ppis4':{name:'HSE PPIS4(rev1) — Safety at injection moulding machines',authority:'UK HSE',kind:'regulator guidance',url:'https://www.hse.gov.uk/pubns/ppis4.pdf'},
 'osha-injection-etool':{name:'OSHA Injection Molding eTool',authority:'US OSHA',kind:'regulator guidance',url:'https://www.osha.gov/etools/machine-guarding/plastics-machinery/horizontal-injection-molding-machines'},
 'worksafe-safe-machinery':{name:'WorkSafe New Zealand — Safe use of machinery',authority:'WorkSafe New Zealand',kind:'regulator guidance',url:'https://www.worksafe.govt.nz/topic-and-industry/machinery/safe-use-of-machinery/'},
 'doe-micro-2013':{name:'Optimisation of Micro Injection Moulding Process through Design of Experiments',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1016/j.procir.2013.09.052'},
 'adoe-2024':{name:'Kariminejad et al. (2024) — adaptive DOE for industrial injection moulding',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.1038/s41598-024-80405-2'},
 'pbt-basf-guide':{name:'BASF — Ultradur PBT processing and hydrolysis guidance',authority:'BASF',kind:'resin-supplier technical guidance',url:'https://www.basf.com/dam/jcr%3A317242e5-51ed-3fa4-a7c8-c2849c92c8d2/basf/www/cn/documents/en/chinaplas/Ultradur_brochure.pdf'},
 'pbt-celanese':{name:'Celanese — Crastin/Celanex PBT family guidance',authority:'Celanese',kind:'resin-supplier product guidance',url:'https://www.celanese.com/products/crastin-celanex-pbt-pulybutylene-terephtalate'},
 'tpu-lubrizol-drying':{name:'Lubrizol — TPU Drying Guide',authority:'Lubrizol',kind:'resin-supplier technical guidance',url:'https://www.lubrizol.com/-/media/Lubrizol/Health/Literature/TPU-Drying-Guide.pdf'},
 'pmma-plexiglas':{name:'PLEXIGLAS — injection-moulding processing guidance',authority:'Roehm / PLEXIGLAS',kind:'resin-supplier technical guidance',url:'https://www.plexiglas-polymers.com/en/frequently-asked-questions/articles/processing-on-injection-molding-machines'},
 'pmma-autodesk':{name:'Autodesk Moldflow — PMMA material processing background',authority:'Autodesk',kind:'technical documentation',url:'https://help.autodesk.com/cloudhelp/2023/ENU/MoldflowInsight-CLC-Materials/files/materials-for-inj-molding/part-materials/thermoplastics-materials/MoldflowInsight_CLC_Materials_materials_for_inj_molding_part_materials_thermoplastics_materials_PMMA_materials_html.html'},
 'peek-victrex':{name:'VICTREX — PEEK injection moulding processing guide',authority:'Victrex',kind:'resin-supplier technical guidance',url:'https://www.victrex.com/-/media/downloads/technical-guides/victrex_injection-molding-brochure_jan2022.pdf'},
 'lcp-celanese':{name:'Celanese — Vectra LCP moulding guidelines',authority:'Celanese',kind:'resin-supplier technical guidance',url:'https://www.celanese.com/-/media/Engineered%20Materials/Files/Product%20Technical%20Guides/LCP-001_VectraLCPprecMoldTG_AM_0613.pdf'},
 'pcabs-covestro':{name:'Covestro — Bayblend T85 XF PC+ABS grade data',authority:'Covestro',kind:'resin-supplier grade data',url:'https://solutions.covestro.com/-/media/covestro/solution-center/products/datasheets/imported/bayblend/bayblend-t85-xf_en_56968621-00003130-18266741.pdf'},
 'tritan-eastman':{name:'Eastman — Tritan copolyester drying and injection-moulding guidance',authority:'Eastman',kind:'resin-supplier technical guidance',url:'https://www.eastman.com/content/dam/eastman/corporate/en/literature/t/trsmed244.pdf'},
 'pps-celanese':{name:'Celanese — Fortron PPS family and processing',authority:'Celanese',kind:'resin-supplier product guidance',url:'https://www.celanese.com/en/products/fortron-polyphenylene-sulfide'},
 'psychometric-item-2024':{name:'Rezigalla et al. (2024) — distractor efficiency, item difficulty and discrimination',authority:'peer-reviewed assessment research',kind:'research',url:'https://doi.org/10.1186/s12909-024-05433-y'},
 'psychometric-kr20-2023':{name:'Ntumi et al. (2023) — KR-20, item difficulty and discrimination',authority:'peer-reviewed assessment research',kind:'research',url:'https://doi.org/10.34293/education.v11i3.6081'},
 'microcellular-mechanics-2022':{name:'Microcellular morphology and mechanical-response evidence',authority:'peer-reviewed research',kind:'research',url:'https://doi.org/10.3390/polym14163352'}
};
Object.assign(E.sources,EXTRA_SOURCES);
const baseInferred=E.inferred.bind(E);
function add(out,id){const s=E.sources[id];if(s&&!out.some(x=>x.url===s.url))out.push({id,...s})}
function authorityKey(s){return String(s?.authority||'').toLowerCase().replace(/peer-reviewed .*/,'peer-reviewed research').replace(/\s*\/.*$/,'').trim()}
E.inferred=function(text){
 const t=String(text||'').toLowerCase(),out=baseInferred(text).map(x=>({...x}));
 if(/check.?ring|non.?return|shot delivery|cushion/.test(t)){add(out,'nrv-wear-2023');add(out,'autodesk-fill-pack')}
 if(/clamp|projected area|platen|tie.?bar/.test(t)){add(out,'autodesk-clamp-modeling');add(out,'iso-20430')}
 if(/residence|degrad|black speck|purge|thermal history|standstill|shutdown/.test(t)){add(out,'thermal-degradation-1990');add(out,'basf-troubleshooter')}
 if(/\bdoe\b|factor|interaction|blocking|confirmation run|experiment|response surface|randomis|randomiz/.test(t)){add(out,'doe-micro-2013');add(out,'adoe-2024');add(out,'nist-doe')}
 if(/energy|kwh|specific energy|heater.*pump|tcu duty|energy per/.test(t)){add(out,'energy-review-2017');add(out,'euromap-60')}
 if(/hot.?runner|heater duty|manifold|thermal zone/.test(t)){add(out,'hotrunner-manifold-2023');add(out,'hotrunner-2024')}
 if(/overmould|overmold|bond strength|interface temperature|peel strength/.test(t)){add(out,'overmould-2023');add(out,'overmould-2020')}
 if(/\bpom\b|acetal|formaldehyde|polyoxymethylene|pvc contamination/.test(t)){add(out,'delrin-pom-molding');add(out,'celanese-pom-processing')}
 if(/\bpbt\b|polybutylene terephthalate|polyester hydrolysis/.test(t)){add(out,'pbt-basf-guide');add(out,'pbt-celanese');add(out,'iso-15512')}
 if(/\btpu\b|thermoplastic polyurethane/.test(t)){add(out,'tpu-lubrizol-drying');add(out,'iso-15512')}
 if(/\bpmma\b|acrylic|plexiglas/.test(t)){add(out,'pmma-plexiglas');add(out,'pmma-autodesk')}
 if(/\bpeek\b|polyetheretherketone/.test(t)){add(out,'peek-victrex');add(out,'autodesk-fill-pack')}
 if(/\blcp\b|liquid crystal polymer/.test(t)){add(out,'lcp-celanese');add(out,'zhao-2022')}
 if(/pc.?abs|bayblend|cycoloy/.test(t)){add(out,'pcabs-covestro');add(out,'covestro-drying')}
 if(/\bpps\b|polyphenylene sulfide/.test(t)){add(out,'pps-celanese');add(out,'autodesk-fill-pack')}
 if(/psychometric|item difficulty|discrimination|distractor|kr.?20|reliability/.test(t)){add(out,'psychometric-item-2024');add(out,'psychometric-kr20-2023')}
 if(/\buk\b|united kingdom|puwer|coshh|\bhse\b|great britain/.test(t)){add(out,'hse-ppis4');add(out,'iso-20430')}
 if(/\bus\b|united states|\bosha\b/.test(t)){add(out,'osha-injection-etool');add(out,'iso-20430')}
 if(/\bnz\b|new zealand|worksafe|hswa|pcbu/.test(t)){add(out,'worksafe-safe-machinery');add(out,'iso-20430')}
 if(/guard|interlock|lockout|isolation|danger zone|emergency stop|safety/.test(t)){add(out,'iso-20430');add(out,'hse-ppis4')}
 const diverse=[],seenAuth=new Set();
 for(const s of out){const a=authorityKey(s);if(a&&!seenAuth.has(a)){diverse.push(s);seenAuth.add(a)}}
 for(const s of out)if(!diverse.some(x=>x.url===s.url))diverse.push(s);
 return diverse.slice(0,8)
};
E.version='2026.08.26.2';
E.independencePolicy={version:VERSION,minimumDistinctUrls:2,minimumAuthorityFamilies:2,reviewed:REVIEWED,reviewBy:REVIEW_BY};

/* Extended material practice: intentionally outside the formal 157-keyed approval bank. */
const MATERIAL_PRACTICE=[
 {id:'pbt-hydrolysis',title:'PBT: dry-looking pellets can still be too wet to melt safely',level:'Intermediate',materials:['PBT'],sourceIds:['pbt-basf-guide','iso-15512'],focus:'Polyester hydrolysis and moisture verification',steps:[
  ['Observe','A PBT connector lot loses impact performance while the moulding appearance is mostly acceptable. Which evidence matters first?','Verify actual material moisture and handling history because hydrolysis can reduce molecular weight without an obvious cosmetic warning','Increase clamp force','Polish the cavity','Increase hold time'],
  ['Best next test','What is the strongest next check?','Use the approved moisture method and compare the result with the exact grade requirement and drying/transfer history','Judge dryness from pellet appearance','Raise melt temperature','Use the previous PC drying recipe'],
  ['Controlled response','If excessive moisture is confirmed, what should happen?','Restore the grade-specific closed drying/handling path, verify moisture, then reassess properties and process response','Tune packing until the impact result returns','Blend in more colour','Ignore it if dimensions pass'],
  ['Explain','Why is this case important?','Polyester hydrolysis can damage molecular weight and properties, so appearance alone is not proof of material integrity','PBT never needs drying','Every PBT grade has one universal moisture limit','Impact resistance is controlled only by mould temperature'] ]},
 {id:'pet-vs-copolyester',title:'PET and copolyester: family labels do not define one thermal history',level:'Advanced',materials:['PET','Copolyester'],sourceIds:['tritan-eastman','iso-15512'],focus:'Drying, hydrolysis and crystallinity differences',steps:[
  ['Observe','Two polyester jobs share a dryer but have different supplier instructions. What is the first principle?','Treat the exact grade documentation as controlling because polyester family members can differ in drying and crystallisation behaviour','Use one PET recipe for both','Choose the hotter recipe','Ignore drying if parts are clear'],
  ['Best next test','What should be compared before the changeover?','Exact grade identity, moisture requirement, dryer/transfer capability and the part property target','Only barrel setpoints','Only mould temperature','Only cycle time'],
  ['Controlled response','If the material changes from engineering PET to amorphous copolyester, what is the controlled response?','Rebuild the material-handling and thermal plan from the new grade data rather than carrying the old process across','Keep every setting identical','Increase clamp tonnage','Use part colour as the acceptance criterion'],
  ['Explain','What is the learning point?','Polyester chemistry and grade formulation affect hydrolysis and crystallisation, so family names are not production recipes','PET and copolyester are identical','Crystallinity never affects dimensions','Drying can be inferred from dryer temperature alone'] ]},
 {id:'tpu-moisture-reabsorption',title:'TPU: drying is a system, not a timer',level:'Intermediate',materials:['TPU'],sourceIds:['tpu-lubrizol-drying','iso-15512'],focus:'Moisture, reabsorption and property loss',steps:[
  ['Observe','TPU was dried, then sat in an open hopper during a humid interruption. Which uncertainty matters most?','The moisture state of the resin actually entering the screw after re-exposure','Clamp force','Robot speed','Gate vestige'],
  ['Best next test','What is the best next test?','Measure/verify material moisture and inspect the closed transfer path instead of trusting elapsed dryer time','Increase injection speed','Lower cooling time','Add more back pressure'],
  ['Controlled response','If reabsorption is confirmed, what is the right response?','Restore the supplier-approved drying and protected transfer path, then verify moisture before judging the process','Keep moulding until splay reduces','Increase melt temperature','Open the hopper more often'],
  ['Explain','Why can visual recovery be insufficient?','Moisture can reduce TPU molecular weight and properties even when defects are subtle','TPU moisture affects appearance only','Hardness proves moisture level','All TPEs share the same drying rule'] ]},
 {id:'pmma-optical-stress',title:'PMMA: optical quality needs material and stress evidence',level:'Advanced',materials:['PMMA'],sourceIds:['pmma-plexiglas','pmma-autodesk'],focus:'Optical defects, moisture and moulded-in stress',steps:[
  ['Observe','A clear PMMA lens has intermittent haze and later stress cracking. What should not be assumed?','That one cosmetic symptom proves a single cause; moisture, thermal history and moulded-in stress need separate evidence','That clamp force is too low','That all haze is contamination','That annealing always fixes the moulding process'],
  ['Best next test','Which study is strongest?','Verify material condition, actual melt/mould thermal state and a controlled stress/optical response before changing multiple variables','Raise injection pressure only','Increase screw speed only','Shorten cooling until haze disappears'],
  ['Controlled response','If parts improve after material verification but still crack under the relevant load, what next?','Investigate filling/packing/cooling stress history and geometry rather than continuing to change drying','Dry indefinitely','Increase clamp force','Accept the part because clarity passed'],
  ['Explain','What is the core lesson?','Transparent parts can expose several mechanisms at once; optical appearance and structural stress need separate validation','PMMA is not moisture sensitive','Clear parts cannot contain residual stress','Surface polish controls every defect'] ]},
 {id:'peek-crystallinity-capability',title:'PEEK: machine capability and crystallinity belong in the same decision',level:'Advanced',materials:['PEEK'],sourceIds:['peek-victrex','zhao-2022'],focus:'High-temperature capability, cleanliness and crystallinity',steps:[
  ['Observe','A machine can reach the controller setpoints for PEEK, but tool heating uniformity and melt-path cleanliness are unverified. What is the strongest concern?','A displayed setpoint is not proof the machine/tool system can deliver the required clean and uniform thermal state','PEEK only needs more injection pressure','High temperature automatically ensures crystallinity','Clamp force is the only capability check'],
  ['Best next test','What should be verified before a process study?','Machine/tool temperature capability, actual thermal uniformity, material cleanliness and exact grade requirements','Only shot size','Only mould-open speed','Only part colour'],
  ['Controlled response','If mould-temperature uniformity is poor, what is the controlled response?','Correct/validate the thermal system before drawing conclusions about PEEK material behaviour','Compensate with more hold pressure','Reduce every cycle phase','Ignore it if part mass is stable'],
  ['Explain','Why is PEEK a useful advanced case?','Its high-temperature semi-crystalline process makes equipment capability and actual thermal state part of material validation','PEEK can only be compression moulded','Crystallinity is unrelated to cooling','All high-temperature polymers use identical tooling'] ]},
 {id:'pps-contamination-wear',title:'PPS: low moisture uptake does not remove wear and contamination questions',level:'Advanced',materials:['PPS'],sourceIds:['pps-celanese','iso-20430'],focus:'High-temperature reinforced processing and equipment condition',steps:[
  ['Observe','A glass/mineral-filled PPS job shows black inclusions after a long campaign. What evidence should be separated?','Material contamination/thermal history from screw-barrel/tool wear and stagnant melt-path deposits','Only moisture','Only clamp force','Only robot timing'],
  ['Best next test','What is the strongest investigation?','Inspect material identity/cleanliness plus melt-path and tooling condition using the approved high-temperature shutdown/inspection procedure','Increase temperature to burn deposits away','Bypass guards to look into the nozzle','Increase hold pressure'],
  ['Controlled response','If abrasive wear is confirmed, what is the correct response principle?','Correct the equipment condition and revalidate the process rather than masking delivery drift with settings','Increase screw speed permanently','Ignore wear until the machine fails','Use more regrind'],
  ['Explain','What does the case teach?','A material can have low moisture uptake yet still demand material-specific thermal, wear and contamination controls','Drying is the only material-control topic','Filled PPS is non-abrasive','Machine condition never affects shot repeatability'] ]},
 {id:'lcp-orientation',title:'LCP: easy flow can hide extreme orientation',level:'Advanced',materials:['LCP'],sourceIds:['lcp-celanese','zhao-2022'],focus:'Thin-wall filling, orientation and anisotropy',steps:[
  ['Observe','A thin LCP connector fills easily but has direction-dependent strength and warp. Which clue matters most?','The material can develop strong flow orientation, so easy filling does not mean isotropic properties','Low viscosity guarantees isotropy','Clamp force controls fibre direction','Only moisture can create directional properties'],
  ['Best next test','What should be mapped?','Flow/gate direction, weld locations, thickness transitions and directional mechanical/dimensional response','Only cycle time','Only barrel rear-zone temperature','Only ejector stroke'],
  ['Controlled response','If the weak direction aligns with a weld/orientation feature, what should be studied next?','Gate/tool design and flow-front meeting/orientation before global process compensation','Raise clamp tonnage','Increase cooling equally everywhere','Change measurement direction until it passes'],
  ['Explain','What is the educational point?','Very high flowability can coexist with strong anisotropy, so geometry and flow history still control performance','LCP behaves like unfilled amorphous resin','Thin walls eliminate orientation','High shear always improves toughness'] ]},
 {id:'pcabs-grade-identity',title:'PC/ABS: blend name is not a grade specification',level:'Intermediate',materials:['PC/ABS'],sourceIds:['pcabs-covestro','covestro-drying'],focus:'Blend grade identity, moisture and property balance',steps:[
  ['Observe','A supplier changes from one PC/ABS grade to another with a different flow/flame-performance package. What is the first action?','Treat it as a new exact grade requiring documentation review and controlled equivalence validation','Keep the old process because both labels say PC/ABS','Increase injection pressure','Assume the flame rating is unchanged'],
  ['Best next test','What belongs in the comparison?','Grade datasheets, moisture/handling requirements, rheology, shrinkage and required product properties','Only colour','Only shot size','Only mould temperature'],
  ['Controlled response','If mouldability looks similar but a required property differs, what should happen?','The material/process change remains unvalidated until the product requirement is demonstrated','Approve from appearance','Increase hold pressure','Average old and new data'],
  ['Explain','What is the core lesson?','Polymer-blend family names do not guarantee equivalent flow, drying or end-use properties','Every PC/ABS grade is interchangeable','MFR proves all properties','Blend identity is optional'] ]},
 {id:'hdpe-lot-shrink',title:'HDPE: low moisture uptake does not mean low process sensitivity',level:'Intermediate',materials:['HDPE'],sourceIds:['iso-1133','zhao-2022'],focus:'Crystallinity, shrinkage and lot rheology',steps:[
  ['Observe','An HDPE lot change keeps appearance acceptable but shifts dimensions and fill pressure. What should be checked first?','Material lot rheology/density information together with process and cooling evidence','Dryer dew point only','Clamp force only','Robot speed only'],
  ['Best next test','What is a useful controlled comparison?','Compare defined rheology/material data and in-mould response at the same validated conditions before retuning','Change five settings at once','Use colour as a proxy for viscosity','Assume all HDPE grades shrink identically'],
  ['Controlled response','If rheology changed but quality can be restored, what is still required?','Document and validate the new material/process combination against dimensional and performance requirements','Treat the lot as identical','Hide the change in the setup sheet','Ignore cavity balance'],
  ['Explain','What is the learning point?','Low moisture uptake does not remove crystallinity, rheology and cooling effects on dimensional behaviour','HDPE has no shrinkage','Drying is the only material variable','Pressure alone defines crystallinity'] ]},
 {id:'tpe-overmould-compatibility',title:'TPE overmoulding: softness does not prove adhesion compatibility',level:'Advanced',materials:['TPE','Substrate'],sourceIds:['overmould-2023','overmould-2020'],focus:'Interface thermal history and material compatibility',steps:[
  ['Observe','A soft TPE overmould looks good but peel strength is poor on one substrate grade. What should be separated?','Material-pair compatibility from local interface thermal/flow history','Clamp force from robot timing','Part colour from cycle time','Dryer temperature from ejector speed'],
  ['Best next test','What is the strongest next study?','Verify the exact material pair, surface condition and controlled interface temperature/flow history with mechanical bond testing','Increase clamp force','Judge adhesion by appearance','Shorten cooling only'],
  ['Controlled response','If a different substrate grade restores bond while process conditions are unchanged, what is the correct conclusion?','Material identity/compatibility is a causal factor that belongs in the validated specification','All TPEs bond to all substrates','The process was never relevant','Peel testing is unnecessary'],
  ['Explain','Why is this useful?','Overmould quality is an interface system problem: chemistry, surface and process history all matter','Softness predicts adhesion','Higher injection pressure guarantees bonding','A cosmetic pass proves structural bond'] ]}
];
function normalisePractice(){return MATERIAL_PRACTICE.map(l=>({...l,steps:l.steps.map(s=>({stage:s[0],question:s[1],choices:s.slice(2).map((text,i)=>({text,correct:i===0,feedback:i===0?'Correct. This choice tests the mechanism with the strongest evidence.':'Not the strongest evidence-first response for this scenario.'}))}))}))}
const PRACTICE_LABS=normalisePractice();
window.MM_MATERIAL_PRACTICE_EXTENSIONS={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,labs:PRACTICE_LABS,scope:'Extended scenario-specific practice; not part of the formal 157 keyed approval bank and not a universal production recipe.'};

/* Deterministic synthetic process data: values are illustrative and deliberately not production setpoints. */
function rng(seed){let x=(seed>>>0)||1;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function noise(r,scale){return (r()-0.5)*2*scale}
const DATASET_DEFS=[
 {id:'check-ring-leakage',title:'Shot-delivery drift from non-return-valve leakage',kind:'machine',sourceIds:['nrv-wear-2023','liew-2022'],signals:{partMass_g:[12.4,-0.34,12.4],cushion_mm:[4.8,1.5,4.8],peakInj_MPa:[82,4,82],fill_s:[0.78,0.03,0.78]},fault:'Delivered shot becomes less repeatable while recovery remains broadly stable.'},
 {id:'cooling-restriction',title:'Cooling-circuit restriction and local warpage',kind:'tooling',sourceIds:['autodesk-cooling','zhao-2022'],signals:{flow_Lmin:[8.2,-2.5,8.2],returnTemp_C:[28,7,28],ejectTemp_C:[54,9,54],warpage_mm:[0.34,0.46,0.34]},fault:'A restricted circuit increases thermal imbalance and dimensional response.'},
 {id:'gate-seal-study',title:'Gate-seal mass plateau study',kind:'scientific-moulding',sourceIds:['jansen-1998','autodesk-packing'],signals:{hold_s:[1.0,2.2,3.0],partMass_g:[19.8,0.55,20.35],cavityArea_MPas:[118,24,142],sinkScore:[3.2,-1.4,1.8]},fault:'Mass and pressure-area response approach a plateau as useful gate transmission ends.'},
 {id:'material-moisture-pc',title:'PC moisture interruption and recovery',kind:'material',sourceIds:['covestro-drying','iso-15512'],signals:{moisture_pct:[0.012,0.055,0.012],splayScore:[0.4,4.3,0.4],impactIndex:[100,-18,100],partMass_g:[15.2,0.05,15.2]},fault:'Material handling interruption changes actual moisture before process settings move.'},
 {id:'hot-runner-zone-drift',title:'Hot-runner heater-duty drift before temperature display moves',kind:'tooling',sourceIds:['hotrunner-2024','hotrunner-manifold-2023'],signals:{heaterDuty_pct:[42,24,42],displayTemp_C:[250,1.2,250],cavityMass_g:[8.6,-0.22,8.6],branchPressure_MPa:[58,7,58]},fault:'Heater duty rises while displayed temperature stays deceptively stable.'},
 {id:'valve-gate-timing',title:'Sequential valve-gate timing separation',kind:'tooling',sourceIds:['autodesk-valve-gate','hotrunner-2024'],signals:{gateDelay_ms:[140,65,140],cavity1Fill_ms:[420,3,420],cavity2Fill_ms:[425,48,425],balance_pct:[1.2,8.5,1.2]},fault:'A local timing change separates cavity signatures without a global recipe change.'},
 {id:'local-flash-tooling',title:'One-cavity flash after tool service',kind:'tooling',sourceIds:['autodesk-flash','autodesk-clamp-modeling'],signals:{clamp_kN:[1850,5,1850],cavityPeak_MPa:[62,2,62],flashWidth_mm:[0.02,0.18,0.02],partMass_g:[14.0,0.16,14.0]},fault:'Local flash changes while global clamp behaviour remains stable.'},
 {id:'energy-base-load',title:'Energy per accepted part rises with stable moulding phases',kind:'machine',sourceIds:['euromap-60','energy-review-2017'],signals:{cycle_s:[24.0,0.08,24.0],qualityPass_pct:[99.4,-0.2,99.4],energy_kWh:[0.42,0.12,0.42],heaterDuty_pct:[36,16,36]},fault:'Specific energy rises while process quality/cycle remain stable, pointing to machine/auxiliary load.'},
 {id:'measurement-noise',title:'Measurement-system noise masquerading as dimensional drift',kind:'quality',sourceIds:['nist-handbook','nist-capability'],signals:{trueDim_mm:[25.00,0.00,25.00],measuredDim_mm:[25.00,0.00,25.00],gageSD_mm:[0.015,0.06,0.015],partMass_g:[10.5,0.02,10.5]},fault:'Measurement spread increases while independent process signals remain stable.'},
 {id:'recycled-pp-lot',title:'Recycled PP lot-to-lot rheology shift',kind:'material',sourceIds:['krantz-rpp-2024','iso-1133'],signals:{mfr_g10min:[12.0,2.4,12.3],fillPressure_MPa:[74,-7,73],fill_s:[0.82,-0.05,0.81],warpage_mm:[0.28,0.12,0.29]},fault:'A lot change alters rheology and in-mould response despite a similar nominal material description.'},
 {id:'machine-transfer',title:'Machine transfer: same setpoint, different actual response',kind:'machine',sourceIds:['liew-2022','tsou-2023'],signals:{velocitySet_mm_s:[80,0,80],actualPeak_mm_s:[79,8,80],transferPos_mm:[11.2,-0.7,11.2],partMass_g:[18.1,0.32,18.1]},fault:'A receiving machine reproduces setpoints but not the same actual motion/pressure response.'},
 {id:'cavity-pack-area',title:'Stable peak pressure but changed pressure-time area',kind:'sensor',sourceIds:['araujo-2023','liew-2022'],signals:{peakCavity_MPa:[48,0.8,48],pressureArea_MPas:[126,-18,126],dimension_mm:[40.00,-0.10,40.00],hold_s:[2.4,-0.35,2.4]},fault:'A single peak hides a meaningful change in the full pressure history.'},
 {id:'screw-barrel-wear',title:'Screw/barrel wear and plasticising consistency',kind:'machine',sourceIds:['nrv-wear-2023','liew-2022'],signals:{recovery_s:[4.4,1.1,4.4],meltTemp_C:[235,7,235],shotMass_g:[22.0,-0.30,22.0],backPressure_MPa:[5.5,0.6,5.5]},fault:'Plasticising time/thermal response drift together rather than a purely cavity-side defect.'},
 {id:'ejector-drag',title:'Ejector drag after local cooling imbalance',kind:'tooling',sourceIds:['autodesk-cooling','zhao-2022'],signals:{ejectForce_pct:[42,26,42],surfaceTemp_C:[47,8,47],dragScore:[0.5,3.2,0.5],dimension_mm:[30.00,0.09,30.00]},fault:'Part release load rises with local temperature/geometry response.'}
];
function generateDataset(def,index){
 const r=rng(1000+index*137),rows=[],phases=[['baseline',0],['fault',1],['recovery',2]],cycles=24;
 for(const [phase,p] of phases)for(let i=1;i<=cycles;i++){
   const row={phase,cycle:i};
   for(const [name,v] of Object.entries(def.signals)){
     const base=+v[0],delta=+v[1],recovery=+v[2];
     let target=p===0?base:p===1?base+delta:recovery;
     if(def.id==='measurement-noise'&&name==='measuredDim_mm')target=25+noise(r,p===1?0.06:0.015);
     else target+=noise(r,Math.max(Math.abs(delta)*0.06,Math.abs(base)*0.002,0.002));
     row[name]=+target.toFixed(4);
   }
   rows.push(row);
 }
 return {...def,synthetic:true,rows,phaseCounts:{baseline:cycles,fault:cycles,recovery:cycles},educationBoundary:'Synthetic training data only; values illustrate signal relationships and are not universal production setpoints.'}
}
const DATASETS=DATASET_DEFS.map(generateDataset);
function csv(ds){const keys=['phase','cycle',...Object.keys(ds.signals)],lines=[keys.join(',')];for(const row of ds.rows)lines.push(keys.map(k=>row[k]).join(','));return lines.join('\n')+'\n'}
window.MM_PROCESS_EVIDENCE_DATASETS={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,datasets:DATASETS,byId:id=>DATASETS.find(x=>x.id===id)||null,toCsv:id=>{const d=DATASETS.find(x=>x.id===id);return d?csv(d):''},scope:'Deterministic synthetic training data; not plant data and not a production recipe.'};

/* Reference-entry traceability: stable IDs, per-entry evidence links and review metadata. */
const SECTION_FALLBACKS={
 materials:['iso-1133','trotta-2021','covestro-drying'],defects:['basf-troubleshooter','autodesk-fill-pack','zhao-2022'],signals:['liew-2022','araujo-2023','tsou-2023'],tooling:['autodesk-fill-pack','zhao-2022','iso-20430'],machine:['liew-2022','iso-20430','nrv-wear-2023'],quality:['nist-handbook','nist-capability','adoe-2024'],safety:['iso-20430','hse-ppis4','osha-injection-etool','worksafe-safe-machinery'],troubleshooting:['basf-troubleshooter','autodesk-fill-pack','araujo-2023'],glossary:['nist-handbook','autodesk-fill-pack']
};
function referenceEntries(){
 const R=window.MM_REFERENCE_DATA||{},out=[];
 for(const [section,value] of Object.entries(R)){
  if(!Array.isArray(value))continue;
  for(let i=0;i<value.length;i++){
    const item=value[i];if(!item||typeof item!=='object')continue;
    const label=item.name||item.term||item.title;if(!label)continue;
    out.push({section,index:i,label,item,id:`ref:${section}:${slug(label)}`});
  }
 }
 return out
}
function traceSources(row){
 const text=[row.label,row.section,...Object.values(row.item).filter(x=>typeof x==='string')].join(' '),mapped=E.inferred(text).map(x=>({...x}));
 for(const id of SECTION_FALLBACKS[row.section]||[])add(mapped,id);
 if(mapped.length<2){add(mapped,'nist-handbook');add(mapped,'autodesk-fill-pack');add(mapped,'iso-20430')}
 const diverse=[],seen=new Set();for(const s of mapped){const a=authorityKey(s);if(a&&!seen.has(a)){diverse.push(s);seen.add(a)}}for(const s of mapped)if(!diverse.some(x=>x.url===s.url))diverse.push(s);
 return uniq(diverse).slice(0,6)
}
function referenceAudit(){const records=referenceEntries().map(row=>{const sources=traceSources(row),authorities=new Set(sources.map(authorityKey).filter(Boolean));return {...row,sources,sourceIds:sources.map(s=>s.id),authorityFamilies:[...authorities],status:sources.length>=2&&authorities.size>=2?'strong':sources.length>=2?'supported':'weak',reviewedOn:REVIEWED,reviewBy:REVIEW_BY}});const counts={strong:0,supported:0,weak:0};records.forEach(r=>counts[r.status]++);return {version:VERSION,total:records.length,counts,records}}
window.MM_REFERENCE_TRACEABILITY={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,audit:referenceAudit,record:id=>referenceAudit().records.find(x=>x.id===id)||null};

/* Cohort psychometrics. No network transport; callers must deliberately supply de-identified attempt data. */
function mean(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:0}
function variance(a){if(a.length<2)return 0;const m=mean(a);return a.reduce((s,x)=>s+(x-m)*(x-m),0)/(a.length-1)}
function correlation(a,b){if(a.length!==b.length||a.length<3)return 0;const ma=mean(a),mb=mean(b),num=a.reduce((s,x,i)=>s+(x-ma)*(b[i]-mb),0),den=Math.sqrt(a.reduce((s,x)=>s+(x-ma)**2,0)*b.reduce((s,x)=>s+(x-mb)**2,0));return den?num/den:0}
function percentile(a,p){if(!a.length)return null;const x=a.slice().sort((m,n)=>m-n),pos=(x.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos);return lo===hi?x[lo]:x[lo]+(x[hi]-x[lo])*(pos-lo)}
function psychometricAnalyse(attempts){
 const rows=Array.isArray(attempts)?attempts:[],byLearner=new Map(),byItem=new Map();
 for(const a of rows){if(!a||!a.learnerId||!a.itemId)continue;const score=a.correct?1:0;if(!byLearner.has(a.learnerId))byLearner.set(a.learnerId,[]);byLearner.get(a.learnerId).push({itemId:a.itemId,score});if(!byItem.has(a.itemId))byItem.set(a.itemId,[]);byItem.get(a.itemId).push({...a,score})}
 const totals=Object.fromEntries([...byLearner].map(([id,x])=>[id,x.reduce((s,r)=>s+r.score,0)]));
 const items=[];
 for(const [itemId,x] of byItem){const scores=x.map(r=>r.score),difficulty=mean(scores),rest=x.map(r=>totals[r.learnerId]-r.score),disc=correlation(scores,rest),times=x.map(r=>+r.responseMs||0).filter(v=>v>0),sel={};for(const r of x)if(r.selected!=null)sel[r.selected]=(sel[r.selected]||0)+1;const n=x.length,nonFunctional=Object.entries(sel).filter(([,c])=>c/n<0.05).map(([k])=>k);items.push({itemId,n,difficulty:+difficulty.toFixed(4),discrimination:+disc.toFixed(4),medianResponseMs:times.length?Math.round(percentile(times,.5)):null,selections:sel,nonFunctionalDistractors:nonFunctional})}
 const learners=[...byLearner.keys()],itemIds=[...byItem.keys()],k=itemIds.length,learnerScores=learners.map(id=>totals[id]),pq=itemIds.map(id=>{const p=mean(byItem.get(id).map(r=>r.score));return p*(1-p)}),scoreVar=variance(learnerScores),kr20=(k>1&&scoreVar>0)?k/(k-1)*(1-pq.reduce((a,b)=>a+b,0)/scoreVar):null;
 return {version:VERSION,learners:learners.length,attempts:rows.length,itemCount:k,kr20:kr20==null?null:+kr20.toFixed(4),items,policy:'Empirical item statistics support human review; they do not automatically invalidate a technically correct question.'}
}
function syntheticPsychometricBenchmark(){const r=rng(90210),attempts=[],learners=240,items=30;for(let l=0;l<learners;l++){const ability=(l/(learners-1))*2-1+noise(r,.25);for(let i=0;i<items;i++){const diff=-0.8+(i/(items-1))*1.6,p=1/(1+Math.exp(-(ability-diff)*1.7)),correct=r()<p,selected=correct?'correct':String(Math.floor(r()*3));attempts.push({learnerId:`L${l+1}`,itemId:`B${i+1}`,correct,selected,responseMs:clamp(42000+(diff-ability)*9000+noise(r,7000),8000,120000)})}}return psychometricAnalyse(attempts)}
window.MM_ASSESSMENT_PSYCHOMETRICS={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,analyse:psychometricAnalyse,benchmark:syntheticPsychometricBenchmark,sourceIds:['psychometric-item-2024','psychometric-kr20-2023'],privacy:'No cohort data are uploaded by this module. Analysis runs only on data explicitly supplied to it.'};

/* Minimal phone-friendly data-lab UI, injected without changing the audited core. */
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function ensureDataLabHost(){let host=document.getElementById('processDataLabs');if(host)return host;host=document.createElement('section');host.id='processDataLabs';host.className='page';host.hidden=true;(document.querySelector('.main')||document.querySelector('main')||document.body)?.appendChild(host);return host}
function renderDataLab(id){const host=ensureDataLabHost(),d=DATASETS.find(x=>x.id===id)||DATASETS[0];if(!host||!d)return;const keys=Object.keys(d.signals),rows=d.rows.slice(0,12),sources=d.sourceIds.map(x=>E.sources[x]).filter(Boolean);host.hidden=false;host.innerHTML=`<div class="card"><span class="eyebrow">Synthetic evidence dataset</span><h2>${esc(d.title)}</h2><p>${esc(d.fault)}</p><p class="muted">${esc(d.educationBoundary)}</p><div style="overflow:auto"><table><thead><tr><th>phase</th><th>cycle</th>${keys.map(k=>`<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.phase)}</td><td>${r.cycle}</td>${keys.map(k=>`<td>${esc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p><b>Evidence:</b> ${sources.map(s=>`<a class="standard-link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)} ↗</a>`).join(' · ')}</p><button type="button" data-mm-dataset-download="${esc(d.id)}">Download CSV</button></div>`;host.querySelector('[data-mm-dataset-download]')?.addEventListener('click',()=>{const blob=new Blob([csv(d)],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`mouldmaster-${d.id}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)})}
function installDataLauncher(){if(document.querySelector('[data-mm-process-data-launcher]'))return;const btn=document.createElement('button');btn.type='button';btn.dataset.mmProcessDataLauncher='1';btn.className='ghost';btn.textContent='Process data labs';btn.addEventListener('click',()=>renderDataLab(DATASETS[0].id));const targets=[...document.querySelectorAll('nav,.more-menu,#more,.sidebar')];(targets[targets.length-1]||document.body)?.appendChild(btn)}
function startUi(){try{installDataLauncher()}catch(_){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startUi);else startUi();

window.MM_EVIDENCE_MATURITY={version:VERSION,reviewed:REVIEWED,reviewBy:REVIEW_BY,extraSources:EXTRA_SOURCES,materialPractice:PRACTICE_LABS,datasets:DATASETS,referenceAudit,psychometricAnalyse};
})();
/* <<< evidence-maturity-deep-dive.js */

/* >>> evidence-maturity-formal-bridge.js */
/* MouldMaster formal evidence triangulation bridge — 2026.08.26.6 */
(function(){
'use strict';
const VERSION='2026.08.26.6';
const QUALITY_VERSION='2026.08.30.1';
const E=window.MM_EVIDENCE_SOURCES;
if(!E)throw new Error('assessment-evidence-sources.js must load before formal evidence bridge');

const EXTRA={
 'autodesk-microcellular':{
  name:'Autodesk Moldflow — Microcellular Injection Molding analysis',authority:'Autodesk',kind:'technical documentation',
  url:'https://help.autodesk.com/cloudhelp/2021/ENU/MoldflowInsight-CLC-Analyses/files/molding-processes/GUID-153A6DF0-0451-48D4-BA8E-9747595110B4.html'
 },
 'iso-22514-2':{name:'ISO 22514-2:2026 — process capability and performance',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/88883.html'},
 'iso-22514-7':{name:'ISO 22514-7:2021 — capability of measurement processes',authority:'ISO',kind:'standard',url:'https://www.iso.org/standard/80624.html'},
 'kistler-cavity-pressure':{name:'Kistler — Cavity pressure measurement and process monitoring',authority:'Kistler',kind:'sensor-manufacturer technical guidance',url:'https://www.kistler.com/en/cavity-pressure/cavity-pressure/C00000099'},
 'euromap-77':{name:'EUROMAP 77 — IMM/MES data exchange',authority:'EUROMAP / VDMA',kind:'industry interface specification',url:'https://euromap.org/euromap77'},
 'iso-20816-1':{name:'ISO 20816-1:2016 — general machine-vibration measurement guidance',authority:'ISO',kind:'standard measurement framework',url:'https://www.iso.org/standard/63180.html'}
};
Object.assign(E.sources,EXTRA);

const base=E.inferred.bind(E);
const add=(out,id)=>{const s=E.sources?.[id];if(s&&!out.some(x=>x.url===s.url))out.push({id,...s})};
const authorityFamily=s=>{
 const a=String(s?.authority||'').trim();
 if(a){if(/^peer-reviewed/i.test(a))return 'peer-reviewed research';return a.split('/')[0].trim()}
 try{return new URL(s?.url||'').hostname.replace(/^www\./,'')}catch(_){return ''}
};
E.inferred=function(text){
 const t=String(text||'').toLowerCase(),out=base(text).map(x=>({...x}));
 if(/microcellular|foamed|foam\b|cell morphology|cellular structure|weight reduction.*stiff|stiffness.*weight/.test(t)){
   add(out,'autodesk-microcellular');add(out,'microcellular-mechanics-2022');
 }
 if(/model drift|quality model|prediction error|training.?domain|domain coverage|ground truth|vision model|model output|classifier drift/.test(t)){
   add(out,'nist-ai-drift');add(out,'liew-2022');
 }
 if(/pressure sensor|in.?cavity sensor|cavity pressure|pressure.?time|pressure area|machine peak pressure/.test(t)){
   add(out,'kistler-cavity-pressure');add(out,'araujo-2023');add(out,'liew-2022');add(out,'tsou-2023');
 }
 if(/\bcpk\b|\bcp\b|capabilit|process performance/.test(t)){
   add(out,'iso-22514-2');add(out,'nist-capability');
 }
 if(/measurement|gauge|gage|measurement noise|repeatability|reproducibility/.test(t)){
   add(out,'iso-22514-7');add(out,'nist-handbook');
 }
 if(/flash|parting.?line|shutoff|tool seating|mould seating|mold seating/.test(t)){
   add(out,'basf-troubleshooter');add(out,'autodesk-flash');add(out,'autodesk-clamp');
 }
 return out.slice(0,12);
};

// Formal material-lab approval uses explicit lab.sourceIds, so add the independent
// Delrin supplier guide before assessment-evidence-approval.js snapshots the 157 records.
const pom=window.MM_MATERIAL_BEHAVIOUR_LABS?.labs?.find(x=>x.id==='pom-thermal-safety');
if(pom&&!pom.sourceIds.includes('delrin-pom-molding'))pom.sourceIds.push('delrin-pom-molding');

/* Quality overlay: improve learner-visible feedback for generated scenario drills without
   changing stems, choices, answer keys or evidence fingerprints. */
function wrongFeedback(choice,focus,why){
 const t=String(choice||'').trim(),low=t.toLowerCase(),topic=String(focus||'the stated mechanism').toLowerCase();
 if(/bypass|defeat|disable/.test(low)&&/guard|interlock|safeguard|protection/.test(low))return `Unsafe. Safeguards remain in force; “${t}” is not an acceptable diagnostic action.`;
 if(/\b(always|never|only|every|all|identical|automatically|guarantee)\b/.test(low))return `“${t}” overgeneralises beyond the evidence. The decision must stay specific to ${topic}.`;
 if(/^(increase|reduce|lower|raise|change|adjust|shorten|lengthen|keep|blend|dry)/.test(low))return `“${t}” changes or carries forward a condition before ${topic} is verified. ${why||'Test the stated mechanism first.'}`;
 if(/^(ignore|approve|accept|assume|judge|treat)/.test(low))return `“${t}” accepts a conclusion without the evidence needed to establish ${topic}. ${why||'Keep the evidence boundary explicit.'}`;
 return `“${t}” is less discriminating for ${topic}. ${why||'Prefer the observation or test that most directly separates the plausible mechanisms.'}`;
}
const scenarioRows=window.MM_DATA?.scenarios||[];
let scenarioFeedbackUpgraded=0;
for(const s of scenarioRows){
 const choices=Array.isArray(s?.choices)?s.choices:[],feedback=Array.isArray(s?.feedback)?s.feedback:[];
 const unique=new Set(feedback.map(x=>String(x||'').trim().toLowerCase()).filter(Boolean));
 if(choices.length!==4||!Number.isInteger(Number(s?.correct))||Number(s.correct)<0||Number(s.correct)>3||unique.size>=3)continue;
 const key=Number(s.correct),why=String(s.why||'').trim(),focus=String(s.category||s.title||'the stated mechanism');
 s.feedback=choices.map((choice,i)=>i===key?`Correct. ${why}`:wrongFeedback(choice,focus,why));
 scenarioFeedbackUpgraded++;
}

/* The 40 extended material-practice decisions sit outside the formal 157-keyed bank.
   Preserve their evidence-backed mechanisms while removing two avoidable assessment cues:
   verbose keyed answers and a fixed first-position key. */
const OPTIONAL_CORRECT={
 'pbt-hydrolysis:0':'Measure actual resin moisture',
 'pbt-hydrolysis:1':'Measure moisture against the exact grade requirement',
 'pbt-hydrolysis:2':'Restore approved drying and verify moisture',
 'pbt-hydrolysis:3':'Hydrolysis can reduce molecular weight and properties',
 'pet-vs-copolyester:0':'Follow the exact grade guidance for each polyester',
 'pet-vs-copolyester:1':'Compare grade identity, moisture needs and product requirements',
 'pet-vs-copolyester:2':'Rebuild drying and thermal controls from the new grade data',
 'pet-vs-copolyester:3':'Polyester grade chemistry changes hydrolysis and crystallisation behaviour',
 'tpu-moisture-reabsorption:0':'Verify moisture in the resin entering the screw',
 'tpu-moisture-reabsorption:1':'Measure moisture and inspect the protected transfer path',
 'tpu-moisture-reabsorption:2':'Restore approved drying and transfer, then verify moisture',
 'tpu-moisture-reabsorption:3':'Moisture can reduce TPU molecular weight and properties',
 'pmma-optical-stress:0':'Do not assume one cosmetic symptom proves one cause',
 'pmma-optical-stress:1':'Verify material condition, thermal actuals and stress response',
 'pmma-optical-stress:2':'Investigate filling, packing and cooling stress history',
 'pmma-optical-stress:3':'Validate optical appearance and structural stress separately',
 'peek-crystallinity-capability:0':'Setpoints alone do not prove clean, uniform thermal capability',
 'peek-crystallinity-capability:1':'Verify machine/tool thermal capability and exact grade needs',
 'peek-crystallinity-capability:2':'Correct and validate the thermal system first',
 'peek-crystallinity-capability:3':'Equipment capability and thermal state affect PEEK validation',
 'pps-contamination-wear:0':'Separate contamination history from equipment wear',
 'pps-contamination-wear:1':'Inspect material cleanliness and melt-path/tool condition safely',
 'pps-contamination-wear:2':'Correct equipment wear and revalidate the process',
 'pps-contamination-wear:3':'PPS still needs thermal, wear and contamination controls',
 'lcp-orientation:0':'Easy filling does not rule out strong flow orientation',
 'lcp-orientation:1':'Map flow direction, welds, thickness and directional response',
 'lcp-orientation:2':'Study gate/tool design and orientation before global compensation',
 'lcp-orientation:3':'High flowability can coexist with strong anisotropy',
 'pcabs-grade-identity:0':'Treat the replacement as a new exact grade requiring validation',
 'pcabs-grade-identity:1':'Compare grade data, moisture, rheology, shrinkage and product needs',
 'pcabs-grade-identity:2':'Keep the change unvalidated until the required property is proven',
 'pcabs-grade-identity:3':'PC/ABS family names do not guarantee equivalent properties',
 'hdpe-lot-shrink:0':'Check lot rheology/density with process and cooling evidence',
 'hdpe-lot-shrink:1':'Compare material data and in-mould response at fixed conditions',
 'hdpe-lot-shrink:2':'Validate the new material/process combination against requirements',
 'hdpe-lot-shrink:3':'HDPE dimensions still depend on crystallinity, rheology and cooling',
 'tpe-overmould-compatibility:0':'Separate material compatibility from interface thermal/flow history',
 'tpe-overmould-compatibility:1':'Verify the material pair, surface and bond strength under controlled conditions',
 'tpe-overmould-compatibility:2':'Material compatibility belongs in the validated specification',
 'tpe-overmould-compatibility:3':'Overmould quality depends on chemistry, surface and process history'
};
const PRACTICE=window.MM_MATERIAL_PRACTICE_EXTENSIONS;
let optionalChoicesUpgraded=0;
const optionalKeyPositions=[0,0,0,0];
const plausibleQualifier={
 'Observe':' while holding the remaining conditions at the known baseline',
 'Best next test':' under a controlled repeat with a documented acceptance rule',
 'Controlled response':' then verify the result against the same baseline evidence',
 'Explain':' as the primary mechanism across the stated observations'
};
function extendChoice(choice,target,suffix){while(String(choice.text||'').length<target)choice.text=String(choice.text||'').trim()+suffix}
function ensureBalancedDistractors(wrong,correctLength,stage){
 const suffix=plausibleQualifier[stage]||' under the same controlled comparison';
 const safe=wrong.filter(c=>!/bypass|defeat|disable/i.test(String(c.text||''))),pool=safe.length>=2?safe:wrong;
 if(!pool.length)return;
 const longest=pool.reduce((a,b)=>String(a.text||'').length>=String(b.text||'').length?a:b);
 extendChoice(longest,correctLength+1,suffix);
 const ranked=pool.slice().sort((a,b)=>String(b.text||'').length-String(a.text||'').length),medianFloor=Math.ceil(correctLength/1.7);
 for(const choice of ranked.slice(0,2))extendChoice(choice,medianFloor,suffix);
}
if(PRACTICE?.labs){
 PRACTICE.labs.forEach((lab,labIndex)=>(lab.steps||[]).forEach((step,stepIndex)=>{
   const choices=Array.isArray(step.choices)?step.choices.map(c=>({...c})):[];
   if(choices.length!==4)return;
   let keyIndex=choices.findIndex(c=>c.correct===true);if(keyIndex<0)return;
   const mapKey=`${lab.id}:${stepIndex}`,replacement=OPTIONAL_CORRECT[mapKey];
   if(!replacement)throw new Error(`Missing optional-practice quality mapping: ${mapKey}`);
   choices[keyIndex].text=replacement;
   const correctChoice=choices[keyIndex],wrong=choices.filter((_,i)=>i!==keyIndex);
   ensureBalancedDistractors(wrong,String(correctChoice.text).length,step.stage);
   const focus=String(lab.focus||'the stated mechanism').toLowerCase();
   correctChoice.feedback=`Correct. ${correctChoice.text}. This directly addresses ${focus}.`;
   wrong.forEach(c=>{c.feedback=wrongFeedback(c.text,focus,'Test the material or process mechanism with the most direct evidence before changing unrelated conditions.')});
   const targetPosition=(labIndex*4+stepIndex)%4,reordered=wrong.slice();reordered.splice(targetPosition,0,correctChoice);step.choices=reordered;
   optionalKeyPositions[targetPosition]++;optionalChoicesUpgraded++;
 }));
}
if(optionalChoicesUpgraded&&optionalChoicesUpgraded!==40)throw new Error(`Optional-practice quality coverage mismatch: ${optionalChoicesUpgraded}/40`);
if(optionalChoicesUpgraded&&optionalKeyPositions.some(x=>x!==10))throw new Error(`Optional-practice key positions are unbalanced: ${optionalKeyPositions.join(',')}`);
window.MM_QUESTION_QUALITY_OVERLAY={version:QUALITY_VERSION,scenarioFeedbackUpgraded,optionalChoicesUpgraded,optionalKeyPositions:optionalKeyPositions.slice(),optionalAnswerLengthPolicy:'keyed option must not be longest or tied-longest',optionalKeyPositionPolicy:'10 keyed decisions in each of four positions',evidenceMechanismsPreserved:true};

// Reference extensions can legitimately contain repeated display names. Preserve every
// live record, triangulate the remaining signal entries, and give each record a deterministic ID.
const RT=window.MM_REFERENCE_TRACEABILITY;
if(RT?.audit){
 const baseAudit=RT.audit.bind(RT);
 const dynamicKeys=new Set(['id','sources','sourceIds','authorityFamilies','status','reviewedOn','reviewBy']);
 const semanticIdentity=row=>{
   const stable={};
   for(const key of Object.keys(row||{}).sort())if(!dynamicKeys.has(key))stable[key]=row[key];
   return E.hash(JSON.stringify(stable));
 };
 const enrichReference=row=>{
   const sources=(row.sources||[]).map(s=>({...s})),key=String(row.id||'').toLowerCase();
   if(key.includes('screw-torque-drive-load'))add(sources,'euromap-77');
   if(key.includes('local-cavity-pressure-features'))add(sources,'kistler-cavity-pressure');
   if(key.includes('machine-vibration-features'))add(sources,'iso-20816-1');
   if(key.includes('vision-defect-score')||key.includes('anomaly-score'))add(sources,'nist-ai-drift');
   const families=[...new Set(sources.map(authorityFamily).filter(Boolean))];
   return {...row,sources,sourceIds:sources.map(s=>s.id),authorityFamilies:families,status:sources.length>=2&&families.length>=2?'strong':sources.length>=2?'supported':'weak'};
 };
 const hardenedAudit=()=>{
   const result=baseAudit(),seen=new Map();
   const records=(result.records||[]).map(enrichReference).map((row,index)=>{
     const baseId=String(row.id||`ref:record:${index}`),semantic=semanticIdentity(row);
     const candidate=`${baseId}:${semantic}`;
     const occurrence=(seen.get(candidate)||0)+1;seen.set(candidate,occurrence);
     return {...row,id:occurrence===1?candidate:`${candidate}:${occurrence}`};
   });
   const counts={strong:0,supported:0,weak:0};records.forEach(r=>counts[r.status]++);
   return {...result,records,total:records.length,counts};
 };
 RT.audit=hardenedAudit;
 RT.record=id=>hardenedAudit().records.find(x=>x.id===id)||null;
 RT.idPolicy={version:VERSION,scheme:'existing-semantic-id + content hash + duplicate ordinal',preservesAllEntries:true};
 RT.triangulationPolicy={version:VERSION,minimumUrls:2,minimumAuthorityFamilies:2,signalFrameworks:{'screw-torque-drive-load':'EUROMAP 77','local-cavity-pressure-features':'Kistler','machine-vibration-features':'ISO 20816-1','vision-defect-score':'NIST AI RMF','anomaly-score':'NIST AI RMF'}};
}

E.version=VERSION;
E.formalTriangulationBridge={
 version:VERSION,minimumDistinctUrls:2,minimumAuthorityFamilies:2,
 capabilityAuthorities:['NIST','ISO'],measurementAuthorities:['NIST','ISO'],
 cavityPressureAuthorities:['peer-reviewed research','Kistler'],flashAuthorities:['Autodesk','BASF'],
 microcellularIndependentAuthority:'Autodesk',pomIndependentSuppliers:['Celanese','Delrin'],
 referenceIdPolicy:'semantic-hash-with-duplicate-ordinal',referenceSignalAuthorities:['EUROMAP','Kistler','ISO','NIST'],localOnly:true
};
})();
/* <<< evidence-maturity-formal-bridge.js */
