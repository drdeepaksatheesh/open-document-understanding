use std::{fs, path::Path};

const MAX_PDF_BYTES: u64 = 512 * 1024 * 1024;

#[tauri::command]
fn read_pdf(path: String) -> Result<Vec<u8>, String> {
    let path_ref = Path::new(&path);
    let is_pdf = path_ref
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.eq_ignore_ascii_case("pdf"))
        .unwrap_or(false);

    if !is_pdf {
        return Err("Only PDF files can be opened in this milestone.".into());
    }

    let metadata = fs::metadata(path_ref).map_err(|error| format!("Cannot inspect file: {error}"))?;
    if !metadata.is_file() {
        return Err("The selected path is not a regular file.".into());
    }
    if metadata.len() > MAX_PDF_BYTES {
        return Err("PDF is larger than the current 512 MB safety limit.".into());
    }

    fs::read(path_ref).map_err(|error| format!("Cannot read PDF: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_pdf])
        .run(tauri::generate_context!())
        .expect("error while running Open Document Understanding");
}
