use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalFont {
    pub family: String,
    pub style: String,   // "Regular", "Bold", "Italic", etc.
    pub weight: u32,
    pub path: String,    // absolute path to the font file
}

/// Returns the platform-specific font directories to scan.
fn font_dirs() -> Vec<PathBuf> {
    let mut dirs: Vec<PathBuf> = Vec::new();

    #[cfg(target_os = "windows")]
    {
        // System fonts
        if let Ok(windir) = std::env::var("WINDIR").or_else(|_| std::env::var("SystemRoot")) {
            dirs.push(PathBuf::from(&windir).join("Fonts"));
        } else {
            dirs.push(PathBuf::from(r"C:\Windows\Fonts"));
        }
        // Per-user fonts (Windows 10+)
        if let Ok(localappdata) = std::env::var("LOCALAPPDATA") {
            dirs.push(PathBuf::from(&localappdata).join("Microsoft").join("Windows").join("Fonts"));
        }
    }

    #[cfg(target_os = "macos")]
    {
        dirs.push(PathBuf::from("/System/Library/Fonts"));
        dirs.push(PathBuf::from("/Library/Fonts"));
        if let Some(home) = std::env::var("HOME").ok() {
            dirs.push(PathBuf::from(&home).join("Library").join("Fonts"));
        }
        // Adobe fonts installed via Creative Cloud
        if let Some(home) = std::env::var("HOME").ok() {
            dirs.push(PathBuf::from(&home).join("Library").join("Application Support").join("Adobe").join("Fonts"));
        }
    }

    #[cfg(target_os = "linux")]
    {
        dirs.push(PathBuf::from("/usr/share/fonts"));
        dirs.push(PathBuf::from("/usr/local/share/fonts"));
        if let Ok(home) = std::env::var("HOME") {
            dirs.push(PathBuf::from(&home).join(".local").join("share").join("fonts"));
            dirs.push(PathBuf::from(&home).join(".fonts"));
        }
    }

    dirs.into_iter().filter(|d| d.exists()).collect()
}

fn name_record_to_string(data: &[u8]) -> Option<String> {
    // Try UTF-16 BE first (platform ID 3 = Windows), then UTF-8
    if data.len() >= 2 && data.len() % 2 == 0 {
        let s: String = data
            .chunks(2)
            .filter_map(|c| char::from_u32(u16::from_be_bytes([c[0], c[1]]) as u32))
            .filter(|c| !c.is_control() || *c == '\n')
            .collect();
        let trimmed = s.trim().to_string();
        if !trimmed.is_empty() && trimmed.is_ascii() {
            return Some(trimmed);
        }
    }
    // Fall back to UTF-8
    std::str::from_utf8(data).ok().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}

fn parse_font_file(path: &PathBuf) -> Vec<LocalFont> {
    let data = match std::fs::read(path) {
        Ok(d) => d,
        Err(_) => return vec![],
    };
    let path_str = path.to_string_lossy().to_string();

    // Try as a font collection (.ttc/.otc) first, then single font
    let face_count = ttf_parser::fonts_in_collection(&data).unwrap_or(1);
    let mut results = Vec::new();

    for idx in 0..face_count {
        let face = match ttf_parser::Face::parse(&data, idx) {
            Ok(f) => f,
            Err(_) => continue,
        };

        let mut family: Option<String> = None;
        let mut style: Option<String> = None;

        // Walk name table: ID 1 = family, ID 2 = subfamily (style)
        for name in face.names() {
            match name.name_id {
                1 if family.is_none() => {
                    family = name_record_to_string(name.name);
                }
                2 if style.is_none() => {
                    style = name_record_to_string(name.name);
                }
                // Prefer ID 4 (full name) as fallback for family
                4 if family.is_none() => {
                    family = name_record_to_string(name.name);
                }
                _ => {}
            }
        }

        let family = match family {
            Some(f) if !f.is_empty() => f,
            _ => continue,
        };
        let style = style.unwrap_or_else(|| "Regular".to_string());

        // Derive numeric weight from OS/2 table weight class, falling back to style name
        let weight = face.weight().to_number() as u32;
        let weight = if weight == 0 {
            style_to_weight(&style)
        } else {
            weight
        };

        results.push(LocalFont {
            family,
            style,
            weight,
            path: path_str.clone(),
        });
    }

    results
}

fn style_to_weight(style: &str) -> u32 {
    let s = style.to_lowercase();
    if s.contains("thin") { 100 }
    else if s.contains("extralight") || s.contains("extra light") || s.contains("ultra light") { 200 }
    else if s.contains("light") { 300 }
    else if s.contains("medium") { 500 }
    else if s.contains("semibold") || s.contains("semi bold") || s.contains("demibold") { 600 }
    else if s.contains("extrabold") || s.contains("extra bold") || s.contains("ultrabold") { 800 }
    else if s.contains("bold") { 700 }
    else if s.contains("black") || s.contains("heavy") { 900 }
    else { 400 }
}

/// Scan all system font directories and return discovered fonts.
/// Each entry has family, style, weight, and the absolute path so the
/// frontend can inject an @font-face rule using the asset:// protocol.
#[tauri::command]
pub fn scan_local_fonts() -> Vec<LocalFont> {
    let dirs = font_dirs();
    let extensions = ["ttf", "otf", "ttc", "otc", "woff", "woff2"];

    // Deduplicate by path
    let mut seen_paths = std::collections::HashSet::new();
    let mut fonts: Vec<LocalFont> = Vec::new();

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
            let ext = match ext {
                Some(e) if extensions.contains(&e.as_str()) => e,
                _ => continue,
            };

            // Skip woff/woff2 — browsers handle those differently and
            // they're rarely in system font folders anyway.
            if ext == "woff" || ext == "woff2" { continue; }

            let path_str = path.to_string_lossy().to_string();
            if !seen_paths.insert(path_str) { continue; }

            fonts.extend(parse_font_file(&path));
        }
    }

    // Sort by family then style
    fonts.sort_by(|a, b| a.family.cmp(&b.family).then(a.style.cmp(&b.style)));
    fonts
}

/// Group the flat font list into families with their available weights.
/// Returns a map of family -> sorted list of weights found locally.
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![scan_local_fonts, group_local_fonts])
        .run(tauri::generate_context!())
        .expect("error while running FontVault");
}
