#!/usr/bin/env python3
"""Public Mendeley download/normalisation adapter for gtnb4j7bfx v1.

The publisher's v1 workbook uses one mixed Spanish-language sheet containing both
injection- and blow-moulding records. The associated peer-reviewed paper documents the
machine convention (I/INY = injection, S/SOP = blow) and reports 4,502 injection plus
1,855 blow records. This adapter pins that discovered v1 schema, proves those aggregate
counts from the downloaded file, keeps only the 4,502 injection records, translates the
26 injection fields to MouldMaster's canonical contract names, preserves missing cells,
and delegates aggregate profiling to run_public_benchmark_gtnb4j7bfx.py.

No row values are printed or uploaded. If the source schema or machine partition changes,
the adapter emits schema-only diagnostics and fails closed for human review.
"""

from __future__ import annotations

import json
import re
import unicodedata
import urllib.parse

import run_public_benchmark_gtnb4j7bfx as benchmark

PUBLIC_FILES_ENDPOINT = (
    f"https://data.mendeley.com/public-api/datasets/{benchmark.DATASET_ID}/files"
    f"?folder_id=root&version={urllib.parse.quote(benchmark.DATASET_VERSION)}"
)
EXPECTED_PUBLISHER_FILE = "modelo.xlsx"
EXPECTED_SHEET = "nicky"
EXPECTED_SOURCE_ROWS = 6357
EXPECTED_INJECTION_ROWS = 4502
EXPECTED_BLOW_ROWS = 1855

# Version-pinned source header -> canonical MouldMaster contract header.
SOURCE_TO_CANONICAL = [
    ("Fecha_registro", "Date_Recorded"),
    ("Maquina", "Machine"),
    ("Turno", "Shift"),
    ("Nombre_producto", "Product_Name"),
    ("Peso_producto_gramos", "Product_Weight"),
    ("Produccion_requerida", "Required_Production"),
    ("Producto_rechazados", "Rejected_Products"),
    ("Produccion_total", "Total_Production"),
    ("Peso_prom_bruto", "Avg_Gross_Weight"),
    ("Consumo_PP_kilos", "PP_Consumption"),
    ("Consumo_pigmento_kilos", "Pigment_Consumption"),
    ("Kilos_colada", "Flash_kg"),
    ("Kilos_defectuosos", "Defective_kg"),
    ("%Colada", "%Flash"),
    ("%Defectuosos", "%Defective"),
    ("%Reproceso", "%Reprocess"),
    ("Cavidades_molde", "Mold_Cavities"),
    ("Presion_inyeccion_bares", "Injection_Pressure"),
    ("Presion_retencion_bares", "Retention_Pressure"),
    ("Temp_mat_fundido", "Melt_Temp"),
    ("Temp_molde_centigrados", "Mold_Temp"),
    ("Tiempo_ciclo", "Cycle_Time"),
    ("Tiempo_enfriamiento_inyeccion_seg", "Cooling_Time_Injection"),
    ("Tiempo_expulsion_inyeccion_seg", "Ejection_Time_Injection"),
    ("Tiempo_retencion_inyeccion_seg", "Retention_Time_Injection"),
    ("Velocidad_de_Inyección_mm/s", "Injection_Speed"),
]
BLOW_SOURCE_HEADERS = {
    "Tiempo_de_extrusion_del_parison_soplado",
    "Tiempo_de_cierre_del_molde_soplado",
    "Tiempo_de_soplado",
    "Tiempo_de_enfriamiento_soplado",
    "Tiempo_de_expulsion_soplado",
    "Presion_soplado_psi",
    "Flujo_de_aire_soplado_l/min",
}

_original_fetch = benchmark.fetch_public_file_list
_original_select = benchmark.select_injection_candidate


def source_norm(value):
    ascii_value = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii")
    return benchmark.norm(ascii_value)


SOURCE_KEY_TO_CANONICAL = {source_norm(source): canonical for source, canonical in SOURCE_TO_CANONICAL}
BLOW_SOURCE_KEYS = {source_norm(name) for name in BLOW_SOURCE_HEADERS}


def fetch_public_file_list():
    errors = []
    try:
        payload = json.loads(
            benchmark.http_get(PUBLIC_FILES_ENDPOINT, accept="application/json").decode("utf-8")
        )
        files = benchmark.flatten_files(payload) if isinstance(payload, dict) else payload
        if isinstance(files, list) and files:
            return files, PUBLIC_FILES_ENDPOINT
        errors.append("public-api returned an empty file list")
    except Exception as exc:
        errors.append(str(exc))

    try:
        return _original_fetch()
    except Exception as exc:
        errors.append(str(exc))
    raise RuntimeError("all publisher retrieval routes failed; " + " | ".join(errors))


def machine_index(candidate):
    header_map = {source_norm(name): index for index, name in enumerate(candidate.get("headers", []))}
    return header_map.get("maquina", header_map.get("machine"))


