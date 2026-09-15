use std::{fs, path::Path};
use tauri::Manager;

const MAX_PDF_BYTES: u64 = 512 * 1024 * 1024;
const MAX_SIDECAR_BYTES: usize = 10 * 1024 * 1024;

fn valid_sha256(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

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

#[tauri::command]
fn load_sidecar(app: tauri::AppHandle, document_sha256: String) -> Result<Option<String>, String> {
    if !valid_sha256(&document_sha256) {
        return Err("Invalid document SHA-256.".into());
    }

    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Cannot resolve app data directory: {error}"))?
        .join("sidecars");
    let path = directory.join(format!("{document_sha256}.json"));

    if !path.exists() {
        return Ok(None);
    }

    let metadata = fs::metadata(&path).map_err(|error| format!("Cannot inspect sidecar: {error}"))?;
    if metadata.len() > MAX_SIDECAR_BYTES as u64 {
        return Err("Sidecar exceeds the current 10 MB safety limit.".into());
    }

    fs::read_to_string(path)
        .map(Some)
        .map_err(|error| format!("Cannot read sidecar: {error}"))
}

#[tauri::command]
fn save_sidecar(
    app: tauri::AppHandle,
    document_sha256: String,
    contents: String,
) -> Result<(), String> {
    if !valid_sha256(&document_sha256) {
        return Err("Invalid document SHA-256.".into());
    }
    if contents.len() > MAX_SIDECAR_BYTES {
        return Err("Sidecar exceeds the current 10 MB safety limit.".into());
    }

    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Cannot resolve app data directory: {error}"))?
        .join("sidecars");
    fs::create_dir_all(&directory)
        .map_err(|error| format!("Cannot create sidecar directory: {error}"))?;

    let path = directory.join(format!("{document_sha256}.json"));
    let temporary = directory.join(format!("{document_sha256}.json.tmp"));
    fs::write(&temporary, contents).map_err(|error| format!("Cannot write sidecar: {error}"))?;
    if path.exists() {
        fs::remove_file(&path).map_err(|error| format!("Cannot replace sidecar: {error}"))?;
    }
    fs::rename(temporary, path).map_err(|error| format!("Cannot finalize sidecar: {error}"))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_pdf, load_sidecar, save_sidecar])
        .run(tauri::generate_context!())
        .expect("error while running Open Document Understanding");
}
