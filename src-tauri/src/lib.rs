use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::Read,
    panic::{catch_unwind, AssertUnwindSafe},
    path::{Component, Path, PathBuf},
};
use tauri::Manager;

const MAX_PDF_BYTES: u64 = 512 * 1024 * 1024;
const MAX_SIDECAR_BYTES: usize = 10 * 1024 * 1024;
const MAX_MODEL_MANIFEST_BYTES: u64 = 1024 * 1024;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ModelPackFile {
    path: String,
    sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ModelPackManifest {
    schema_version: u32,
    pack_id: String,
    pack_version: String,
    engine_id: String,
    engine_version: String,
    operation: String,
    source_languages: Vec<String>,
    target_languages: Vec<String>,
    local: bool,
    license: String,
    files: Vec<ModelPackFile>,
}

fn valid_sha256(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn valid_pack_component(value: &str) -> bool {
    !value.is_empty()
        && value != "."
        && value != ".."
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-'))
}

fn safe_relative_path(value: &str) -> Result<PathBuf, String> {
    let path = Path::new(value);
    if path.is_absolute() {
        return Err(format!("Model-pack path must be relative: {value}"));
    }
    if value.as_bytes().get(1) == Some(&b':') {
        return Err(format!("Model-pack path may not use a drive prefix: {value}"));
    }

    let mut clean = PathBuf::new();
    for component in path.components() {
        match component {
            Component::Normal(part) => {
                let text = part
                    .to_str()
                    .ok_or_else(|| format!("Model-pack path is not valid UTF-8: {value}"))?;
                if !valid_pack_component(text) {
                    return Err(format!("Unsafe model-pack path component: {text}"));
                }
                clean.push(text);
            }
            _ => return Err(format!("Unsafe model-pack path: {value}")),
        }
    }
    if clean.as_os_str().is_empty() {
        return Err("Model-pack path cannot be empty.".into());
    }
    Ok(clean)
}

fn sha256_file(path: &Path) -> Result<String, String> {
    let mut file = fs::File::open(path)
        .map_err(|error| format!("Cannot open model-pack file {}: {error}", path.display()))?;
    let mut hasher = Sha256::new();
    let mut buffer = [0_u8; 1024 * 1024];
    loop {
        let count = file
            .read(&mut buffer)
            .map_err(|error| format!("Cannot read model-pack file {}: {error}", path.display()))?;
        if count == 0 {
            break;
        }
        hasher.update(&buffer[..count]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn read_model_manifest(directory: &Path) -> Result<ModelPackManifest, String> {
    let path = directory.join("manifest.json");
    let metadata = fs::metadata(&path)
        .map_err(|error| format!("Cannot inspect model-pack manifest: {error}"))?;
    if !metadata.is_file() {
        return Err("Model-pack manifest is not a regular file.".into());
    }
    if metadata.len() > MAX_MODEL_MANIFEST_BYTES {
        return Err("Model-pack manifest exceeds the 1 MB safety limit.".into());
    }
    let contents = fs::read_to_string(&path)
        .map_err(|error| format!("Cannot read model-pack manifest: {error}"))?;
    serde_json::from_str(&contents)
        .map_err(|error| format!("Invalid model-pack manifest JSON: {error}"))
}

fn validate_model_pack(directory: &Path) -> Result<ModelPackManifest, String> {
    let manifest = read_model_manifest(directory)?;
    if manifest.schema_version != 1 {
        return Err("Unsupported model-pack schema version.".into());
    }
    if !valid_pack_component(&manifest.pack_id) || !valid_pack_component(&manifest.pack_version) {
        return Err("Invalid model-pack id or version.".into());
    }
    if manifest.engine_id.trim().is_empty() || manifest.engine_version.trim().is_empty() {
        return Err("Model pack must declare an engine id and version.".into());
    }
    if manifest.operation != "translate" {
        return Err("This milestone accepts translation model packs only.".into());
    }
    if !manifest.local {
        return Err("Model pack must declare local=true.".into());
    }
    if !manifest.source_languages.iter().any(|language| language == "English")
        || !manifest.target_languages.iter().any(|language| language == "Hindi")
    {
        return Err("Model pack must support English to Hindi translation.".into());
    }
    if manifest.license.trim().is_empty() || manifest.files.is_empty() {
        return Err("Model pack must declare a license and at least one file.".into());
    }

    let canonical_root = fs::canonicalize(directory)
        .map_err(|error| format!("Cannot resolve model-pack directory: {error}"))?;
    let mut seen = std::collections::HashSet::new();
    for file in &manifest.files {
        if !valid_sha256(&file.sha256) {
            return Err(format!("Invalid SHA-256 for {}.", file.path));
        }
        let relative = safe_relative_path(&file.path)?;
        if !seen.insert(relative.clone()) {
            return Err(format!("Duplicate model-pack file path: {}", file.path));
        }
        let candidate = directory.join(&relative);
        let metadata = fs::metadata(&candidate)
            .map_err(|error| format!("Cannot inspect model-pack file {}: {error}", file.path))?;
        if !metadata.is_file() {
            return Err(format!("Model-pack entry is not a regular file: {}", file.path));
        }
        let canonical_file = fs::canonicalize(&candidate)
            .map_err(|error| format!("Cannot resolve model-pack file {}: {error}", file.path))?;
        if !canonical_file.starts_with(&canonical_root) {
            return Err(format!("Model-pack file escapes its root: {}", file.path));
        }
        let actual = sha256_file(&candidate)?;
        if !actual.eq_ignore_ascii_case(&file.sha256) {
            return Err(format!("SHA-256 mismatch for {}.", file.path));
        }
    }

    Ok(manifest)
}

fn models_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Cannot resolve app data directory: {error}"))?
        .join("models"))
}

#[tauri::command]
fn discover_model_packs(app: tauri::AppHandle) -> Result<String, String> {
    let root = models_root(&app)?;
    if !root.exists() {
        return Ok("[]".into());
    }

    let mut manifests = Vec::new();
    for pack_entry in fs::read_dir(&root)
        .map_err(|error| format!("Cannot scan model directory: {error}"))?
    {
        let pack_entry =
            pack_entry.map_err(|error| format!("Cannot read model directory entry: {error}"))?;
        if !pack_entry.path().is_dir() {
            continue;
        }
        for version_entry in fs::read_dir(pack_entry.path())
            .map_err(|error| format!("Cannot scan model-pack versions: {error}"))?
        {
            let version_entry = version_entry
                .map_err(|error| format!("Cannot read model-pack version entry: {error}"))?;
            if version_entry.path().is_dir() {
                if let Ok(manifest) = validate_model_pack(&version_entry.path()) {
                    manifests.push(manifest);
                }
            }
        }
    }

    serde_json::to_string(&manifests)
        .map_err(|error| format!("Cannot serialize model-pack list: {error}"))
}

fn import_model_pack_inner(source_directory: &str, root: &Path) -> Result<String, String> {
    let source = Path::new(source_directory);
    if !source.is_dir() {
        return Err("Select a model-pack directory containing manifest.json.".into());
    }

    let manifest = validate_model_pack(source)?;
    fs::create_dir_all(root).map_err(|error| format!("Cannot create models directory: {error}"))?;
    let target = root.join(&manifest.pack_id).join(&manifest.pack_version);
    let temporary = root
        .join(&manifest.pack_id)
        .join(format!("{}.importing", manifest.pack_version));

    if temporary.exists() {
        fs::remove_dir_all(&temporary)
            .map_err(|error| format!("Cannot clear incomplete model-pack import: {error}"))?;
    }

    let result = (|| -> Result<String, String> {
        fs::create_dir_all(&temporary)
            .map_err(|error| format!("Cannot create model-pack import directory: {error}"))?;
        fs::copy(source.join("manifest.json"), temporary.join("manifest.json"))
            .map_err(|error| format!("Cannot copy model-pack manifest: {error}"))?;

        for file in &manifest.files {
            let relative = safe_relative_path(&file.path)?;
            let destination = temporary.join(&relative);
            if let Some(parent) = destination.parent() {
                fs::create_dir_all(parent)
                    .map_err(|error| format!("Cannot create model-pack subdirectory: {error}"))?;
            }
            fs::copy(source.join(&relative), &destination)
                .map_err(|error| format!("Cannot copy model-pack file {}: {error}", file.path))?;
        }

        validate_model_pack(&temporary)?;
        if target.exists() {
            fs::remove_dir_all(&target)
                .map_err(|error| format!("Cannot replace installed model pack: {error}"))?;
        }
        fs::rename(&temporary, &target)
            .map_err(|error| format!("Cannot finalize model-pack import: {error}"))?;
        let installed = validate_model_pack(&target)?;
        serde_json::to_string(&installed)
            .map_err(|error| format!("Cannot serialize installed model-pack manifest: {error}"))
    })();

    if result.is_err() && temporary.exists() {
        let _ = fs::remove_dir_all(&temporary);
    }
    result
}

#[tauri::command]
async fn import_model_pack(app: tauri::AppHandle, source_directory: String) -> Result<String, String> {
    let root = models_root(&app)?;
    tauri::async_runtime::spawn_blocking(move || {
        match catch_unwind(AssertUnwindSafe(|| import_model_pack_inner(&source_directory, &root))) {
            Ok(result) => result,
            Err(_) => Err(
                "Model-pack import hit an internal validation error. Nothing was installed; please report this build and the selected pack."
                    .into(),
            ),
        }
    })
    .await
    .map_err(|error| format!("Model-pack validation worker failed: {error}"))?
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn safe_relative_path_accepts_nested_pack_file() {
        assert_eq!(
            safe_relative_path("runtime/odu-translate.exe").unwrap(),
            PathBuf::from("runtime").join("odu-translate.exe")
        );
    }

    #[test]
    fn safe_relative_path_rejects_parent_traversal() {
        assert!(safe_relative_path("../escape.bin").is_err());
    }

    #[test]
    fn safe_relative_path_rejects_drive_prefix() {
        assert!(safe_relative_path("C:/escape.bin").is_err());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_pdf,
            load_sidecar,
            save_sidecar,
            discover_model_packs,
            import_model_pack
        ])
        .run(tauri::generate_context!())
        .expect("error while running Open Document Understanding");
}
