// FontVault — Tauri backend entry point.
//
// Native features (local system-font scanning, font-file caching, Adobe-installed-font
// detection) are added here as #[tauri::command] functions and registered in
// `invoke_handler`. See HANDOFF.md, "Phase 3 — native powers".

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // .invoke_handler(tauri::generate_handler![list_system_fonts])
        .run(tauri::generate_context!())
        .expect("error while running FontVault");
}
