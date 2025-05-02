// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;
use std::process::Command;
use chrono::Local;

#[command]
fn backup_mysql_database(path: String) -> Result<String, String> {
    // Path to mysqldump
    let mysqldump_path = r"C:\Program Files\MariaDB 11.4\bin\mysqldump.exe"; // Adjust this path if needed

    // Get current date and time
    let current_time = Local::now().format("%Y-%m-%d_%H-%M-%S").to_string();

    // Create dynamic output file path with date
    let output_path = format!("{}/backup_{}.sql", path, current_time);

    // Call mysqldump directly
    let output = Command::new(mysqldump_path)
        .arg("--user=root")
        .arg("--password=root")
        .arg("--databases")
        .arg("itqan")
        .arg("--result-file")
        .arg(&output_path) // Using the dynamically generated path
        .output()
        .expect("failed to execute backup command");

    // Check if the command was successful
    if output.status.success() {
        Ok(format!("Backup created successfully: {}", output_path))
    } else {
        Err("Failed to create backup".into())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![backup_mysql_database])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
