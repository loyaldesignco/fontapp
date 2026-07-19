use crate::{font_dirs, parse_font_file, LocalFont};
use std::collections::HashMap;
use rayon::prelude::*;
use walkdir::WalkDir;

#[tauri::command]
pub fn scan_local_fonts() -> Vec<LocalFont> {
    let dirs = font_dirs();
    let extensions = ["ttf", "otf", "ttc", "otc"];

    // Collect all unique font file paths first
    let mut seen_paths = std::collections::HashSet::new();
    let mut paths: Vec<std::path::PathBuf> = Vec::new();

    for dir in dirs {
        for entry in WalkDir::new(&dir)
            .follow_links(true)
            .max_depth(4)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path().to_path_buf();
            if !path.is_file() { continue; }

            let ext = path.extension()
                .and_then(|e| e.to_str())
                .map(|e| e.to_lowercase());
            match ext {
                Some(e) if extensions.contains(&e.as_str()) => {}
                _ => continue,
            };

            let path_str = path.to_string_lossy().to_string();
            if seen_paths.insert(path_str) {
                paths.push(path);
            }
        }
    }

    // Parse all font files in parallel
    let mut fonts: Vec<LocalFont> = paths
        .par_iter()
        .flat_map(|p| parse_font_file(p))
        .collect();

    fonts.sort_by(|a, b| a.family.cmp(&b.family).then(a.style.cmp(&b.style)));
    fonts
}

#[tauri::command]
pub fn group_local_fonts(fonts: Vec<LocalFont>) -> HashMap<String, Vec<u32>> {
    let mut map: HashMap<String, Vec<u32>> = HashMap::new();
    for f in fonts {
        map.entry(f.family).or_default().push(f.weight);
    }
    for weights in map.values_mut() {
        weights.sort();
        weights.dedup();
    }
    map
}
