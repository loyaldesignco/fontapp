use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use walkdir::WalkDir;

mod commands;

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::scan_local_fonts,
            commands::group_local_fonts,
            commands::get_cached_fonts
        ])
        .run(tauri::generate_context!())
        .expect("error while running FontVault");
}