def classify_machine(value):
    value = str(value or "").strip().upper()
    if not value:
        return "blank"
    if re.fullmatch(r"I(?:-|_)?\d+", value) or value.startswith("INY"):
        return "injection_prefix"
    if re.fullmatch(r"S(?:-|_)?\d+", value) or value.startswith("SOP"):
        return "blow_prefix"
    return "other"


def machine_class_counts(candidate):
    index = machine_index(candidate)
    if index is None:
        return None
    counts = {"injection_prefix": 0, "blow_prefix": 0, "blank": 0, "other": 0}
    for row in candidate.get("rows", []):
        value = row[index] if index < len(row) else ""
        counts[classify_machine(value)] += 1
    return counts


def source_specific_injection_candidate(candidates):
    """Return a canonical 4,502-row injection candidate only if v1 is exactly proven."""
    canonical_headers = [canonical for _, canonical in SOURCE_TO_CANONICAL]
    for candidate in candidates:
        source = candidate.get("source_item") or {}
        filename = str(source.get("publisher_filename") or source.get("name") or "")
        if filename != EXPECTED_PUBLISHER_FILE or candidate.get("sheet") != EXPECTED_SHEET:
            continue
        if int(candidate.get("row_count", 0)) != EXPECTED_SOURCE_ROWS:
            continue

        header_index = {source_norm(name): index for index, name in enumerate(candidate.get("headers", []))}
        if not set(SOURCE_KEY_TO_CANONICAL) <= set(header_index):
            continue
        if not BLOW_SOURCE_KEYS <= set(header_index):
            continue
        m_index = header_index.get("maquina")
        if m_index is None:
            continue

        counts = machine_class_counts(candidate)
        if counts != {
            "injection_prefix": EXPECTED_INJECTION_ROWS,
            "blow_prefix": EXPECTED_BLOW_ROWS,
            "blank": 0,
            "other": 0,
        }:
            continue

        source_indexes = [header_index[source_norm(source_name)] for source_name, _ in SOURCE_TO_CANONICAL]
        injection_rows = []
        for row in candidate.get("rows", []):
            machine_value = row[m_index] if m_index < len(row) else ""
            if classify_machine(machine_value) != "injection_prefix":
                continue
            injection_rows.append([row[index] if index < len(row) else "" for index in source_indexes])
        if len(injection_rows) != EXPECTED_INJECTION_ROWS:
            continue

        selected = dict(candidate)
        selected["headers"] = canonical_headers
        selected["rows"] = injection_rows
        selected["row_count"] = len(injection_rows)
        selected["injection_hits"] = sorted(
            {benchmark.norm(name) for name in canonical_headers} & benchmark.INJECTION_HEADER_TOKENS
        )
        selected["blow_hits"] = []
        selected["score"] = len(selected["injection_hits"]) * 4
        selected["machine_partition_counts"] = {
            "injection_rows": EXPECTED_INJECTION_ROWS,
            "blow_rows_excluded": EXPECTED_BLOW_ROWS,
            "unclassified_rows": 0,
        }
        selected["source_schema_translation"] = {
            "source_language": "Spanish",
            "source_columns": len(candidate.get("headers", [])),
            "canonical_injection_columns": len(canonical_headers),
            "blow_only_columns_excluded": len(BLOW_SOURCE_HEADERS),
            "missing_cells_preserved": True,
            "unit_conversion_performed": False,
        }
        return selected
    return None


def safe_candidate_diagnostic(candidate):
    source = candidate.get("source_item") or {}
    return {
        "publisher_filename": source.get("publisher_filename") or source.get("name"),
        "publisher_file_id": source.get("publisher_file_id") or source.get("id"),
        "sheet": candidate.get("sheet"),
        "row_count": int(candidate.get("row_count", 0)),
        "column_count": len(candidate.get("headers", [])),
        "headers": list(candidate.get("headers", [])),
        "injection_header_matches": list(candidate.get("injection_hits", [])),
        "blow_header_matches": list(candidate.get("blow_hits", [])),
        "selection_score": candidate.get("score"),
        "machine_class_counts": machine_class_counts(candidate),
        "raw_rows_printed": False,
        "measurement_values_printed": False,
    }


def select_injection_candidate_with_safe_diagnostics(candidates):
    source_specific = source_specific_injection_candidate(candidates)
    if source_specific is not None:
        return source_specific, "v1-spanish-schema+documented-machine-prefix"
    try:
        return _original_select(candidates)
    except Exception:
        print("MOULDMASTER_SAFE_BENCHMARK_SCHEMA_DIAGNOSTICS_BEGIN")
        for candidate in candidates:
            print(json.dumps(safe_candidate_diagnostic(candidate), ensure_ascii=False, sort_keys=True))
        print("MOULDMASTER_SAFE_BENCHMARK_SCHEMA_DIAGNOSTICS_END")
        raise


benchmark.fetch_public_file_list = fetch_public_file_list
benchmark.select_injection_candidate = select_injection_candidate_with_safe_diagnostics

if __name__ == "__main__":
    benchmark.main()
